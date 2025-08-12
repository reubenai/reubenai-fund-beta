import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';
import { activityService } from '@/services/ActivityService';
import { usePipelineStages } from './usePipelineStages';
import { useQueryCache } from './useQueryCache';
import { stageNameToStatus, statusToDisplayName, createStageKey, stageKeyToStatus, isValidDealStatus } from '@/utils/pipelineMapping';

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
  
  const { stages } = usePipelineStages(fundId);

  const fetchDeals = useCallback(async () => {
    if (!fundId) return;

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

      // Group deals by stage using stage names as keys
      const groupedDeals: Record<string, Deal[]> = {};
      stages.forEach(stage => {
        groupedDeals[stage.name] = [];
      });

      dealsWithNotes?.forEach(dealData => {
        const dealStatus = dealData.status || 'sourced';
        console.log('Processing deal:', dealData.company_name, 'status:', dealStatus);
        
        // Find the matching stage by mapping deal status to stage name
        const matchingStage = stages.find(stage => {
          const mappedStatus = stageNameToStatus(stage.name);
          console.log('Checking stage:', stage.name, 'mapped to:', mappedStatus, 'vs deal status:', dealStatus);
          return mappedStatus === dealStatus;
        });
        
        const stageName = matchingStage ? matchingStage.name : stages[0]?.name || 'Sourced';
        console.log('Deal assigned to stage:', stageName);
        
        if (!groupedDeals[stageName]) {
          groupedDeals[stageName] = [];
        }
        
        // Add notes count
        const deal: Deal = {
          ...dealData,
          notes_count: Array.isArray(dealData.deal_notes) ? dealData.deal_notes.length : 0
        };
        
        groupedDeals[stageName].push(deal);
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
      console.log('=== MOVE DEAL DEBUG ===');
      console.log('Raw parameters:', { dealId, fromStage, toStage });
      console.log('Stage names trimmed:', { 
        fromStage: fromStage.trim(), 
        toStage: toStage.trim() 
      });
      
      // Trim whitespace from stage names
      const cleanFromStage = fromStage.trim();
      const cleanToStage = toStage.trim();
      
      // Get deal info for activity logging
      const deal = deals[cleanFromStage]?.find(d => d.id === dealId);
      console.log('Found deal:', deal ? `${deal.company_name} (${deal.status})` : 'NOT FOUND');
      
      // Convert stage names to database status values
      const toStageStatus = stageNameToStatus(cleanToStage);
      console.log('Stage mapping result:', { 
        inputStage: cleanToStage, 
        mappedStatus: toStageStatus,
        isValid: isValidDealStatus(toStageStatus)
      });
      
      // Validate the mapped status
      if (!isValidDealStatus(toStageStatus)) {
        throw new Error(`Invalid deal status mapped: ${toStageStatus} from stage: ${cleanToStage}`);
      }

      // Optimistic update
      setDeals(prev => {
        const newDeals = { ...prev };
        const dealToMove = newDeals[cleanFromStage]?.find(d => d.id === dealId);
        
        if (dealToMove) {
          console.log('Performing optimistic update:', {
            from: cleanFromStage,
            to: cleanToStage,
            dealName: dealToMove.company_name
          });
          
          newDeals[cleanFromStage] = newDeals[cleanFromStage].filter(d => d.id !== dealId);
          newDeals[cleanToStage] = [...(newDeals[cleanToStage] || []), { 
            ...dealToMove, 
            status: toStageStatus
          }];
        } else {
          console.error('Deal not found for optimistic update');
        }
        
        return newDeals;
      });

      // Update database using the correct enum value
      console.log('Updating database with:', {
        dealId,
        status: toStageStatus,
        fundId
      });
      
      const { data, error } = await supabase
        .from('deals')
        .update({ 
          status: toStageStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', dealId)
        .select('id, company_name, status');

      if (error) {
        console.error('Database update error:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw new Error(`Database update failed: ${error.message}`);
      }
      
      console.log('Database update successful:', data);

      // Log activity
      if (deal && fundId) {
        await activityService.logDealStageChanged(
          fundId,
          dealId,
          deal.company_name,
          cleanFromStage,
          cleanToStage
        );
      }

      console.log('=== MOVE DEAL SUCCESS ===');
      toast({
        title: "Deal moved",
        description: `${deal?.company_name || 'Deal'} moved to ${cleanToStage}`,
      });
    } catch (error) {
      console.error('=== MOVE DEAL ERROR ===');
      console.error('Error moving deal:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: "Error",
        description: `Failed to move deal: ${errorMessage}`,
        variant: "destructive"
      });
      
      // Revert optimistic update
      console.log('Reverting optimistic update...');
      fetchDeals();
    }
  }, [stages, toast, fetchDeals, deals, fundId]);

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
        linkedin_url: dealData.linkedin_url || null,
        crunchbase_url: dealData.crunchbase_url || null,
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

      // Add to local state - find the sourced stage
      const sourcedStage = stages.find(stage => stageNameToStatus(stage.name) === 'sourced');
      const stageName = sourcedStage ? sourcedStage.name : 'Sourced';
      
      setDeals(prev => ({
        ...prev,
        [stageName]: [...(prev[stageName] || []), data]
      }));

      // Log activity
      await activityService.logDealCreated(
        fundId,
        data.id,
        data.company_name,
        {
          industry: data.industry,
          location: data.location,
          deal_size: data.deal_size,
          valuation: data.valuation
        }
      );

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