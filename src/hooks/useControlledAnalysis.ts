import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AnalysisCatalyst {
  type: 'document_upload' | 'note_added' | 'manual_trigger' | 'bulk_refresh' | 'first_upload';
  dealId: string;
  metadata?: any;
}

interface ControlledAnalysisOptions {
  forceOverride?: boolean;
  batchSize?: number;
}

export function useControlledAnalysis() {
  const { toast } = useToast();

  const checkAnalysisEligibility = useCallback(async (
    dealId: string,
    catalystType: string
  ): Promise<{
    allowed: boolean;
    reason?: string;
    priority?: string;
    delay_minutes?: number;
  }> => {
    try {
      const { data, error } = await supabase
        .rpc('should_queue_analysis', {
          p_deal_id: dealId,
          p_catalyst_type: catalystType,
          p_user_id: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;
      return data as any;
    } catch (error) {
      console.error('Error checking analysis eligibility:', error);
      return { allowed: false, reason: 'Failed to check eligibility' };
    }
  }, []);

  const triggerAnalysis = useCallback(async (
    catalyst: AnalysisCatalyst,
    options: ControlledAnalysisOptions = {}
  ) => {
    try {
      // Check if analysis is allowed
      const eligibility = await checkAnalysisEligibility(catalyst.dealId, catalyst.type);
      
      if (!eligibility.allowed && !options.forceOverride) {
        toast({
          title: "Analysis Not Allowed",
          description: eligibility.reason,
          variant: "destructive"
        });
        return { success: false, reason: eligibility.reason };
      }

      // Log the catalyst
      const { data: catalystData, error: catalystError } = await supabase
        .from('deal_analysis_catalysts')
        .insert({
          deal_id: catalyst.dealId,
          catalyst_type: catalyst.type,
          triggered_by: (await supabase.auth.getUser()).data.user?.id,
          metadata: catalyst.metadata || {}
        })
        .select()
        .single();

      if (catalystError) throw catalystError;

      // Queue the analysis
      const { data: queueData, error: queueError } = await supabase
        .rpc('queue_deal_analysis', {
          deal_id_param: catalyst.dealId,
          trigger_reason_param: catalyst.type,
          priority_param: eligibility.priority || 'normal',
          delay_minutes: eligibility.delay_minutes || 5
        });

      if (queueError) throw queueError;

      // Update catalyst with queue ID
      await supabase
        .from('deal_analysis_catalysts')
        .update({ 
          analysis_queued: true,
          queue_id: queueData
        })
        .eq('id', catalystData.id);

      // Update deal first analysis flag if this is first upload
      if (catalyst.type === 'first_upload') {
        await supabase
          .from('deals')
          .update({ 
            first_analysis_completed: true,
            last_analysis_trigger_reason: catalyst.type
          })
          .eq('id', catalyst.dealId);
      }

      toast({
        title: "Analysis Queued",
        description: `Analysis scheduled for ${eligibility.delay_minutes || 5} minutes`,
        variant: "default"
      });

      return { success: true, queueId: queueData, catalystId: catalystData.id };
    } catch (error) {
      console.error('Error triggering controlled analysis:', error);
      toast({
        title: "Analysis Error",
        description: "Failed to queue analysis. Please try again.",
        variant: "destructive"
      });
      return { success: false, error: error.message };
    }
  }, [checkAnalysisEligibility, toast]);

  const triggerBulkAnalysis = useCallback(async (
    dealIds: string[],
    options: ControlledAnalysisOptions = {}
  ) => {
    const maxBatchSize = options.batchSize || 5;
    
    if (dealIds.length > maxBatchSize) {
      toast({
        title: "Batch Size Exceeded",
        description: `Maximum ${maxBatchSize} deals can be analyzed at once`,
        variant: "destructive"
      });
      return { success: false, reason: 'Batch size exceeded' };
    }

    const results = [];
    
    for (const dealId of dealIds) {
      const result = await triggerAnalysis({
        type: 'bulk_refresh',
        dealId,
        metadata: { batch_size: dealIds.length, batch_timestamp: new Date() }
      }, options);
      
      results.push({ dealId, ...result });
      
      // Add small delay between requests to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;

    toast({
      title: "Bulk Analysis Complete",
      description: `${successCount} analyses queued, ${failCount} failed`,
      variant: successCount > 0 ? "default" : "destructive"
    });

    return { success: successCount > 0, results };
  }, [triggerAnalysis, toast]);

  const getAnalysisHistory = useCallback(async (dealId: string) => {
    try {
      const { data, error } = await supabase
        .from('deal_analysis_catalysts')
        .select(`
          *,
          analysis_queue(status, scheduled_for, completed_at, error_message)
        `)
        .eq('deal_id', dealId)
        .order('triggered_at', { ascending: false });

      if (error) throw error;
      return { success: true, history: data || [] };
    } catch (error) {
      console.error('Error fetching analysis history:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const blockAnalysis = useCallback(async (
    dealId: string, 
    blockUntil: Date,
    reason: string
  ) => {
    try {
      const { error } = await supabase
        .from('deals')
        .update({
          analysis_blocked_until: blockUntil.toISOString(),
          last_analysis_trigger_reason: `blocked: ${reason}`
        })
        .eq('id', dealId);

      if (error) throw error;

      toast({
        title: "Analysis Blocked",
        description: `Analysis blocked until ${blockUntil.toLocaleDateString()}`,
        variant: "default"
      });

      return { success: true };
    } catch (error) {
      console.error('Error blocking analysis:', error);
      return { success: false, error: error.message };
    }
  }, [toast]);

  return {
    triggerAnalysis,
    triggerBulkAnalysis,
    checkAnalysisEligibility,
    getAnalysisHistory,
    blockAnalysis
  };
}