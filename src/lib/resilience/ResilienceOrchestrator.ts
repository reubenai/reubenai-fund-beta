import { IdempotencyManager } from './IdempotencyManager';
import { CircuitBreaker } from './CircuitBreaker';
import { KillSwitchManager } from './KillSwitchManager';
import { supabase } from '@/integrations/supabase/client';

/**
 * Main orchestrator for all resilience mechanisms
 * Provides a unified interface for safe operation execution
 */
export class ResilienceOrchestrator {
  /**
   * Execute an analysis operation with full resilience protection and database limiters
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

      // 2. Check if analysis is already complete using database function
      try {
        const { data: isComplete } = await supabase.rpc('is_deal_analysis_complete', {
          p_deal_id: dealId
        });
        
        if (isComplete) {
          console.log(`✅ [ResilienceOrchestrator] Analysis already complete for deal ${dealId}`);
          return {
            success: true,
            result: { status: 'already_completed', message: 'Analysis already exists' } as T,
            skipped: true
          };
        }
      } catch (error) {
        console.warn('❌ [ResilienceOrchestrator] Failed to check completion status:', error);
        // Continue with analysis if check fails to avoid blocking
      }

      // 3. Acquire execution lock to prevent concurrent runs
      try {
        const { data: lockResult } = await supabase
          .from('deal_execution_locks')
          .insert({
            deal_id: dealId,
            lock_type: 'analysis',
            locked_by: operationName,
            expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
            metadata: {
              acquired_at: new Date().toISOString(),
              service: operationName,
              user_id: userId
            }
          })
          .select()
          .single();

        if (!lockResult) {
          // Lock acquisition failed, likely already exists
          return {
            success: false,
            error: 'Analysis already running for this deal',
            skipped: true
          };
        }
      } catch (error) {
        if (error.code === '23505') { // Unique constraint violation
          return {
            success: false,
            error: 'Analysis already running for this deal',
            skipped: true
          };
        }
        console.warn('❌ [ResilienceOrchestrator] Failed to acquire execution lock:', error);
        // Continue without lock if lock acquisition fails to avoid complete blocking
      }

      // 4. Check rate limits
      try {
        const now = new Date();
        const { data: rateLimitRecord } = await supabase
          .from('deal_rate_limits')
          .select('*')
          .eq('deal_id', dealId)
          .single();

        if (rateLimitRecord) {
          // Check if circuit breaker is open
          if (rateLimitRecord.is_circuit_open) {
            const circuitOpenTime = new Date(rateLimitRecord.circuit_opened_at);
            const circuitCooldown = 30 * 60 * 1000; // 30 minutes
            
            if (now.getTime() - circuitOpenTime.getTime() < circuitCooldown) {
              await this.releaseExecutionLock(dealId);
              return {
                success: false,
                error: 'Circuit breaker is open due to repeated failures',
                skipped: true
              };
            }
          }

          // Check hourly rate limit (max 1 analysis per hour)
          const lastAnalysisTime = new Date(rateLimitRecord.last_analysis_at);
          const hoursSinceLastAnalysis = (now.getTime() - lastAnalysisTime.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceLastAnalysis < 1) {
            await this.releaseExecutionLock(dealId);
            return {
              success: false,
              error: 'Rate limit: Maximum 1 analysis per hour per deal',
              skipped: true
            };
          }
        }
      } catch (error) {
        console.warn('❌ [ResilienceOrchestrator] Failed to check rate limits:', error);
        // Continue without rate limit check if it fails
      }

      // 5. Check idempotency (if not skipped)
      if (!skipIdempotency) {
        const idempotencyKey = IdempotencyManager.generateAnalysisKey(dealId, operationName, userId);
        const idempotencyCheck = await IdempotencyManager.checkIdempotencyKey(idempotencyKey, ttlMinutes);

        if (!idempotencyCheck.canProceed) {
          await this.releaseExecutionLock(dealId);
          return {
            success: idempotencyCheck.result ? !idempotencyCheck.result.error : true,
            result: idempotencyCheck.result?.error ? undefined : idempotencyCheck.result,
            error: idempotencyCheck.result?.error,
            skipped: true
          };
        }

        // 6. Execute with circuit breaker protection
        const circuitResult = await CircuitBreaker.execute(
          `${operationName}:${dealId}`,
          operation,
          circuitBreakerConfig
        );

        // 7. Update tracking based on result
        await this.updateTrackingOnCompletion(dealId, circuitResult.success, operationName);

        // 8. Update idempotency key based on result
        if (circuitResult.success && circuitResult.result) {
          await IdempotencyManager.markCompleted(idempotencyKey, circuitResult.result);
        } else if (!circuitResult.success) {
          await IdempotencyManager.markFailed(idempotencyKey, { message: circuitResult.error });
        }

        // 9. Release execution lock
        await this.releaseExecutionLock(dealId);

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

        // Update tracking and release lock
        await this.updateTrackingOnCompletion(dealId, circuitResult.success, operationName);
        await this.releaseExecutionLock(dealId);

        return {
          success: circuitResult.success,
          result: circuitResult.result,
          error: circuitResult.error
        };
      }

    } catch (error) {
      console.error(`❌ [ResilienceOrchestrator] Error for ${operationName}:${dealId}:`, error);
      
      // Ensure we release the lock on error
      await this.releaseExecutionLock(dealId);
      
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
        KillSwitchManager.cleanupExpired(),
        supabase.rpc('cleanup_expired_execution_locks') // Clean up expired execution locks
      ]);
      console.log('✅ Resilience system cleanup completed');
    } catch (error) {
      console.error('❌ Resilience system cleanup failed:', error);
    }
  }

  /**
   * Release execution lock for a deal
   */
  private static async releaseExecutionLock(dealId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('deal_execution_locks')
        .delete()
        .eq('deal_id', dealId)
        .eq('lock_type', 'analysis');

      if (error) {
        console.error('❌ [ResilienceOrchestrator] Error releasing execution lock:', error);
        return false;
      }

      console.log(`🔓 [ResilienceOrchestrator] Released execution lock for deal ${dealId}`);
      return true;
    } catch (error) {
      console.error('❌ [ResilienceOrchestrator] Failed to release execution lock:', error);
      return false;
    }
  }

  /**
   * Update tracking information on operation completion
   */
  private static async updateTrackingOnCompletion(
    dealId: string,
    success: boolean,
    operationName: string
  ): Promise<void> {
    try {
      // Update rate limits
      const now = new Date();
      const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format

      if (success) {
        // Update successful analysis tracking
        await supabase
          .from('deal_rate_limits')
          .upsert({
            deal_id: dealId,
            last_analysis_at: now.toISOString(),
            analysis_count_today: 1, // Will be updated by database if record exists
            reset_date: today,
            is_circuit_open: false, // Close circuit breaker on success
            consecutive_failures: 0 // Reset failure count
          });

        // Update analysis completion tracker
        await supabase
          .from('analysis_completion_tracker')
          .update({
            status: 'completed',
            completed_at: now.toISOString(),
            completion_reason: 'operation_successful',
            updated_at: now.toISOString()
          })
          .eq('deal_id', dealId)
          .eq('analysis_type', 'full_analysis')
          .eq('status', 'in_progress');
      } else {
        // Handle failure tracking
        const { data: rateLimitRecord } = await supabase
          .from('deal_rate_limits')
          .select('consecutive_failures')
          .eq('deal_id', dealId)
          .single();

        const consecutiveFailures = (rateLimitRecord?.consecutive_failures || 0) + 1;
        const shouldOpenCircuit = consecutiveFailures >= 3; // Open circuit after 3 consecutive failures

        await supabase
          .from('deal_rate_limits')
          .upsert({
            deal_id: dealId,
            last_analysis_at: now.toISOString(),
            reset_date: today,
            consecutive_failures: consecutiveFailures,
            is_circuit_open: shouldOpenCircuit,
            circuit_opened_at: shouldOpenCircuit ? now.toISOString() : null
          });

        // Update analysis completion tracker
        await supabase
          .from('analysis_completion_tracker')
          .update({
            status: 'failed',
            completed_at: now.toISOString(),
            completion_reason: 'operation_failed',
            updated_at: now.toISOString()
          })
          .eq('deal_id', dealId)
          .eq('analysis_type', 'full_analysis')
          .eq('status', 'in_progress');
      }
    } catch (error) {
      console.error('❌ [ResilienceOrchestrator] Failed to update tracking:', error);
      // Don't throw here as it's just tracking
    }
  }
}