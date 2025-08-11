import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useAnalysisQueueManager() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [queueStats, setQueueStats] = useState<any>(null);
  const { toast } = useToast();

  const getQueueStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('analysis_queue')
        .select('status, priority, created_at, attempts, error_message')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        queued: data?.filter(item => item.status === 'queued').length || 0,
        processing: data?.filter(item => item.status === 'processing').length || 0,
        completed: data?.filter(item => item.status === 'completed').length || 0,
        failed: data?.filter(item => item.status === 'failed').length || 0,
        high_priority: data?.filter(item => item.priority === 'high').length || 0,
        recent_failures: data?.filter(item => 
          item.status === 'failed' && 
          new Date(item.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        ).length || 0
      };

      setQueueStats(stats);
      return stats;
    } catch (error) {
      console.error('Error getting queue status:', error);
      return null;
    }
  }, []);

  const processQueue = useCallback(async (batchSize = 10) => {
    try {
      setIsProcessing(true);
      console.log('🔄 Starting controlled queue processing...');

      const { data, error } = await supabase.functions.invoke('analysis-queue-processor');

      if (error) {
        console.error('❌ Queue processing failed:', error);
        toast({
          title: "Queue Processing Failed",
          description: error.message || "Could not process analysis queue",
          variant: "destructive"
        });
        return false;
      }

      console.log('✅ Queue processing completed:', data);
      toast({
        title: "Queue Processed",
        description: `Processed ${data?.processed || 0} items (${data?.successful || 0} successful, ${data?.failed || 0} failed)`,
      });

      // Refresh queue stats
      await getQueueStatus();
      return true;
    } catch (error) {
      console.error('❌ Queue processing error:', error);
      toast({
        title: "Processing Error",
        description: "An unexpected error occurred during queue processing",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [toast, getQueueStatus]);

  const reclaimZombieJobs = useCallback(async () => {
    try {
      console.log('🧹 Reclaiming zombie jobs...');

      const { data, error } = await supabase.functions.invoke('zombie-reclaimer');

      if (error) {
        console.error('❌ Zombie reclamation failed:', error);
        toast({
          title: "Zombie Reclamation Failed",
          description: error.message || "Could not reclaim zombie jobs",
          variant: "destructive"
        });
        return false;
      }

      console.log('✅ Zombie reclamation completed:', data);
      
      if (data?.reclaimed_count > 0) {
        toast({
          title: "Zombie Jobs Reclaimed",
          description: `Reclaimed ${data.reclaimed_count} stuck processing jobs`,
        });
      } else {
        toast({
          title: "No Zombie Jobs Found",
          description: "All processing jobs are healthy",
        });
      }

      // Refresh queue stats
      await getQueueStatus();
      return true;
    } catch (error) {
      console.error('❌ Zombie reclamation error:', error);
      toast({
        title: "Reclamation Error",
        description: "An unexpected error occurred during zombie reclamation",
        variant: "destructive"
      });
      return false;
    }
  }, [toast, getQueueStatus]);

  const forceProcessSingle = useCallback(async (dealId: string) => {
    try {
      // Queue a single deal for immediate processing
      const { data, error } = await supabase.rpc('queue_deal_analysis', {
        deal_id_param: dealId,
        trigger_reason_param: 'manual_force',
        priority_param: 'high',
        delay_minutes: 0
      });

      if (error) throw error;

      toast({
        title: "Deal Queued for Analysis",
        description: "The deal has been queued for immediate processing",
      });

      // Trigger processing
      setTimeout(() => processQueue(), 2000);
      
      return data;
    } catch (error) {
      console.error('❌ Force process error:', error);
      toast({
        title: "Queue Error",
        description: "Could not queue deal for analysis",
        variant: "destructive"
      });
      return null;
    }
  }, [processQueue, toast]);

  const clearFailedJobs = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('analysis_queue')
        .delete()
        .eq('status', 'failed')
        .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      toast({
        title: "Failed Jobs Cleared",
        description: "Old failed analysis jobs have been removed",
      });

      await getQueueStatus();
      return true;
    } catch (error) {
      console.error('❌ Clear failed jobs error:', error);
      toast({
        title: "Clear Error",
        description: "Could not clear failed jobs",
        variant: "destructive"
      });
      return false;
    }
  }, [toast, getQueueStatus]);

  return {
    isProcessing,
    queueStats,
    getQueueStatus,
    processQueue,
    reclaimZombieJobs,
    forceProcessSingle,
    clearFailedJobs
  };
}