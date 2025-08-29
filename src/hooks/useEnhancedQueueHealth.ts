import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface QueueHealthMetrics {
  totalQueued: number;
  processingItems: number;
  failedInLast24h: number;
  averageProcessingTime: number;
  oldestQueueTime: string | null;
  isHealthy: boolean;
  warnings: string[];
  lastChecked: string;
}

interface QueueMetric {
  metric_type: string;
  metric_value: number;
  recorded_at: string;
  metadata: any;
}

export function useEnhancedQueueHealth() {
  const [queueHealth, setQueueHealth] = useState<QueueHealthMetrics | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [recentMetrics, setRecentMetrics] = useState<QueueMetric[]>([]);
  const { toast } = useToast();

  const checkQueueHealth = useCallback(async (): Promise<QueueHealthMetrics | null> => {
    try {
      const { data, error } = await supabase.rpc('get_queue_health_status');
      
      if (error) throw error;
      
      const healthData = data as unknown as QueueHealthMetrics;
      setQueueHealth(healthData);
      return healthData;
    } catch (error) {
      console.error('Error checking queue health:', error);
      return null;
    }
  }, []);

  const getRecentMetrics = useCallback(async (hours: number = 24) => {
    try {
      const { data, error } = await supabase
        .from('analysis_queue_metrics')
        .select('*')
        .gte('recorded_at', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
        .order('recorded_at', { ascending: false });

      if (error) throw error;
      setRecentMetrics(data || []);
      return data || [];
    } catch (error) {
      console.error('Error fetching recent metrics:', error);
      return [];
    }
  }, []);

  const recordMetric = useCallback(async (
    metricType: string,
    metricValue: number,
    metadata: any = {},
    fundId?: string,
    dealId?: string
  ) => {
    try {
      const { error } = await supabase
        .from('analysis_queue_metrics')
        .insert({
          metric_type: metricType,
          metric_value: metricValue,
          fund_id: fundId,
          deal_id: dealId,
          metadata,
          time_bucket: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error recording metric:', error);
    }
  }, []);

  const forceQueueProcessing = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('universal-analysis-processor');
      
      if (error) throw error;
      
      toast({
        title: "Queue Processing Triggered",
        description: "Enhanced queue processing has been initiated",
      });
      
      // Record the force processing event
      await recordMetric('force_processing', 1, { triggered_by: 'user' });
      
      // Refresh health status
      await checkQueueHealth();
      
      return data;
    } catch (error) {
      console.error('Error forcing queue processing:', error);
      toast({
        title: "Processing Error",
        description: "Failed to trigger queue processing",
        variant: "destructive"
      });
      throw error;
    }
  }, [toast, recordMetric, checkQueueHealth]);

  const getProcessingEstimate = useCallback((priority: 'high' | 'normal' | 'low' = 'normal') => {
    if (!queueHealth) return 'Unknown';
    
    const baseTime = queueHealth.averageProcessingTime || 5;
    const queueLength = queueHealth.totalQueued;
    
    let priorityMultiplier = 1;
    switch (priority) {
      case 'high':
        priorityMultiplier = 0.5;
        break;
      case 'low':
        priorityMultiplier = 1.5;
        break;
    }
    
    const estimatedMinutes = Math.ceil(baseTime * priorityMultiplier + (queueLength * 0.5));
    
    if (estimatedMinutes < 60) {
      return `${estimatedMinutes}m`;
    } else {
      const hours = Math.floor(estimatedMinutes / 60);
      const minutes = estimatedMinutes % 60;
      return `${hours}h ${minutes}m`;
    }
  }, [queueHealth]);

  const analyzeQueueTrends = useCallback(() => {
    if (recentMetrics.length < 2) return null;
    
    const processingTimes = recentMetrics
      .filter(m => m.metric_type === 'processing_time')
      .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());
    
    if (processingTimes.length < 2) return null;
    
    const recent = processingTimes.slice(-6); // Last 6 measurements
    const older = processingTimes.slice(-12, -6); // Previous 6 measurements
    
    const recentAvg = recent.reduce((sum, m) => sum + m.metric_value, 0) / recent.length;
    const olderAvg = older.reduce((sum, m) => sum + m.metric_value, 0) / older.length;
    
    const trend = recentAvg > olderAvg ? 'increasing' : 'decreasing';
    const change = Math.abs(((recentAvg - olderAvg) / olderAvg) * 100);
    
    return {
      trend,
      changePercent: Math.round(change),
      recentAverage: Math.round(recentAvg),
      olderAverage: Math.round(olderAvg)
    };
  }, [recentMetrics]);

  // Auto-monitoring effect
  useEffect(() => {
    if (!isMonitoring) return;
    
    const interval = setInterval(async () => {
      await checkQueueHealth();
      await getRecentMetrics();
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [isMonitoring, checkQueueHealth, getRecentMetrics]);

  // Initial load
  useEffect(() => {
    setIsMonitoring(true);
    checkQueueHealth();
    getRecentMetrics();
    
    return () => setIsMonitoring(false);
  }, [checkQueueHealth, getRecentMetrics]);

  return {
    queueHealth,
    recentMetrics,
    isMonitoring,
    checkQueueHealth,
    getRecentMetrics,
    recordMetric,
    forceQueueProcessing,
    getProcessingEstimate,
    analyzeQueueTrends
  };
}