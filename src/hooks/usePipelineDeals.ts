import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

export type Deal = Database['public']['Tables']['deals']['Row'];

export interface PipelineStage {
  id: string;
  title: string;
  color: string;
  position: number;
  isCustom?: boolean;
}

const defaultStages: PipelineStage[] = [
  { id: 'sourced', title: 'Sourced', color: '#6B7280', position: 0 },
  { id: 'screening', title: 'Screening', color: '#F59E0B', position: 1 },
  { id: 'due_diligence', title: 'Due Diligence', color: '#3B82F6', position: 2 },
  { id: 'investment_committee', title: 'Investment Committee', color: '#8B5CF6', position: 3 },
  { id: 'approved', title: 'Approved', color: '#10B981', position: 4 },
  { id: 'invested', title: 'Invested', color: '#059669', position: 5 },
  { id: 'rejected', title: 'Rejected', color: '#EF4444', position: 6 }
];

export const usePipelineDeals = (fundId?: string) => {
  const [deals, setDeals] = useState<Record<string, Deal[]>>({});
  const [stages, setStages] = useState<PipelineStage[]>(defaultStages);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const fetchDeals = useCallback(async () => {
    if (!fundId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('fund_id', fundId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Group deals by stage
      const groupedDeals: Record<string, Deal[]> = {};
      stages.forEach(stage => {
        groupedDeals[stage.id] = [];
      });

      data?.forEach(deal => {
        const stage = deal.status || 'sourced';
        if (!groupedDeals[stage]) {
          groupedDeals[stage] = [];
        }
        groupedDeals[stage].push(deal);
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
      // Optimistic update
      setDeals(prev => {
        const newDeals = { ...prev };
        const deal = newDeals[fromStage]?.find(d => d.id === dealId);
        
        if (deal) {
          newDeals[fromStage] = newDeals[fromStage].filter(d => d.id !== dealId);
          newDeals[toStage] = [...(newDeals[toStage] || []), { 
            ...deal, 
            status: toStage as Database['public']['Enums']['deal_status']
          }];
        }
        
        return newDeals;
      });

      // Update database
      const { error } = await supabase
        .from('deals')
        .update({ 
          status: toStage as Database['public']['Enums']['deal_status'],
          updated_at: new Date().toISOString()
        })
        .eq('id', dealId);

      if (error) throw error;

      toast({
        title: "Deal moved",
        description: `Deal moved to ${stages.find(s => s.id === toStage)?.title}`,
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
  }, [stages, toast, fetchDeals]);

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
  }, [fundId, toast]);

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

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

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