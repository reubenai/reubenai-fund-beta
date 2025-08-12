import { supabase } from '@/integrations/supabase/client';

interface QueueGuardConfig {
  maxQueueDepth: number;
  maxProcessingTime: number; // in minutes
  priority: 'high' | 'normal' | 'low';
  fundId?: string;
}

export class AnalysisQueueGuards {
  private static defaultConfig: QueueGuardConfig = {
    maxQueueDepth: 100,
    maxProcessingTime: 15,
    priority: 'normal'
  };

  /**
   * Smart queueing with bottleneck prevention
   */
  static async smartQueue(
    dealId: string, 
    triggerReason: string,
    config: Partial<QueueGuardConfig> = {}
  ): Promise<{ success: boolean; queued: boolean; reason?: string }> {
    const finalConfig = { ...this.defaultConfig, ...config };

    try {
      // Check current queue health
      const queueHealth = await this.checkQueueHealth(finalConfig.fundId);
      
      // Apply circuit breaker logic
      if (!queueHealth.canAcceptNew) {
        return {
          success: false,
          queued: false,
          reason: queueHealth.blockReason
        };
      }

      // Check for existing queue entries for this deal
      const { data: existingEntry } = await supabase
        .from('analysis_queue')
        .select('*')
        .eq('deal_id', dealId)
        .in('status', ['queued', 'processing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // If already queued recently, don't add another entry
      if (existingEntry) {
        const timeSinceQueued = Date.now() - new Date(existingEntry.created_at).getTime();
        if (timeSinceQueued < 5 * 60 * 1000) { // 5 minutes
          return {
            success: true,
            queued: false,
            reason: 'Already queued recently'
          };
        }
      }

      // Calculate smart delay based on current load
      const smartDelay = this.calculateSmartDelay(queueHealth, finalConfig.priority);

      // Queue with intelligent prioritization
      const { data, error } = await supabase.functions.invoke('queue-deal-analysis', {
        body: {
          dealId,
          triggerReason,
          priority: finalConfig.priority,
          delayMinutes: smartDelay,
          metadata: {
            guardedQueue: true,
            queueHealthSnapshot: queueHealth
          }
        }
      });

      if (error) throw error;

      return {
        success: true,
        queued: true,
        reason: `Queued with ${smartDelay}min delay`
      };

    } catch (error) {
      console.error('Smart queue error:', error);
      return {
        success: false,
        queued: false,
        reason: 'Queue guard failed'
      };
    }
  }

  /**
   * Check queue health and apply circuit breaker logic
   */
  private static async checkQueueHealth(fundId?: string): Promise<{
    canAcceptNew: boolean;
    blockReason?: string;
    queueDepth: number;
    processingItems: number;
    avgProcessingTime: number;
  }> {
    try {
      const { data: queueStats } = await supabase
        .from('analysis_queue')
        .select('status, created_at, completed_at, fund_id')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (!queueStats) {
        return {
          canAcceptNew: true,
          queueDepth: 0,
          processingItems: 0,
          avgProcessingTime: 0
        };
      }

      // Filter by fund if specified
      const relevantStats = fundId 
        ? queueStats.filter(item => item.fund_id === fundId)
        : queueStats;

      const queued = relevantStats.filter(q => q.status === 'queued');
      const processing = relevantStats.filter(q => q.status === 'processing');
      const completed = relevantStats.filter(q => q.status === 'completed' && q.completed_at);
      const failed = relevantStats.filter(q => q.status === 'failed');

      // Calculate average processing time
      const avgProcessingTime = completed.length > 0
        ? completed.reduce((acc, item) => {
            const duration = new Date(item.completed_at!).getTime() - new Date(item.created_at).getTime();
            return acc + duration;
          }, 0) / completed.length / 1000 / 60 // minutes
        : 0;

      // Circuit breaker conditions
      if (queued.length > 50) {
        return {
          canAcceptNew: false,
          blockReason: 'Queue overloaded - too many items waiting',
          queueDepth: queued.length,
          processingItems: processing.length,
          avgProcessingTime
        };
      }

      if (processing.length > 10) {
        return {
          canAcceptNew: false,
          blockReason: 'Too many items currently processing',
          queueDepth: queued.length,
          processingItems: processing.length,
          avgProcessingTime
        };
      }

      // Check for stuck items
      const stuckItems = processing.filter(item => {
        const timeSinceStart = Date.now() - new Date(item.created_at).getTime();
        return timeSinceStart > 15 * 60 * 1000; // 15 minutes
      });

      if (stuckItems.length > 3) {
        return {
          canAcceptNew: false,
          blockReason: 'Multiple stuck items detected - processing may be stalled',
          queueDepth: queued.length,
          processingItems: processing.length,
          avgProcessingTime
        };
      }

      // High failure rate check
      const failureRate = failed.length / Math.max(completed.length + failed.length, 1);
      if (failureRate > 0.3) {
        return {
          canAcceptNew: false,
          blockReason: 'High failure rate detected - system may be unstable',
          queueDepth: queued.length,
          processingItems: processing.length,
          avgProcessingTime
        };
      }

      return {
        canAcceptNew: true,
        queueDepth: queued.length,
        processingItems: processing.length,
        avgProcessingTime
      };

    } catch (error) {
      console.error('Queue health check failed:', error);
      return {
        canAcceptNew: false,
        blockReason: 'Unable to assess queue health',
        queueDepth: 0,
        processingItems: 0,
        avgProcessingTime: 0
      };
    }
  }

  /**
   * Calculate smart delay based on current queue load and priority
   */
  private static calculateSmartDelay(
    queueHealth: { queueDepth: number; processingItems: number; avgProcessingTime: number },
    priority: 'high' | 'normal' | 'low'
  ): number {
    const baseDelay = queueHealth.queueDepth * 0.5; // 30 seconds per queued item
    const processingDelay = queueHealth.processingItems * 1; // 1 minute per processing item
    
    let priorityMultiplier = 1;
    switch (priority) {
      case 'high': priorityMultiplier = 0.25; break;
      case 'normal': priorityMultiplier = 1; break;
      case 'low': priorityMultiplier = 2; break;
    }
    
    const calculatedDelay = (baseDelay + processingDelay) * priorityMultiplier;
    
    // Clamp between 1 minute and 30 minutes
    return Math.max(1, Math.min(30, Math.round(calculatedDelay)));
  }

  /**
   * Emergency queue drain - removes old failed items and resets stuck items
   */
  static async emergencyDrain(): Promise<{ drained: number; reset: number }> {
    try {
      // Remove old failed items (older than 2 hours)
      const { data: drainedData } = await supabase
        .from('analysis_queue')
        .delete()
        .eq('status', 'failed')
        .lt('created_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString());

      // Reset stuck items (processing for more than 20 minutes)
      const { data: resetData } = await supabase
        .from('analysis_queue')
        .update({ 
          status: 'queued',
          scheduled_for: new Date(Date.now() + 2 * 60 * 1000).toISOString() // reschedule in 2 minutes
        })
        .eq('status', 'processing')
        .lt('created_at', new Date(Date.now() - 20 * 60 * 1000).toISOString());

      return {
        drained: 0, // Delete operations don't return count
        reset: 0 // Update operations don't return count reliably
      };

    } catch (error) {
      console.error('Emergency drain failed:', error);
      return { drained: 0, reset: 0 };
    }
  }
}

// Convenience functions for common use cases
export const queueDealAnalysis = (dealId: string, triggerReason: string, priority: 'high' | 'normal' | 'low' = 'normal', fundId?: string) => {
  return AnalysisQueueGuards.smartQueue(dealId, triggerReason, { priority, fundId });
};

export const emergencyDrainQueue = () => {
  return AnalysisQueueGuards.emergencyDrain();
};