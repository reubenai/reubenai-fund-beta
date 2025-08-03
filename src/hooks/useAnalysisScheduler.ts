import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AnalysisSchedulerOptions {
  enabled?: boolean;
  intervalMinutes?: number;
  onProcessingUpdate?: (result: any) => void;
}

export function useAnalysisScheduler({
  enabled = true,
  intervalMinutes = 5,
  onProcessingUpdate
}: AnalysisSchedulerOptions = {}) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);

  const processQueue = useCallback(async () => {
    // Prevent overlapping calls
    if (isProcessingRef.current) {
      console.log('⏳ Analysis queue processing already in progress, skipping...');
      return;
    }

    try {
      isProcessingRef.current = true;
      console.log('🔄 Starting scheduled analysis queue processing...');

      const { data, error } = await supabase.functions.invoke('analysis-queue-processor');

      if (error) {
        console.error('❌ Queue processing failed:', error);
        return;
      }

      console.log('✅ Queue processing completed:', data);
      onProcessingUpdate?.(data);

    } catch (error) {
      console.error('💥 Unexpected error during queue processing:', error);
    } finally {
      isProcessingRef.current = false;
    }
  }, [onProcessingUpdate]);

  const startScheduler = useCallback(() => {
    if (!enabled) return;

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    console.log(`🕐 Starting analysis queue scheduler (${intervalMinutes} minute intervals)`);

    // Process immediately on start
    processQueue();

    // Set up recurring processing
    intervalRef.current = setInterval(processQueue, intervalMinutes * 60 * 1000);
  }, [enabled, intervalMinutes, processQueue]);

  const stopScheduler = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('🛑 Analysis queue scheduler stopped');
    }
  }, []);

  const forceProcessing = useCallback(async () => {
    console.log('⚡ Force processing analysis queue...');
    await processQueue();
  }, [processQueue]);

  useEffect(() => {
    if (enabled) {
      startScheduler();
    } else {
      stopScheduler();
    }

    // Cleanup on unmount
    return () => {
      stopScheduler();
    };
  }, [enabled, startScheduler, stopScheduler]);

  return {
    isProcessing: isProcessingRef.current,
    forceProcessing,
    startScheduler,
    stopScheduler
  };
}