import { IdempotencyManager } from './IdempotencyManager';
import { CircuitBreaker } from './CircuitBreaker';
import { KillSwitchManager } from './KillSwitchManager';

/**
 * Main orchestrator for all resilience mechanisms
 * Provides a unified interface for safe operation execution
 */
export class ResilienceOrchestrator {
  /**
   * Execute an analysis operation with full resilience protection
   */
  static async executeAnalysisOperation<T>(
    operationName: string,
    dealId: string,
    operation: () => Promise<T>,
    userId?: string,
    config?: {
      skipIdempotency?: boolean;
      circuitBreakerConfig?: any;
      ttlMinutes?: number;
    }
  ): Promise<{ success: boolean; result?: T; error?: string; skipped?: boolean }> {
    const { skipIdempotency = false, circuitBreakerConfig, ttlMinutes } = config || {};

    try {
      // 1. Check kill switches first (fastest check)
      const globalKillSwitch = await KillSwitchManager.isAnalysisDisabled();
      if (globalKillSwitch) {
        return {
          success: false,
          error: 'Global analysis kill switch is active',
          skipped: true
        };
      }

      const engineKillSwitch = await KillSwitchManager.isEngineDisabled(operationName);
      if (engineKillSwitch) {
        return {
          success: false,
          error: `Engine kill switch is active for ${operationName}`,
          skipped: true
        };
      }

      // 2. Check idempotency (if not skipped)
      if (!skipIdempotency) {
        const idempotencyKey = IdempotencyManager.generateAnalysisKey(dealId, operationName, userId);
        const idempotencyCheck = await IdempotencyManager.checkIdempotencyKey(idempotencyKey, ttlMinutes);

        if (!idempotencyCheck.canProceed) {
          return {
            success: idempotencyCheck.result ? !idempotencyCheck.result.error : true,
            result: idempotencyCheck.result?.error ? undefined : idempotencyCheck.result,
            error: idempotencyCheck.result?.error,
            skipped: true
          };
        }

        // 3. Execute with circuit breaker protection
        const circuitResult = await CircuitBreaker.execute(
          `${operationName}:${dealId}`,
          operation,
          circuitBreakerConfig
        );

        // 4. Update idempotency key based on result
        if (circuitResult.success && circuitResult.result) {
          await IdempotencyManager.markCompleted(idempotencyKey, circuitResult.result);
        } else if (!circuitResult.success) {
          await IdempotencyManager.markFailed(idempotencyKey, { message: circuitResult.error });
        }

        return {
          success: circuitResult.success,
          result: circuitResult.result,
          error: circuitResult.error
        };
      } else {
        // Skip idempotency, just use circuit breaker
        const circuitResult = await CircuitBreaker.execute(
          `${operationName}:${dealId}`,
          operation,
          circuitBreakerConfig
        );

        return {
          success: circuitResult.success,
          result: circuitResult.result,
          error: circuitResult.error
        };
      }

    } catch (error) {
      console.error(`Resilience orchestrator error for ${operationName}:${dealId}:`, error);
      return {
        success: false,
        error: error.message || 'Unexpected error in resilience orchestrator'
      };
    }
  }

  /**
   * Execute a simple operation with kill switch and circuit breaker only
   */
  static async executeSimpleOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    config?: any
  ): Promise<{ success: boolean; result?: T; error?: string; skipped?: boolean }> {
    try {
      // Check kill switch
      const killSwitch = await KillSwitchManager.isActive(operationName);
      if (killSwitch) {
        return {
          success: false,
          error: `Kill switch is active for ${operationName}`,
          skipped: true
        };
      }

      // Execute with circuit breaker
      const result = await CircuitBreaker.execute(operationName, operation, config);
      return {
        success: result.success,
        result: result.result,
        error: result.error
      };

    } catch (error) {
      return {
        success: false,
        error: error.message || 'Unexpected error'
      };
    }
  }

  /**
   * Get system health status
   */
  static async getSystemHealth(): Promise<{
    killSwitches: any[];
    circuitBreakers: Map<string, any>;
    systemStatus: 'healthy' | 'degraded' | 'critical';
  }> {
    try {
      const killSwitches = await KillSwitchManager.getActiveKillSwitches();
      const circuitBreakers = CircuitBreaker.getAllStatuses();
      
      let systemStatus: 'healthy' | 'degraded' | 'critical' = 'healthy';
      
      if (killSwitches.length > 0) {
        systemStatus = killSwitches.some(ks => ks.switchName === 'global_analysis') ? 'critical' : 'degraded';
      } else {
        const openBreakers = Array.from(circuitBreakers.values()).filter(cb => cb.status === 'open');
        if (openBreakers.length > 0) {
          systemStatus = 'degraded';
        }
      }

      return {
        killSwitches,
        circuitBreakers,
        systemStatus
      };
    } catch (error) {
      console.error('Error getting system health:', error);
      return {
        killSwitches: [],
        circuitBreakers: new Map(),
        systemStatus: 'critical'
      };
    }
  }

  /**
   * Periodic cleanup of resilience data
   */
  static async performCleanup(): Promise<void> {
    try {
      await Promise.all([
        IdempotencyManager.cleanup(),
        CircuitBreaker.cleanup(),
        KillSwitchManager.cleanupExpired()
      ]);
      console.log('✅ Resilience system cleanup completed');
    } catch (error) {
      console.error('❌ Resilience system cleanup failed:', error);
    }
  }
}