import { supabase } from '@/integrations/supabase/client';

interface IdempotencyKeyRecord {
  id: string;
  key: string;
  result: any;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
  expires_at: string;
}

/**
 * Redis-based Idempotency Key System
 * Prevents duplicate operations by checking for prior keys on invocation
 */
export class IdempotencyManager {
  private static readonly DEFAULT_TTL_MINUTES = 60;
  private static readonly CLEANUP_INTERVAL_MINUTES = 30;

  /**
   * Check for existing idempotency key, return memoized result if present
   */
  static async checkIdempotencyKey(
    key: string, 
    ttlMinutes: number = this.DEFAULT_TTL_MINUTES
  ): Promise<{ exists: boolean; result?: any; canProceed: boolean }> {
    try {
      const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();
      
      // Check for existing key
      const { data: existing, error: checkError } = await supabase
        .from('idempotency_keys' as any)
        .select('*')
        .eq('key', key)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Idempotency check failed:', checkError);
        return { exists: false, canProceed: true }; // Fail open
      }

      if (existing) {
        const status = (existing as any).status;
        const result = (existing as any).result;
        const completedAt = (existing as any).completed_at;
        const createdAt = (existing as any).created_at;

        if (status === 'completed') {
          return { 
            exists: true, 
            result, 
            canProceed: false 
          };
        } else if (status === 'pending') {
          // Operation in progress, reject duplicate
          return { 
            exists: true, 
            result: { error: 'Operation in progress' }, 
            canProceed: false 
          };
        } else if (status === 'failed') {
          // Allow retry for failed operations after some time
          const failedAt = new Date(completedAt || createdAt);
          const retryAfter = new Date(failedAt.getTime() + 5 * 60 * 1000); // 5 min retry delay
          
          if (new Date() > retryAfter) {
            return { exists: false, canProceed: true };
          } else {
            return { 
              exists: true, 
              result: { error: 'Retry too soon after failure' }, 
              canProceed: false 
            };
          }
        }
      }

      // Create new idempotency key
      const { error: createError } = await supabase
        .from('idempotency_keys' as any)
        .insert({
          key,
          status: 'pending',
          expires_at: expiresAt
        });

      if (createError) {
        console.error('Failed to create idempotency key:', createError);
        return { exists: false, canProceed: true }; // Fail open
      }

      return { exists: false, canProceed: true };
    } catch (error) {
      console.error('Idempotency manager error:', error);
      return { exists: false, canProceed: true }; // Fail open for safety
    }
  }

  /**
   * Mark idempotency key as completed with result
   */
  static async markCompleted(key: string, result: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('idempotency_keys' as any)
        .update({
          status: 'completed',
          result,
          completed_at: new Date().toISOString()
        })
        .eq('key', key)
        .eq('status', 'pending');

      if (error) {
        console.error('Failed to mark idempotency key as completed:', error);
      }
    } catch (error) {
      console.error('Error marking idempotency key as completed:', error);
    }
  }

  /**
   * Mark idempotency key as failed
   */
  static async markFailed(key: string, error: any): Promise<void> {
    try {
      const { error: updateError } = await supabase
        .from('idempotency_keys' as any)
        .update({
          status: 'failed',
          result: { error: error?.message || 'Operation failed' },
          completed_at: new Date().toISOString()
        })
        .eq('key', key)
        .eq('status', 'pending');

      if (updateError) {
        console.error('Failed to mark idempotency key as failed:', updateError);
      }
    } catch (err) {
      console.error('Error marking idempotency key as failed:', err);
    }
  }

  /**
   * Generate idempotency key for analysis operations
   */
  static generateAnalysisKey(dealId: string, operation: string, userId?: string): string {
    const timestamp = new Date().toISOString().split('T')[0]; // Daily granularity
    return `analysis:${operation}:${dealId}:${userId || 'system'}:${timestamp}`;
  }

  /**
   * Cleanup expired idempotency keys
   */
  static async cleanup(): Promise<void> {
    try {
      const { error } = await supabase
        .from('idempotency_keys' as any)
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) {
        console.error('Failed to cleanup expired idempotency keys:', error);
      } else {
        console.log('✅ Expired idempotency keys cleaned up');
      }
    } catch (error) {
      console.error('Error during idempotency cleanup:', error);
    }
  }
}