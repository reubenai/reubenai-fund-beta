import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAnalysisSystemKillSwitch } from './useAnalysisSystemKillSwitch';
import { useEmergencyDealChecker } from './useEmergencyDealChecker';

interface AnalysisQueueOptions {
  priority?: 'high' | 'normal' | 'low';
  delayMinutes?: number;
  triggerReason?: string;
}

export function useAnalysisQueue() {
  const { toast } = useToast();
  const { isAnalysisDisabled, isDealBlocked } = useAnalysisSystemKillSwitch();
  const { checkDealStatus } = useEmergencyDealChecker();

  const queueDealAnalysis = useCallback(async (
    dealId: string,
    options: AnalysisQueueOptions = {}
  ) => {
    // 🚨 EMERGENCY CHECK: Hard block for blacklisted deals
    if (isDealBlocked(dealId)) {
      console.log(`🚫 EMERGENCY BLOCK: Queue blocked for blacklisted deal ${dealId}`);
      toast({
        title: "Analysis Blocked",
        description: "This deal is currently blocked from analysis due to system protection",
        variant: "destructive"
      });
      return { success: false, error: 'Deal is emergency blocked' };
    }

    // HARD SHUTDOWN: Analysis system disabled
    if (isAnalysisDisabled) {
      toast({
        title: "Analysis System Disabled",
        description: "Deal analysis has been shut down",
        variant: "destructive"
      });
      return { success: false, error: "Analysis system disabled" };
    }

    // Double-check with comprehensive emergency status
    try {
      const emergencyStatus = await checkDealStatus(dealId);
      if (emergencyStatus.blocked) {
        console.log(`🚫 COMPREHENSIVE BLOCK: Deal ${dealId} blocked - ${emergencyStatus.reason}`);
        toast({
          title: "Analysis Blocked",
          description: emergencyStatus.message || "Analysis is currently blocked for this deal",
          variant: "destructive"
        });
        return { success: false, error: emergencyStatus.reason };
      }
    } catch (error) {
      console.error('Emergency check failed:', error);
      // Continue with fallback for non-critical errors
    }

    const {
      priority = 'normal',
      delayMinutes = 5,
      triggerReason = 'manual'
    } = options;

    try {
      const { data, error } = await supabase
        .rpc('queue_deal_analysis', {
          deal_id_param: dealId,
          trigger_reason_param: triggerReason,
          priority_param: priority,
          delay_minutes: delayMinutes
        });

      if (error) throw error;

      toast({
        title: "Analysis Queued",
        description: `Deal analysis scheduled for ${delayMinutes} minutes from now`,
        variant: "default"
      });

      return { success: true, queueId: data };
    } catch (error) {
      console.error('Error queueing analysis:', error);
      toast({
        title: "Queue Error", 
        description: "Failed to queue analysis. Please try again.",
        variant: "destructive"
      });
      return { success: false, error: error.message };
    }
  }, [toast, isDealBlocked, isAnalysisDisabled, checkDealStatus]);

  const getQueueStatus = useCallback(async (dealId: string) => {
    try {
      const { data, error } = await supabase
        .from('analysis_queue')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return { success: true, queueItem: data };
    } catch (error) {
      console.error('Error getting queue status:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const cancelQueuedAnalysis = useCallback(async (queueId: string) => {
    try {
      const { error } = await supabase
        .from('analysis_queue')
        .update({ 
          status: 'failed',
          error_message: 'Cancelled by user',
          completed_at: new Date().toISOString()
        })
        .eq('id', queueId)
        .eq('status', 'queued'); // Only cancel if still queued

      if (error) throw error;

      toast({
        title: "Analysis Cancelled",
        description: "Queued analysis has been cancelled",
        variant: "default"
      });

      return { success: true };
    } catch (error) {
      console.error('Error cancelling analysis:', error);
      toast({
        title: "Cancel Error",
        description: "Failed to cancel analysis",
        variant: "destructive"
      });
      return { success: false, error: error.message };
    }
  }, [toast]);

  const forceAnalysisNow = useCallback(async (dealId: string) => {
    // 🚨 EMERGENCY CHECK: Hard block for blacklisted deals
    if (isDealBlocked(dealId)) {
      console.log(`🚫 EMERGENCY BLOCK: Force analysis blocked for blacklisted deal ${dealId}`);
      toast({
        title: "Analysis Blocked",
        description: "This deal is currently blocked from analysis due to system protection",
        variant: "destructive"
      });
      return { success: false, error: 'Deal is emergency blocked' };
    }

    // HARD SHUTDOWN: Analysis system disabled
    if (isAnalysisDisabled) {
      toast({
        title: "Analysis System Disabled",
        description: "Deal analysis has been shut down",
        variant: "destructive"
      });
      return { success: false, error: "Analysis system disabled" };
    }

    try {
      // Queue with 0 delay and high priority
      const result = await queueDealAnalysis(dealId, {
        priority: 'high',
        delayMinutes: 0,
        triggerReason: 'manual_immediate'
      });

      if (result.success) {
        toast({
          title: "Analysis Started",
          description: "Deal analysis has been initiated immediately",
          variant: "default"
        });
      }

      return result;
    } catch (error) {
      console.error('Error forcing immediate analysis:', error);
      return { success: false, error: error.message };
    }
  }, [queueDealAnalysis, toast, isDealBlocked, isAnalysisDisabled]);

  const toggleAutoAnalysis = useCallback(async (dealId: string, enabled: boolean, onSuccess?: () => void) => {
    try {
      console.log(`🔄 Toggling auto-analysis for deal ${dealId} to ${enabled}`);
      
      const { error } = await supabase
        .from('deals')
        .update({ auto_analysis_enabled: enabled })
        .eq('id', dealId);

      if (error) throw error;

      console.log(`✅ Auto-analysis successfully toggled for deal ${dealId}`);
      
      toast({
        title: enabled ? "Auto-Analysis Enabled" : "Auto-Analysis Disabled",
        description: enabled 
          ? "Deal will be automatically analyzed when updated"
          : "Deal will not be automatically analyzed",
        variant: "default"
      });

      // Call success callback to trigger data refresh
      if (onSuccess) {
        onSuccess();
      }

      return { success: true };
    } catch (error) {
      console.error('Error toggling auto-analysis:', error);
      toast({
        title: "Update Error",
        description: `Failed to update auto-analysis setting: ${error.message}`,
        variant: "destructive"
      });
      return { success: false, error: error.message };
    }
  }, [toast]);

  return {
    queueDealAnalysis,
    getQueueStatus,
    cancelQueuedAnalysis,
    forceAnalysisNow,
    toggleAutoAnalysis
  };
}