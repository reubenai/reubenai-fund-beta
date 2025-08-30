import { useCallback, useEffect, useRef, useState } from 'react';
import { QueueManager } from '@/lib/queue/QueueManager';

interface EnrichmentSchedulerOptions {
  enabled?: boolean;
  intervalMinutes?: number;
  onProcessingUpdate?: (isProcessing: boolean) => void;
}

/**
 * Hook for managing automated enrichment queue processing
 */
export function useEnrichmentScheduler({
  enabled = true,
  intervalMinutes = 5,
  onProcessingUpdate
}: EnrichmentSchedulerOptions = {}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const processEnrichmentQueues = useCallback(async () => {
    if (isProcessing) {
      console.log('⏭️ Skipping enrichment processing - already in progress');
      return { success: true, processed: 0, failed: 0 };
    }

    try {
      setIsProcessing(true);
      onProcessingUpdate?.(true);

      console.log('🔄 Processing enrichment queues...');

      // Process both enrichment queues
      const [crunchbaseResult, linkedinResult] = await Promise.allSettled([
        QueueManager.processQueue('crunchbase_enrichment_queue'),
        QueueManager.processQueue('linkedin_profile_enrichment_queue')
      ]);

      let totalProcessed = 0;
      let totalFailed = 0;

      // Process Crunchbase results
      if (crunchbaseResult.status === 'fulfilled' && crunchbaseResult.value.success) {
        totalProcessed += crunchbaseResult.value.processed;
        totalFailed += crunchbaseResult.value.failed;
        console.log(`✅ Crunchbase enrichment: ${crunchbaseResult.value.processed} processed, ${crunchbaseResult.value.failed} failed`);
      } else {
        console.error('❌ Crunchbase enrichment processing failed:', crunchbaseResult);
      }

      // Process LinkedIn results
      if (linkedinResult.status === 'fulfilled' && linkedinResult.value.success) {
        totalProcessed += linkedinResult.value.processed;
        totalFailed += linkedinResult.value.failed;
        console.log(`✅ LinkedIn enrichment: ${linkedinResult.value.processed} processed, ${linkedinResult.value.failed} failed`);
      } else {
        console.error('❌ LinkedIn enrichment processing failed:', linkedinResult);
      }

      if (totalProcessed > 0) {
        console.log(`🎯 Enrichment processing completed: ${totalProcessed} total processed, ${totalFailed} failed`);
      }

      return {
        success: true,
        processed: totalProcessed,
        failed: totalFailed
      };

    } catch (error) {
      console.error('❌ Enrichment queue processing error:', error);
      return {
        success: false,
        processed: 0,
        failed: 0,
        error: error.message
      };
    } finally {
      setIsProcessing(false);
      onProcessingUpdate?.(false);
    }
  }, [isProcessing, onProcessingUpdate]);

  const startScheduler = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      processEnrichmentQueues();
    }, intervalMinutes * 60 * 1000);

    console.log(`🕐 Enrichment scheduler started (${intervalMinutes} minute intervals)`);
  }, [intervalMinutes, processEnrichmentQueues]);

  const stopScheduler = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('⏹️ Enrichment scheduler stopped');
    }
  }, []);

  const forceProcessing = useCallback(() => {
    console.log('🚀 Force processing enrichment queues...');
    return processEnrichmentQueues();
  }, [processEnrichmentQueues]);

  // Auto-start/stop scheduler based on enabled flag
  useEffect(() => {
    if (enabled) {
      startScheduler();
      // Process immediately on startup
      processEnrichmentQueues();
    } else {
      stopScheduler();
    }

    return () => {
      stopScheduler();
    };
  }, [enabled, startScheduler, stopScheduler, processEnrichmentQueues]);

  return {
    isProcessing,
    forceProcessing,
    startScheduler,
    stopScheduler
  };
}