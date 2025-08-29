import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AnalysisQueueOptions {
  priority?: 'high' | 'normal' | 'low';
  delayMinutes?: number;
  triggerReason?: string;
  immediate?: boolean;
}

export function useEnhancedAnalysisQueue() {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const queueDealAnalysis = useCallback(async (
    dealId: string,
    options: AnalysisQueueOptions = {}
  ) => {
    const {
      priority = 'normal',
      delayMinutes = 0, // Default to immediate
      triggerReason = 'manual',
      immediate = true
    } = options;

    try {
      setIsProcessing(true);
      
      const { data, error } = await supabase
        .rpc('queue_deal_analysis', {
          deal_id_param: dealId,
          trigger_reason_param: triggerReason,
          priority_param: priority,
          delay_minutes: delayMinutes
        });

      if (error) throw error;

      // If immediate processing requested, trigger queue processor immediately
      if (immediate) {
        console.log('🚀 Triggering immediate queue processing...');
        
        const { data: processResult, error: processError } = await supabase.functions.invoke('universal-analysis-processor');
        
        if (processError) {
          console.error('❌ Immediate processing failed:', processError);
          toast({
            title: "Analysis Queued",
            description: "Analysis queued but immediate processing failed. Will retry automatically.",
            variant: "default"
          });
        } else {
          console.log('✅ Immediate processing triggered:', processResult);
          toast({
            title: "Analysis Started",
            description: "Deal analysis is now running with real AI engines",
            variant: "default"
          });
        }
      } else {
        toast({
          title: "Analysis Queued",
          description: `Deal analysis scheduled for ${delayMinutes} minutes from now`,
          variant: "default"
        });
      }

      return { success: true, queueId: data };
    } catch (error) {
      console.error('Error queueing analysis:', error);
      toast({
        title: "Queue Error", 
        description: "Failed to queue analysis. Please try again.",
        variant: "destructive"
      });
      return { success: false, error: error.message };
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const processBacklog = useCallback(async () => {
    try {
      setIsProcessing(true);
      console.log('🔄 Processing analysis backlog...');
      
      toast({
        title: "Processing Backlog",
        description: "Clearing queued analyses...",
        variant: "default"
      });

      // Use the universal processor to handle all pending items
      const { data, error } = await supabase.functions.invoke('universal-analysis-processor');
      
      if (error) {
        console.error('❌ Backlog processing failed:', error);
        toast({
          title: "Backlog Processing Failed",
          description: error.message || "Failed to process backlog",
          variant: "destructive"
        });
        return { success: false, error: error.message };
      }

      console.log('✅ Backlog processing completed:', data);
      
      toast({
        title: "Backlog Processed",
        description: `Processed ${data?.summary?.total_processed || 0} queued analyses`,
        variant: "default"
      });

      return { success: true, result: data };
    } catch (error) {
      console.error('Error processing backlog:', error);
      toast({
        title: "Processing Error",
        description: "Failed to process analysis backlog",
        variant: "destructive"
      });
      return { success: false, error: error.message };
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const forceAnalysisNow = useCallback(async (dealId: string) => {
    try {
      setIsProcessing(true);
      console.log('⚡ Forcing immediate analysis for deal:', dealId);
      
      toast({
        title: "Analysis Starting",
        description: "Running comprehensive AI analysis now...",
        variant: "default"
      });

      // Queue with immediate processing
      const result = await queueDealAnalysis(dealId, {
        priority: 'high',
        delayMinutes: 0,
        triggerReason: 'manual_immediate',
        immediate: true
      });

      return result;
    } catch (error) {
      console.error('Error forcing immediate analysis:', error);
      return { success: false, error: error.message };
    } finally {
      setIsProcessing(false);
    }
  }, [queueDealAnalysis]);

  const getQueueStatus = useCallback(async (dealId: string) => {
    try {
      const { data, error } = await supabase
        .from('analysis_queue')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false })
        .limit(5); // Get last 5 queue entries

      if (error) throw error;
      
      return { success: true, queueItems: data };
    } catch (error) {
      console.error('Error getting queue status:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const getQueueStats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('analysis_queue')
        .select('status, priority, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        queued: data?.filter(item => item.status === 'queued').length || 0,
        processing: data?.filter(item => item.status === 'processing').length || 0,
        completed: data?.filter(item => item.status === 'completed').length || 0,
        failed: data?.filter(item => item.status === 'failed').length || 0
      };
      
      return { success: true, stats };
    } catch (error) {
      console.error('Error getting queue stats:', error);
      return { success: false, error: error.message };
    }
  }, []);

  return {
    queueDealAnalysis,
    forceAnalysisNow,
    processBacklog,
    getQueueStatus,
    getQueueStats,
    isProcessing
  };
}