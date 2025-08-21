import { useCallback } from 'react';
import { ResilienceOrchestrator } from '@/lib/resilience/ResilienceOrchestrator';
import { KillSwitchManager } from '@/lib/resilience/KillSwitchManager';
import { CircuitBreaker } from '@/lib/resilience/CircuitBreaker';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook providing resilience-protected operation execution
 * Integrates idempotency, circuit breakers, and kill switches
 */
export function useResilienceProtection() {
  const { toast } = useToast();

  /**
   * Execute analysis operation with full resilience protection
   */
  const executeProtectedAnalysis = useCallback(async <T>(
    operationName: string,
    dealId: string,
    operation: () => Promise<T>,
    options?: {
      userId?: string;
      skipIdempotency?: boolean;
      showToasts?: boolean;
      failureThreshold?: number;
      callBudgetLimit?: number;
    }
  ) => {
    const { 
      userId, 
      skipIdempotency = false, 
      showToasts = true,
      failureThreshold = 3,
      callBudgetLimit = 5 
    } = options || {};

    try {
      const result = await ResilienceOrchestrator.executeAnalysisOperation(
        operationName,
        dealId,
        operation,
        userId,
        {
          skipIdempotency,
          circuitBreakerConfig: {
            failureThreshold,
            callBudgetLimit,
            recoveryTimeoutMs: 5 * 60 * 1000, // 5 minutes
            monitorWindowMs: 60 * 1000 // 1 minute window
          }
        }
      );

      if (result.skipped && showToasts) {
        if (result.error?.includes('kill switch')) {
          toast({
            title: "System Protection Active",
            description: "Analysis operations are currently disabled for system protection",
            variant: "destructive"
          });
        } else if (result.error?.includes('Operation in progress')) {
          toast({
            title: "Operation Already Running",
            description: "This analysis is already in progress",
            variant: "default"
          });
        } else if (result.error?.includes('Circuit breaker open')) {
          toast({
            title: "System Protection",
            description: "Analysis temporarily unavailable due to recent failures",
            variant: "destructive"
          });
        }
      }

      return result;

    } catch (error) {
      console.error(`Protected analysis execution failed for ${operationName}:${dealId}:`, error);
      
      if (showToasts) {
        toast({
          title: "System Error",
          description: "An unexpected error occurred during analysis protection",
          variant: "destructive"
        });
      }

      return {
        success: false,
        error: error.message || 'Unexpected system error'
      };
    }
  }, [toast]);

  /**
   * Execute simple operation with kill switch and circuit breaker only
   */
  const executeProtectedOperation = useCallback(async <T>(
    operationName: string,
    operation: () => Promise<T>,
    options?: {
      showToasts?: boolean;
      failureThreshold?: number;
      callBudgetLimit?: number;
    }
  ) => {
    const { showToasts = true, failureThreshold = 3, callBudgetLimit = 5 } = options || {};

    try {
      const result = await ResilienceOrchestrator.executeSimpleOperation(
        operationName,
        operation,
        {
          failureThreshold,
          callBudgetLimit,
          recoveryTimeoutMs: 5 * 60 * 1000,
          monitorWindowMs: 60 * 1000
        }
      );

      if (result.skipped && showToasts && result.error?.includes('kill switch')) {
        toast({
          title: "Operation Disabled",
          description: `${operationName} is currently disabled`,
          variant: "destructive"
        });
      }

      return result;
    } catch (error) {
      console.error(`Protected operation execution failed for ${operationName}:`, error);
      return {
        success: false,
        error: error.message || 'Unexpected error'
      };
    }
  }, [toast]);

  /**
   * Check if analysis is currently disabled
   */
  const checkAnalysisStatus = useCallback(async () => {
    try {
      const globalDisabled = await KillSwitchManager.isAnalysisDisabled();
      return {
        globalDisabled,
        canProceed: !globalDisabled
      };
    } catch (error) {
      console.error('Failed to check analysis status:', error);
      return {
        globalDisabled: false, // Fail open
        canProceed: true
      };
    }
  }, []);

  /**
   * Get system health for monitoring
   */
  const getSystemHealth = useCallback(async () => {
    try {
      return await ResilienceOrchestrator.getSystemHealth();
    } catch (error) {
      console.error('Failed to get system health:', error);
      return {
        killSwitches: [],
        circuitBreakers: new Map(),
        systemStatus: 'critical' as const
      };
    }
  }, []);

  /**
   * Emergency shutdown all analysis operations
   */
  const emergencyShutdown = useCallback(async (reason: string) => {
    try {
      const success = await KillSwitchManager.emergencyShutdown(reason, 'user_initiated');
      
      if (success) {
        toast({
          title: "Emergency Shutdown Activated",
          description: "All analysis operations have been disabled",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Emergency Shutdown Failed",
          description: "Could not activate all kill switches",
          variant: "destructive"
        });
      }

      return success;
    } catch (error) {
      console.error('Emergency shutdown failed:', error);
      toast({
        title: "Emergency Shutdown Error",
        description: "Failed to activate emergency shutdown",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  /**
   * Reset a circuit breaker (for manual recovery)
   */
  const resetCircuitBreaker = useCallback((functionName: string) => {
    try {
      CircuitBreaker.reset(functionName);
      toast({
        title: "Circuit Breaker Reset",
        description: `Circuit breaker for ${functionName} has been manually reset`,
        variant: "default"
      });
      return true;
    } catch (error) {
      console.error(`Failed to reset circuit breaker for ${functionName}:`, error);
      toast({
        title: "Reset Failed",
        description: "Could not reset circuit breaker",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  return {
    executeProtectedAnalysis,
    executeProtectedOperation,
    checkAnalysisStatus,
    getSystemHealth,
    emergencyShutdown,
    resetCircuitBreaker
  };
}