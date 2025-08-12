import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface QueueHealth {
  totalQueued: number;
  oldestQueueTime: string | null;
  processingItems: number;
  failedInLast24h: number;
  averageProcessingTime: number;
  isHealthy: boolean;
  warnings: string[];
}

interface QueueResilience {
  queueHealth: QueueHealth | null;
  isMonitoring: boolean;
  forceProcessQueue: () => Promise<void>;
  drainFailedItems: () => Promise<number>;
  reclaimStuckItems: () => Promise<number>;
  getProcessingEstimate: (priority: string) => string;
}

export function useAnalysisQueueResilience(fundId?: string): QueueResilience {
  const [queueHealth, setQueueHealth] = useState<QueueHealth | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const checkQueueHealth = useCallback(async (): Promise<QueueHealth> => {
    try {
      const { data: queueStats } = await supabase
        .from('analysis_queue')
        .select('status, priority, created_at, scheduled_for, completed_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (!queueStats) {
        return {
          totalQueued: 0,
          oldestQueueTime: null,
          processingItems: 0,
          failedInLast24h: 0,
          averageProcessingTime: 0,
          isHealthy: true,
          warnings: []
        };
      }

      const queued = queueStats.filter(q => q.status === 'queued');
      const processing = queueStats.filter(q => q.status === 'processing');
      const failed = queueStats.filter(q => q.status === 'failed');
      const completed = queueStats.filter(q => q.status === 'completed' && q.completed_at);

      const averageProcessingTime = completed.length > 0 
        ? completed.reduce((acc, item) => {
            const start = new Date(item.created_at).getTime();
            const end = new Date(item.completed_at!).getTime();
            return acc + (end - start);
          }, 0) / completed.length / 1000 / 60 // minutes
        : 0;

      const oldestQueued = queued.length > 0 
        ? queued.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0]
        : null;

      const warnings: string[] = [];
      
      if (queued.length > 50) {
        warnings.push(`High queue depth: ${queued.length} items waiting`);
      }
      
      if (processing.filter(p => 
        new Date().getTime() - new Date(p.created_at).getTime() > 10 * 60 * 1000
      ).length > 0) {
        warnings.push('Items stuck in processing state detected');
      }
      
      if (failed.length > 10) {
        warnings.push(`High failure rate: ${failed.length} failures in 24h`);
      }

      return {
        totalQueued: queued.length,
        oldestQueueTime: oldestQueued?.created_at || null,
        processingItems: processing.length,
        failedInLast24h: failed.length,
        averageProcessingTime,
        isHealthy: warnings.length === 0 && queued.length < 20,
        warnings
      };
    } catch (error) {
      console.error('Error checking queue health:', error);
      return {
        totalQueued: 0,
        oldestQueueTime: null,
        processingItems: 0,
        failedInLast24h: 0,
        averageProcessingTime: 0,
        isHealthy: false,
        warnings: ['Unable to check queue health']
      };
    }
  }, []);

  const forceProcessQueue = useCallback(async () => {
    try {
      await supabase.functions.invoke('analysis-queue-processor', {
        body: { forceProcess: true, maxConcurrent: 5 }
      });
    } catch (error) {
      console.error('Error forcing queue processing:', error);
    }
  }, []);

  const drainFailedItems = useCallback(async (): Promise<number> => {
    try {
      const { data, error } = await supabase
        .from('analysis_queue')
        .delete()
        .eq('status', 'failed')
        .lt('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()); // older than 1 hour

      if (error) throw error;
      return 0; // Delete operations don't return array data
    } catch (error) {
      console.error('Error draining failed items:', error);
      return 0;
    }
  }, []);

  const reclaimStuckItems = useCallback(async (): Promise<number> => {
    try {
      const { data, error } = await supabase.functions.invoke('zombie-reclaimer');
      return data?.reclaimedCount || 0;
    } catch (error) {
      console.error('Error reclaiming stuck items:', error);
      return 0;
    }
  }, []);

  const getProcessingEstimate = useCallback((priority: string): string => {
    if (!queueHealth) return 'Unknown';
    
    const baseMinutes = queueHealth.averageProcessingTime || 3;
    const queuePosition = Math.ceil(queueHealth.totalQueued / 2); // Assume parallel processing
    
    let multiplier = 1;
    switch (priority) {
      case 'high': multiplier = 0.5; break;
      case 'normal': multiplier = 1; break;
      case 'low': multiplier = 2; break;
    }
    
    const estimatedMinutes = (baseMinutes * queuePosition * multiplier);
    
    if (estimatedMinutes < 60) {
      return `~${Math.max(2, Math.round(estimatedMinutes))} minutes`;
    } else {
      return `~${Math.round(estimatedMinutes / 60)} hours`;
    }
  }, [queueHealth]);

  useEffect(() => {
    if (isMonitoring) {
      const monitorInterval = setInterval(async () => {
        const health = await checkQueueHealth();
        setQueueHealth(health);
      }, 30000); // Check every 30 seconds

      // Initial check
      checkQueueHealth().then(setQueueHealth);

      return () => clearInterval(monitorInterval);
    }
  }, [isMonitoring, checkQueueHealth]);

  useEffect(() => {
    setIsMonitoring(true);
    return () => setIsMonitoring(false);
  }, []);

  return {
    queueHealth,
    isMonitoring,
    forceProcessQueue,
    drainFailedItems,
    reclaimStuckItems,
    getProcessingEstimate
  };
}