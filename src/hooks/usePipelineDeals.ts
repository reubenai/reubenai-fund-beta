import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';
import { useActivityTracking } from './useActivityTracking';
import { usePipelineStages } from './usePipelineStages';
import { useQueryCache } from './useQueryCache';
import { stageNameToStatus, statusToDisplayName, createStageKey, stageKeyToStatus } from '@/utils/pipelineMapping';

export type Deal = Database['public']['Tables']['deals']['Row'] & {
  notes_count?: number;
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

export const usePipelineDeals = (fundId?: string) => {
  const [deals, setDeals] = useState<Record<string, Deal[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const { logDealStageChanged, logDealCreated } = useActivityTracking();
  const { stages } = usePipelineStages(fundId);

  const fetchDeals = useCallback(async () => {
    if (!fundId) return;
    if (stages.length === 0) return;

    try {
      setLoading(true);
      
      // First get deals with notes count
      const { data: dealsWithNotes, error: dealsError } = await supabase
        .from('deals')
        .select(`
          *,
          deal_notes(count)
        `)
        .eq('fund_id', fundId)
        .order('updated_at', { ascending: false });

      if (dealsError) throw dealsError;

      // Group deals by stage and add computed fields
      const groupedDeals: Record<string, Deal[]> = {};
      stages.forEach(stage => {
        const stageKey = createStageKey(stage.name);
        groupedDeals[stageKey] = [];
      });

      dealsWithNotes?.forEach(dealData => {
        const dealStatus = dealData.status || 'sourced';
        // Find the matching stage by converting status to display name
        const displayName = statusToDisplayName(dealStatus);
        const matchingStage = stages.find(stage => stage.name === displayName);
        const stageKey = matchingStage 
          ? createStageKey(matchingStage.name)
          : dealStatus;
        
        if (!groupedDeals[stageKey]) {
          groupedDeals[stageKey] = [];
        }
        
        // Add notes count
        const deal: Deal = {
          ...dealData,
          notes_count: Array.isArray(dealData.deal_notes) ? dealData.deal_notes.length : 0
        };
        
        groupedDeals[stageKey].push(deal);
      });

      setDeals(groupedDeals);
    } catch (error) {
      console.error('Error fetching deals:', error);
      toast({
        title: "Error",
        description: "Failed to load deals",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [fundId, stages, toast]);

  const moveDeal = useCallback(async (dealId: string, fromStage: string, toStage: string) => {
    try {
      // Get deal info for activity logging
      const deal = deals[fromStage]?.find(d => d.id === dealId);
      const fromStageName = stages.find(s => createStageKey(s.name) === fromStage)?.name || fromStage;
      const toStageName = stages.find(s => createStageKey(s.name) === toStage)?.name || toStage;
      
      // Convert stage names to database status values
      const fromStageStatus = stageKeyToStatus(fromStage);
      const toStageStatus = stageKeyToStatus(toStage);

      // Optimistic update
      setDeals(prev => {
        const newDeals = { ...prev };
        const dealToMove = newDeals[fromStage]?.find(d => d.id === dealId);
        
        if (dealToMove) {
          newDeals[fromStage] = newDeals[fromStage].filter(d => d.id !== dealId);
          newDeals[toStage] = [...(newDeals[toStage] || []), { 
            ...dealToMove, 
            status: toStageStatus
          }];
        }
        
        return newDeals;
      });

      // Update database using the correct enum value
      const { error } = await supabase
        .from('deals')
        .update({ 
          status: toStageStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', dealId);

      if (error) throw error;

      // Log activity
      if (deal && fundId) {
        await logDealStageChanged(dealId, deal.company_name, fromStageName, toStageName);
      }

      toast({
        title: "Deal moved",
        description: `Deal moved to ${toStageName}`,
      });
    } catch (error) {
      console.error('Error moving deal:', error);
      toast({
        title: "Error",
        description: "Failed to move deal",
        variant: "destructive"
      });
      // Revert optimistic update
      fetchDeals();
    }
  }, [stages, toast, fetchDeals, deals, fundId, logDealStageChanged]);

  const addDeal = useCallback(async (dealData: Partial<Deal> & { company_name: string; created_by: string }) => {
    if (!fundId) return;

    try {
      const insertData: Database['public']['Tables']['deals']['Insert'] = {
        company_name: dealData.company_name,
        created_by: dealData.created_by,
        fund_id: fundId,
        status: 'sourced',
        description: dealData.description || null,
        industry: dealData.industry || null,
        location: dealData.location || null,
        website: dealData.website || null,
        deal_size: dealData.deal_size || null,
        valuation: dealData.valuation || null,
        currency: dealData.currency || null
      };

      const { data, error } = await supabase
        .from('deals')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      setDeals(prev => ({
        ...prev,
        sourced: [...(prev.sourced || []), data]
      }));

      // Log activity
      await logDealCreated(data.id, data.company_name, {
        industry: data.industry,
        location: data.location,
        deal_size: data.deal_size,
        valuation: data.valuation
      });

      toast({
        title: "Deal added",
        description: `${data.company_name} added to pipeline`,
      });

      return data;
    } catch (error) {
      console.error('Error adding deal:', error);
      toast({
        title: "Error",
        description: "Failed to add deal",
        variant: "destructive"
      });
    }
  }, [fundId, toast, logDealCreated]);

  const filteredDeals = useCallback(() => {
    if (!searchQuery) return deals;

    const filtered: Record<string, Deal[]> = {};
    Object.keys(deals).forEach(stage => {
      filtered[stage] = deals[stage].filter(deal =>
        deal.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deal.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deal.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
    return filtered;
   }, [deals, searchQuery]);

  // Only fetch deals when we have stages loaded
  useEffect(() => {
    if (fundId && stages.length > 0) {
      fetchDeals();
    }
  }, [fundId, stages.length]); // Remove fetchDeals from deps to avoid infinite loop

  // Set up real-time subscription
  useEffect(() => {
    if (!fundId) return;

    const subscription = supabase
      .channel('deals_channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'deals',
        filter: `fund_id=eq.${fundId}`
      }, () => {
        fetchDeals();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fundId, fetchDeals]);

  return {
    deals: filteredDeals(),
    stages,
    loading,
    searchQuery,
    setSearchQuery,
    moveDeal,
    addDeal,
    refreshDeals: fetchDeals
  };
};