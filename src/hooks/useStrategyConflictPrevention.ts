import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ConflictPreventionOptions {
  maxRetries?: number;
  retryDelay?: number;
  checkAnalysisStatus?: boolean;
}

interface AnalysisStatus {
  hasActiveAnalysis: boolean;
  queuedCount: number;
  processingCount: number;
  canSafelyUpdate: boolean;
  recommendation: string;
}

export function useStrategyConflictPrevention() {
  const { toast } = useToast();
  const [isCheckingAnalysis, setIsCheckingAnalysis] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const checkAnalysisStatus = useCallback(async (fundId: string): Promise<AnalysisStatus> => {
    try {
      setIsCheckingAnalysis(true);
      
      // Check for active analysis queue items for this fund's deals
      const { data: queueData, error: queueError } = await supabase
        .from('analysis_queue')
        .select('status')
        .in('status', ['queued', 'processing'])
        .eq('fund_id', fundId);

      if (queueError) {
        console.warn('Could not check analysis queue:', queueError);
        return {
          hasActiveAnalysis: false,
          queuedCount: 0,
          processingCount: 0,
          canSafelyUpdate: true,
          recommendation: 'Queue status unknown, proceed with caution'
        };
      }

      const queuedCount = queueData?.filter(item => item.status === 'queued').length || 0;
      const processingCount = queueData?.filter(item => item.status === 'processing').length || 0;
      const hasActiveAnalysis = queuedCount > 0 || processingCount > 0;

      // Determine if it's safe to update
      const canSafelyUpdate = !hasActiveAnalysis || (queuedCount < 5 && processingCount < 2);
      
      let recommendation = '';
      if (!hasActiveAnalysis) {
        recommendation = 'No active analysis detected - safe to update';
      } else if (canSafelyUpdate) {
        recommendation = 'Low analysis activity - update with retry logic';
      } else {
        recommendation = 'High analysis activity - consider waiting or using queue';
      }

      return {
        hasActiveAnalysis,
        queuedCount,
        processingCount,
        canSafelyUpdate,
        recommendation
      };
    } catch (error) {
      console.error('Error checking analysis status:', error);
      return {
        hasActiveAnalysis: false,
        queuedCount: 0,
        processingCount: 0,
        canSafelyUpdate: true,
        recommendation: 'Analysis check failed, proceeding with caution'
      };
    } finally {
      setIsCheckingAnalysis(false);
    }
  }, []);

  const temporarilyDisableAnalysis = useCallback(async (fundId: string): Promise<boolean> => {
    try {
      // Temporarily disable auto-analysis for all deals in this fund
      const { error } = await supabase
        .from('deals')
        .update({ auto_analysis_enabled: false })
        .eq('fund_id', fundId);

      if (error) {
        console.warn('Could not disable auto-analysis:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.warn('Error disabling auto-analysis:', error);
      return false;
    }
  }, []);

  const restoreAnalysis = useCallback(async (fundId: string): Promise<boolean> => {
    try {
      // Re-enable auto-analysis for all deals in this fund
      const { error } = await supabase
        .from('deals')
        .update({ auto_analysis_enabled: true })
        .eq('fund_id', fundId);

      if (error) {
        console.warn('Could not restore auto-analysis:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.warn('Error restoring auto-analysis:', error);
      return false;
    }
  }, []);

  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    fundId: string,
    options: ConflictPreventionOptions = {}
  ): Promise<T> => {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      checkAnalysisStatus: shouldCheckAnalysis = true
    } = options;

    setIsRetrying(true);
    
    try {
      // Check analysis status first if requested
      if (shouldCheckAnalysis) {
        const analysisStatus = await checkAnalysisStatus(fundId);
        
        if (!analysisStatus.canSafelyUpdate) {
          toast({
            title: 'High Analysis Activity',
            description: `${analysisStatus.queuedCount} queued, ${analysisStatus.processingCount} processing. Consider waiting.`,
            duration: 5000,
          });
          
          // Offer to temporarily disable analysis
          const disabled = await temporarilyDisableAnalysis(fundId);
          if (disabled) {
            toast({
              title: 'Auto-analysis Disabled',
              description: 'Temporarily disabled to allow strategy update. Will restore after save.',
              duration: 3000,
            });
          }
        }
      }

      let lastError: Error | null = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`Strategy save attempt ${attempt}/${maxRetries}`);
          
          const result = await operation();
          
          // Success - restore analysis if we disabled it
          if (shouldCheckAnalysis) {
            await restoreAnalysis(fundId);
          }
          
          if (attempt > 1) {
            toast({
              title: 'Save Successful',
              description: `Strategy saved after ${attempt} attempts.`,
            });
          }
          
          return result;
        } catch (error) {
          lastError = error as Error;
          console.error(`Attempt ${attempt} failed:`, error);
          
          // Check for specific conflict errors
          const isConflictError = error instanceof Error && (
            error.message.includes('conflict') ||
            error.message.includes('concurrent') ||
            error.message.includes('blocked')
          );
          
          if (isConflictError && attempt < maxRetries) {
            const delay = retryDelay * attempt; // Exponential backoff
            console.log(`Retrying in ${delay}ms due to conflict...`);
            
            toast({
              title: 'Conflict Detected',
              description: `Retrying save in ${delay/1000}s... (${attempt}/${maxRetries})`,
              duration: 2000,
            });
            
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          // If it's not a conflict error or we've exhausted retries, throw
          if (attempt === maxRetries) {
            throw lastError;
          }
        }
      }
      
      throw lastError || new Error('Unknown error during retry operation');
    } finally {
      setIsRetrying(false);
      
      // Always attempt to restore analysis
      if (shouldCheckAnalysis) {
        await restoreAnalysis(fundId);
      }
    }
  }, [checkAnalysisStatus, temporarilyDisableAnalysis, restoreAnalysis, toast]);

  const safeStrategyUpdate = useCallback(async (
    updateOperation: () => Promise<any>,
    fundId: string,
    options: ConflictPreventionOptions = {}
  ) => {
    return executeWithRetry(updateOperation, fundId, {
      maxRetries: 3,
      retryDelay: 1500,
      checkAnalysisStatus: true,
      ...options
    });
  }, [executeWithRetry]);

  return {
    checkAnalysisStatus,
    executeWithRetry,
    safeStrategyUpdate,
    temporarilyDisableAnalysis,
    restoreAnalysis,
    isCheckingAnalysis,
    isRetrying
  };
}