import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useDealsCache } from '@/hooks/useCache';
import { Database } from '@/integrations/supabase/types';
import { activityService } from '@/services/ActivityService';
import { usePipelineStages } from './usePipelineStages';
import { stageNameToStatus, statusToDisplayName, createStageKey, stageKeyToStatus } from '@/utils/pipelineMapping';

export type Deal = Database['public']['Tables']['deals']['Row'] & {
  notes_count?: number;
  deal_analyses?: Array<Database['public']['Tables']['deal_analyses']['Row']>;
};

export interface PipelineStage {
  id: string;
  name: string;
  color: string;
  position: number;
  is_default?: boolean;
  description?: string;
  fund_id: string;
  created_at: string;
  updated_at: string;
}

export const useOptimizedPipelineDeals = (fundId?: string) => {
  const [deals, setDeals] = useState<Record<string, Deal[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const { toast } = useToast();
  const { handleAsyncError } = useErrorHandler();
  
  const { stages } = usePipelineStages(fundId);
  const cache = useDealsCache(fundId || '');

  const pageSize = 50; // Pagination

  const fetchDeals = useCallback(async (forceRefresh = false) => {
    if (!fundId) return;

    const cacheKey = `deals_${fundId}_page_${page}`;
    
    const result = await handleAsyncError(async () => {
      return await cache.fetchWithCache(cacheKey, async () => {
        setLoading(true);
        
        const offset = (page - 1) * pageSize;
        
        // Optimized query with pagination
        const { data: dealsData, error: dealsError } = await supabase
          .from('deals')
          .select(`
            *,
            deal_notes(count),
            deal_analyses(
              id,
              overall_score,
              analyzed_at,
              thesis_alignment_score
            )
          `)
          .eq('fund_id', fundId)
          .order('updated_at', { ascending: false })
          .range(offset, offset + pageSize - 1);

        if (dealsError) throw dealsError;

        // Check if we have more data
        setHasMore((dealsData?.length || 0) === pageSize);

        return dealsData || [];
      }, forceRefresh);
    }, { title: 'Failed to load deals' });

    if (!result) return;

    // Transform deals with notes count
    const dealsWithCounts = (result as any[]).map((dealData: any) => ({
      ...dealData,
      notes_count: Array.isArray(dealData.deal_notes) ? dealData.deal_notes.length : 0
    })) as Deal[];

    // Group by status
    const groupedDeals = dealsWithCounts.reduce((acc, deal) => {
      const status = deal.status || 'sourced';
      if (!acc[status]) acc[status] = [];
      acc[status].push(deal);
      return acc;
    }, {} as Record<string, Deal[]>);

    if (page === 1) {
      setDeals(groupedDeals);
    } else {
      // Append to existing deals for pagination
      setDeals(prev => {
        const updated = { ...prev };
        Object.entries(groupedDeals).forEach(([status, newDeals]) => {
          updated[status] = [...(updated[status] || []), ...newDeals];
        });
        return updated;
      });
    }

    setLoading(false);
  }, [fundId, page, cache, handleAsyncError, pageSize]);

  // Debounced search
  const filteredDeals = useMemo(() => {
    if (!searchQuery.trim()) return deals;

    const query = searchQuery.toLowerCase();
    const filtered: Record<string, Deal[]> = {};

    Object.entries(deals).forEach(([status, statusDeals]) => {
      const matchingDeals = statusDeals.filter(deal => 
        deal.company_name?.toLowerCase().includes(query) ||
        deal.industry?.toLowerCase().includes(query) ||
        deal.location?.toLowerCase().includes(query) ||
        deal.description?.toLowerCase().includes(query) ||
        deal.founder?.toLowerCase().includes(query)
      );
      
      if (matchingDeals.length > 0) {
        filtered[status] = matchingDeals;
      }
    });

    return filtered;
  }, [deals, searchQuery]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  }, [hasMore, loading]);

  const refreshDeals = useCallback(async () => {
    cache.invalidate(`deals_${fundId}`);
    setPage(1);
    await fetchDeals(true);
  }, [cache, fundId, fetchDeals]);

  const moveDeal = useCallback(async (dealId: string, fromStage: string, toStage: string, newPosition?: number) => {
    const result = await handleAsyncError(async () => {
      // Convert stage key to proper database status
      const toStageStatus = stageKeyToStatus(toStage);
      
      const { error } = await supabase
        .from('deals')
        .update({ 
          status: toStageStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', dealId);

      if (error) throw error;

      // Update local state optimistically
      setDeals(prev => {
        const updated = { ...prev };
        let movedDeal: Deal | null = null;

        // Remove from old status
        Object.entries(updated).forEach(([status, statusDeals]) => {
          const dealIndex = statusDeals.findIndex(d => d.id === dealId);
          if (dealIndex >= 0) {
            movedDeal = statusDeals[dealIndex];
            updated[status] = statusDeals.filter(d => d.id !== dealId);
          }
        });

        // Add to new status
        if (movedDeal) {
          movedDeal.status = toStageStatus;
          if (!updated[toStage]) updated[toStage] = [];
          
          if (newPosition !== undefined) {
            updated[toStage].splice(newPosition, 0, movedDeal);
          } else {
            updated[toStage].unshift(movedDeal);
          }
        }

        return updated;
      });

      // Log activity
      if (fundId) {
        const fromStageName = stages.find(s => createStageKey(s.name) === fromStage)?.name || fromStage;
        const toStageName = stages.find(s => createStageKey(s.name) === toStage)?.name || toStage;
        const companyName = Object.values(deals).flat().find(d => d.id === dealId)?.company_name || '';
        await activityService.logDealStageChanged(fundId, dealId, companyName, fromStageName, toStageName);
      }
      
      // Invalidate cache
      cache.invalidate(`deals_${fundId}`);

      return true;
    }, { title: 'Failed to move deal' });

    if (result) {
      const toStageName = stages.find(s => createStageKey(s.name) === toStage)?.name || toStage;
      toast({
        title: 'Deal moved',
        description: `Deal moved to ${toStageName}`,
      });
    }
  }, [handleAsyncError, toast, cache, fundId, stages, deals]);

  const addDeal = useCallback(async (dealData: Partial<Deal>) => {
    if (!fundId) return null;

    const result = await handleAsyncError(async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Prepare deal data
      const newDeal = {
        company_name: dealData.company_name || '',
        fund_id: fundId,
        created_by: user.id,
        status: 'sourced' as any,
        industry: dealData.industry,
        location: dealData.location,
        description: dealData.description,
        website: dealData.website,
        linkedin_url: dealData.linkedin_url,
        deal_size: dealData.deal_size,
        valuation: dealData.valuation,
        founder: dealData.founder
      };

      const { data, error } = await supabase
        .from('deals')
        .insert(newDeal)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setDeals(prev => ({
        ...prev,
        sourced: [data, ...(prev.sourced || [])]
      }));

      // Log activity
      if (data) {
        await activityService.logDealCreated(
          fundId,
          data.id,
          data.company_name || '',
          {
            industry: data.industry,
            location: data.location,
            deal_size: data.deal_size,
            valuation: data.valuation
          }
        );
      }
      
      // Invalidate cache
      cache.invalidate(`deals_${fundId}`);

      return data;
    }, { title: 'Failed to add deal' });

    if (result) {
      toast({
        title: 'Deal added',
        description: `${result.company_name} has been added to your pipeline`,
      });
    }

    return result;
  }, [fundId, handleAsyncError, toast, cache]);

  const deleteDeal = useCallback(async (dealId: string) => {
    const result = await handleAsyncError(async () => {
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', dealId);

      if (error) throw error;

      // Update local state
      setDeals(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(status => {
          updated[status] = updated[status].filter(d => d.id !== dealId);
        });
        return updated;
      });

      // Invalidate cache
      cache.invalidate(`deals_${fundId}`);

      return true;
    }, { title: 'Failed to delete deal' });

    if (result) {
      toast({
        title: 'Deal deleted',
        description: 'Deal has been removed from your pipeline',
      });
    }
  }, [handleAsyncError, toast, cache, fundId]);

  // Load deals when fundId or page changes
  useEffect(() => {
    if (fundId) {
      fetchDeals();
    }
  }, [fundId, fetchDeals]);

  // Real-time subscriptions
  useEffect(() => {
    if (!fundId) return;

    const subscription = supabase
      .channel(`deals_${fundId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'deals',
        filter: `fund_id=eq.${fundId}`
      }, () => {
        // Refresh deals when changes occur
        refreshDeals();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fundId, refreshDeals]);

  return {
    deals: filteredDeals,
    loading,
    searchQuery,
    setSearchQuery,
    stages,
    moveDeal,
    addDeal,
    deleteDeal,
    refreshDeals,
    loadMore,
    hasMore,
    page,
    setPage
  };
};