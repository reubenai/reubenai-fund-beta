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

      // Also get job queue stats for enrichment engines
      const { data: jobData, error: jobError } = await supabase
        .from('job_queues')
        .select('status, engine, created_at, retry_count')
        .in('engine', ['crunchbase_enrichment', 'linkedin_profile_enrichment'])
        .order('created_at', { ascending: false })
        .limit(100);

      if (jobError) throw jobError;

      const analysisStats = {
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

      const enrichmentStats = {
        total: jobData?.length || 0,
        queued: jobData?.filter(item => item.status === 'queued').length || 0,
        processing: jobData?.filter(item => item.status === 'processing').length || 0,
        completed: jobData?.filter(item => item.status === 'completed').length || 0,
        failed: jobData?.filter(item => item.status === 'failed').length || 0,
        crunchbase_queued: jobData?.filter(item => item.engine === 'crunchbase_enrichment' && item.status === 'queued').length || 0,
        linkedin_queued: jobData?.filter(item => item.engine === 'linkedin_profile_enrichment' && item.status === 'queued').length || 0,
      };

      const stats = {
        analysis: analysisStats,
        enrichment: enrichmentStats,
        combined: {
          total_queued: analysisStats.queued + enrichmentStats.queued,
          total_processing: analysisStats.processing + enrichmentStats.processing
        }
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

      // Process analysis queue
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('universal-analysis-processor');
      
      // Process enrichment queues using QueueManager
      const enrichmentResults = await Promise.allSettled([
        supabase.rpc('process_enrichment_queue', { queue_name: 'crunchbase_enrichment_queue' }),
        supabase.rpc('process_enrichment_queue', { queue_name: 'linkedin_profile_enrichment_queue' })
      ]);

      let totalProcessed = 0;
      let totalSuccessful = 0;
      let totalFailed = 0;

      if (analysisError) {
        console.error('❌ Analysis queue processing failed:', analysisError);
        toast({
          title: "Analysis Queue Processing Failed",
          description: analysisError.message || "Could not process analysis queue",
          variant: "destructive"
        });
        return false;
      }

      totalProcessed += (analysisData?.processed || 0);
      totalSuccessful += (analysisData?.successful || 0);
      totalFailed += (analysisData?.failed || 0);

      // Process enrichment results
      enrichmentResults.forEach((result, index) => {
        const queueName = index === 0 ? 'Crunchbase' : 'LinkedIn';
        if (result.status === 'fulfilled' && result.value.data) {
          const enrichmentData = result.value.data;
          totalProcessed += (enrichmentData.processed || 0);
          totalSuccessful += (enrichmentData.processed || 0) - (enrichmentData.failed || 0);
          totalFailed += (enrichmentData.failed || 0);
          console.log(`✅ ${queueName} enrichment queue processed:`, enrichmentData);
        } else {
          console.warn(`⚠️ ${queueName} enrichment queue processing warning:`, result);
        }
      });

      console.log('✅ All queue processing completed:', { totalProcessed, totalSuccessful, totalFailed });
      toast({
        title: "Queues Processed",
        description: `Processed ${totalProcessed} items (${totalSuccessful} successful, ${totalFailed} failed)`,
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

  const forceProcessQueueItem = useCallback(async (queueId: string, documentId?: string) => {
    try {
      setIsProcessing(true);
      console.log(`🔧 Force processing specific queue item: ${queueId}`);

      const { data, error } = await supabase.functions.invoke('force-queue-item-processor', {
        body: { queueId, documentId }
      });

      if (error) {
        console.error('❌ Force queue item processing failed:', error);
        toast({
          title: "Force Processing Failed",
          description: error.message || "Could not force process queue item",
          variant: "destructive"
        });
        return false;
      }

      console.log('✅ Force queue item processing completed:', data);
      toast({
        title: "Queue Item Processed",
        description: "The stuck queue item has been successfully processed",
      });

      // Refresh queue stats
      await getQueueStatus();
      return true;
    } catch (error) {
      console.error('❌ Force queue item processing error:', error);
      toast({
        title: "Processing Error",
        description: "An unexpected error occurred during force processing",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [toast, getQueueStatus]);

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
    forceProcessQueueItem,
    clearFailedJobs
  };
}