import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useResilienceProtection } from './useResilienceProtection';

interface ResilientSchedulerOptions {
  enabled?: boolean;
  intervalMinutes?: number;
  maxProcessingItems?: number;
  cooldownMinutes?: number;
  onProcessingUpdate?: (result: any) => void;
}

/**
 * Resilient Analysis Scheduler with Circuit Breaker Protection
 * Replaces useAnalysisScheduler with built-in safety mechanisms
 */
export function useResilientAnalysisScheduler({
  enabled = true,
  intervalMinutes = 10, // Increased to 10 minutes for safety
  maxProcessingItems = 3, // Maximum 3 items per run
  cooldownMinutes = 10, // Mandatory cooldown between runs
  onProcessingUpdate
}: ResilientSchedulerOptions = {}) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastRunTimeRef = useRef<number>(0);
  const { executeProtectedOperation, checkAnalysisStatus } = useResilienceProtection();

  const processQueue = useCallback(async () => {
    const now = Date.now();
    const timeSinceLastRun = now - lastRunTimeRef.current;
    const cooldownMs = cooldownMinutes * 60 * 1000;

    // Enforce cooldown period
    if (timeSinceLastRun < cooldownMs) {
      const remainingCooldown = Math.ceil((cooldownMs - timeSinceLastRun) / 1000 / 60);
      console.log(`⏳ Cooldown period active. ${remainingCooldown} minutes remaining.`);
      return;
    }

    // Check analysis status first
    const { canProceed } = await checkAnalysisStatus();
    if (!canProceed) {
      console.log('🚫 Analysis disabled by kill switch - skipping queue processing');
      return;
    }

    const result = await executeProtectedOperation(
      'queue_processor',
      async () => {
        console.log('🔄 Starting resilient analysis queue processing...');
        
        // Check for queued items with limit
        const { data: queueCheck, error: checkError } = await supabase
          .from('analysis_queue')
          .select('id, deal_id, priority')
          .eq('status', 'queued')
          .order('priority', { ascending: false }) // High priority first
          .order('created_at', { ascending: true }) // Oldest first within same priority
          .limit(maxProcessingItems);

        if (checkError) {
          throw new Error(`Queue check failed: ${checkError.message}`);
        }

        if (!queueCheck || queueCheck.length === 0) {
          console.log('📭 No queued analyses found - skipping processor');
          return { processed: 0, skipped: 0 };
        }

        console.log(`📬 Found ${queueCheck.length} queued analyses (max ${maxProcessingItems})`);

        // Process with controlled invocation
        const { data, error } = await supabase.functions.invoke('enhanced-analysis-queue-processor');

        if (error) {
          throw new Error(`Queue processing failed: ${error.message}`);
        }

        console.log('✅ Queue processing completed:', data);
        return data || { processed: 0, failed: 0 };
      },
      {
        showToasts: false, // Don't show toasts for automatic processing
        failureThreshold: 2, // Trip circuit breaker after 2 failures
        callBudgetLimit: 1 // Only allow 1 call per minute window
      }
    );

    // Update last run time regardless of success/failure
    lastRunTimeRef.current = now;

    if (result.success && 'result' in result && result.result) {
      onProcessingUpdate?.(result.result);
      
      // Log successful processing
      console.log(`✅ Processed ${result.result.processed || 0} items, ${result.result.failed || 0} failures`);
    } else if (!result.success) {
      console.error('❌ Queue processing protected execution failed:', result.error);
    }

    return result;
  }, [executeProtectedOperation, checkAnalysisStatus, maxProcessingItems, cooldownMinutes, onProcessingUpdate]);

  const startScheduler = useCallback(() => {
    if (!enabled) return;

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    console.log(`🕐 Starting resilient analysis queue scheduler (${intervalMinutes} minute intervals, max ${maxProcessingItems} items per run)`);

    // Don't process immediately on start - respect cooldown
    const now = Date.now();
    const timeSinceLastRun = now - lastRunTimeRef.current;
    const cooldownMs = cooldownMinutes * 60 * 1000;
    
    if (timeSinceLastRun >= cooldownMs) {
      // Safe to process immediately
      setTimeout(processQueue, 5000); // 5 second delay to let system stabilize
    } else {
      console.log('⏳ Scheduler started but in cooldown period');
    }

    // Set up recurring processing
    intervalRef.current = setInterval(processQueue, intervalMinutes * 60 * 1000);
  }, [enabled, intervalMinutes, processQueue, cooldownMinutes, maxProcessingItems]);

  const stopScheduler = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('🛑 Resilient analysis queue scheduler stopped');
    }
  }, []);

  const forceProcessing = useCallback(async () => {
    console.log('⚡ Force processing resilient analysis queue...');
    
    // Check if we can override cooldown for manual force
    const { canProceed } = await checkAnalysisStatus();
    if (!canProceed) {
      console.log('🚫 Cannot force process - analysis disabled by kill switch');
      return { success: false, error: 'Analysis disabled by kill switch' };
    }

    // Allow force processing to bypass cooldown
    const originalLastRun = lastRunTimeRef.current;
    lastRunTimeRef.current = 0; // Reset to allow immediate processing
    
    try {
      const result = await processQueue();
      return result || { success: false, error: 'No result returned' };
    } catch (error) {
      // Restore original timestamp if force processing failed
      lastRunTimeRef.current = originalLastRun;
      return { success: false, error: error.message || 'Force processing failed' };
    }
  }, [processQueue, checkAnalysisStatus]);

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
    isProcessing: false, // We don't track this in memory anymore for safety
    forceProcessing,
    startScheduler,
    stopScheduler,
    getLastRunTime: () => lastRunTimeRef.current,
    getCooldownRemaining: () => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRunTimeRef.current;
      const cooldownMs = cooldownMinutes * 60 * 1000;
      return Math.max(0, cooldownMs - timeSinceLastRun);
    }
  };
}