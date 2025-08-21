import { supabase } from '@/integrations/supabase/client';

interface CircuitBreakerState {
  functionName: string;
  status: 'closed' | 'open' | 'half-open';
  failureCount: number;
  lastFailureTime?: number;
  lastSuccessTime?: number;
  nextRetryTime?: number;
  totalCalls: number;
  successCount: number;
}

interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeoutMs: number;
  monitorWindowMs: number;
  callBudgetLimit: number;
}

/**
 * Function-level Circuit Breaker with Exponential Backoff
 * Prevents cascading failures and implements call budgeting
 */
export class CircuitBreaker {
  private static readonly states = new Map<string, CircuitBreakerState>();
  private static readonly DEFAULT_CONFIG: CircuitBreakerConfig = {
    failureThreshold: 5,
    recoveryTimeoutMs: 5 * 60 * 1000, // 5 minutes
    monitorWindowMs: 60 * 1000, // 1 minute window
    callBudgetLimit: 5
  };

  /**
   * Execute function with circuit breaker protection
   */
  static async execute<T>(
    functionName: string,
    operation: () => Promise<T>,
    config: Partial<CircuitBreakerConfig> = {}
  ): Promise<{ success: boolean; result?: T; error?: string; shouldRetry?: boolean }> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    const state = this.getOrCreateState(functionName);

    // Check if circuit is open
    if (state.status === 'open') {
      if (Date.now() < (state.nextRetryTime || 0)) {
        return {
          success: false,
          error: `Circuit breaker open for ${functionName}. Next retry at ${new Date(state.nextRetryTime!)}`,
          shouldRetry: false
        };
      } else {
        // Move to half-open for testing
        state.status = 'half-open';
        console.log(`🔄 Circuit breaker half-open for ${functionName}, testing recovery`);
      }
    }

    // Check call budget limit
    const recentCalls = await this.getRecentCallCount(functionName, finalConfig.monitorWindowMs);
    if (recentCalls >= finalConfig.callBudgetLimit) {
      return {
        success: false,
        error: `Call budget exceeded for ${functionName} (${recentCalls}/${finalConfig.callBudgetLimit} in last minute)`,
        shouldRetry: true
      };
    }

    // Record call attempt
    state.totalCalls++;
    await this.recordCall(functionName, 'attempt');

    try {
      const startTime = Date.now();
      const result = await operation();
      const duration = Date.now() - startTime;

      // Success
      state.successCount++;
      state.lastSuccessTime = Date.now();
      state.failureCount = Math.max(0, state.failureCount - 1); // Gradually reduce failure count
      
      if (state.status === 'half-open') {
        state.status = 'closed';
        console.log(`✅ Circuit breaker closed for ${functionName}, recovery successful`);
      }

      await this.recordCall(functionName, 'success', duration);
      this.updateState(functionName, state);

      return { success: true, result };
    } catch (error) {
      // Failure
      state.failureCount++;
      state.lastFailureTime = Date.now();

      await this.recordCall(functionName, 'failure', undefined, error);

      // Check if we should trip the circuit breaker
      if (state.failureCount >= finalConfig.failureThreshold) {
        state.status = 'open';
        state.nextRetryTime = Date.now() + this.calculateBackoffTime(state.failureCount, finalConfig.recoveryTimeoutMs);
        
        console.error(`🚨 Circuit breaker OPEN for ${functionName} after ${state.failureCount} failures. Next retry: ${new Date(state.nextRetryTime)}`);
      }

      this.updateState(functionName, state);

      return {
        success: false,
        error: error.message || 'Operation failed',
        shouldRetry: state.status !== 'open'
      };
    }
  }

  /**
   * Get or create circuit breaker state for function
   */
  private static getOrCreateState(functionName: string): CircuitBreakerState {
    if (!this.states.has(functionName)) {
      this.states.set(functionName, {
        functionName,
        status: 'closed',
        failureCount: 0,
        totalCalls: 0,
        successCount: 0
      });
    }
    return this.states.get(functionName)!;
  }

  /**
   * Update circuit breaker state
   */
  private static updateState(functionName: string, state: CircuitBreakerState): void {
    this.states.set(functionName, state);
  }

  /**
   * Calculate exponential backoff time
   */
  private static calculateBackoffTime(failureCount: number, baseTimeoutMs: number): number {
    // Exponential backoff: 1min -> 5min -> 15min -> 1hr
    const backoffMultipliers = [1, 5, 15, 60]; // minutes
    const multiplier = backoffMultipliers[Math.min(failureCount - 1, backoffMultipliers.length - 1)];
    return Math.min(multiplier * 60 * 1000, baseTimeoutMs);
  }

  /**
   * Get recent call count from monitoring
   */
  private static async getRecentCallCount(functionName: string, windowMs: number): Promise<number> {
    try {
      const since = new Date(Date.now() - windowMs).toISOString();
      
      const { data, error } = await supabase
        .from('circuit_breaker_logs')
        .select('id')
        .eq('function_name', functionName)
        .gte('created_at', since);

      if (error) {
        console.error('Failed to get recent call count:', error);
        return 0; // Fail open
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Error getting recent call count:', error);
      return 0; // Fail open
    }
  }

  /**
   * Record circuit breaker call for monitoring
   */
  private static async recordCall(
    functionName: string, 
    status: 'attempt' | 'success' | 'failure',
    duration?: number,
    error?: any
  ): Promise<void> {
    try {
      const { error: insertError } = await supabase
        .from('circuit_breaker_logs')
        .insert({
          function_name: functionName,
          status,
          duration_ms: duration,
          error_message: error?.message,
          metadata: error ? { stack: error.stack, type: error.constructor.name } : undefined
        });

      if (insertError) {
        console.error('Failed to record circuit breaker call:', insertError);
      }
    } catch (err) {
      console.error('Error recording circuit breaker call:', err);
    }
  }

  /**
   * Get circuit breaker status for monitoring
   */
  static getStatus(functionName: string): CircuitBreakerState | null {
    return this.states.get(functionName) || null;
  }

  /**
   * Get all circuit breaker statuses
   */
  static getAllStatuses(): Map<string, CircuitBreakerState> {
    return new Map(this.states);
  }

  /**
   * Manually reset circuit breaker (for emergency recovery)
   */
  static reset(functionName: string): void {
    const state = this.getOrCreateState(functionName);
    state.status = 'closed';
    state.failureCount = 0;
    state.nextRetryTime = undefined;
    this.updateState(functionName, state);
    console.log(`🔄 Circuit breaker manually reset for ${functionName}`);
  }

  /**
   * Clean up old circuit breaker logs
   */
  static async cleanup(): Promise<void> {
    try {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 24 hours
      
      const { error } = await supabase
        .from('circuit_breaker_logs')
        .delete()
        .lt('created_at', cutoff);

      if (error) {
        console.error('Failed to cleanup circuit breaker logs:', error);
      }
    } catch (error) {
      console.error('Error during circuit breaker cleanup:', error);
    }
  }
}