import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  Shield, 
  TrendingUp, 
  Activity,
  Zap,
  Gauge
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CostMetrics {
  currentCostPerDeal: number;
  currentCostPerMinute: number;
  totalCostToday: number;
  degredationTriggered: boolean;
  activeJobs: number;
  queuedJobs: number;
}

interface LoadControlGuardsProps {
  onCostThresholdReached: () => void;
  onDegradationMode: (enabled: boolean) => void;
}

const COST_LIMITS = {
  maxCostPerDeal: 25.00,
  maxCostPerMinute: 100.00,
  warningThreshold: 0.8, // 80% of limit
  criticalThreshold: 0.95 // 95% of limit
};

export const LoadControlGuards: React.FC<LoadControlGuardsProps> = ({
  onCostThresholdReached,
  onDegradationMode
}) => {
  const [metrics, setMetrics] = useState<CostMetrics>({
    currentCostPerDeal: 0,
    currentCostPerMinute: 0,
    totalCostToday: 0,
    degredationTriggered: false,
    activeJobs: 0,
    queuedJobs: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCostMetrics();
    
    // Set up real-time monitoring
    const interval = setInterval(fetchCostMetrics, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchCostMetrics = async () => {
    try {
      setLoading(true);
      
      // Fetch today's cost tracking data
      const today = new Date().toISOString().split('T')[0];
      
      const { data: costData, error: costError } = await supabase
        .from('analysis_cost_tracking')
        .select('*')
        .gte('created_at', `${today}T00:00:00.000Z`)
        .order('created_at', { ascending: false });

      if (costError) throw costError;

      // Calculate current metrics
      const totalCostToday = costData?.reduce((sum, item) => sum + (item.total_cost || 0), 0) || 0;
      
      // Get current per-deal and per-minute costs (last hour average)
      const lastHour = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const recentCosts = costData?.filter(item => item.created_at >= lastHour) || [];
      
      const avgCostPerDeal = recentCosts.length > 0 
        ? recentCosts.reduce((sum, item) => sum + (item.cost_per_deal || 0), 0) / recentCosts.length
        : 0;
        
      const avgCostPerMinute = recentCosts.length > 0
        ? recentCosts.reduce((sum, item) => sum + (item.cost_per_minute || 0), 0) / recentCosts.length
        : 0;

      const degradationTriggered = recentCosts.some(item => item.degradation_triggered);

      // Fetch queue metrics
      const { data: queueData, error: queueError } = await supabase
        .from('analysis_queue')
        .select('status')
        .in('status', ['queued', 'processing']);

      if (queueError) throw queueError;

      const activeJobs = queueData?.filter(item => item.status === 'processing').length || 0;
      const queuedJobs = queueData?.filter(item => item.status === 'queued').length || 0;

      const newMetrics = {
        currentCostPerDeal: avgCostPerDeal,
        currentCostPerMinute: avgCostPerMinute,
        totalCostToday,
        degredationTriggered: degradationTriggered,
        activeJobs,
        queuedJobs
      };

      setMetrics(newMetrics);

      // Check thresholds and trigger alerts
      checkCostThresholds(newMetrics);

    } catch (error) {
      console.error('Error fetching cost metrics:', error);
      toast({
        title: "Error",
        description: "Failed to load cost monitoring data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const checkCostThresholds = (currentMetrics: CostMetrics) => {
    const dealCostRatio = currentMetrics.currentCostPerDeal / COST_LIMITS.maxCostPerDeal;
    const minuteCostRatio = currentMetrics.currentCostPerMinute / COST_LIMITS.maxCostPerMinute;
    
    const maxRatio = Math.max(dealCostRatio, minuteCostRatio);

    if (maxRatio >= COST_LIMITS.criticalThreshold) {
      toast({
        title: "Critical Cost Alert",
        description: "Cost limits nearly exceeded. Degradation mode may be triggered.",
        variant: "destructive"
      });
      onCostThresholdReached();
    } else if (maxRatio >= COST_LIMITS.warningThreshold) {
      toast({
        title: "Cost Warning",
        description: "Approaching cost limits. Consider reducing analysis frequency.",
        variant: "default"
      });
    }

    if (currentMetrics.degredationTriggered) {
      onDegradationMode(true);
    }
  };

  const getCostLevelColor = (current: number, limit: number) => {
    const ratio = current / limit;
    if (ratio >= COST_LIMITS.criticalThreshold) return 'text-red-600';
    if (ratio >= COST_LIMITS.warningThreshold) return 'text-amber-600';
    return 'text-green-600';
  };

  const getCostProgress = (current: number, limit: number) => {
    return Math.min(100, (current / limit) * 100);
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-2 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Cost Control Panel */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Load & Cost Control
            {metrics.degredationTriggered && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Degraded
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Cost Per Deal */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm font-medium">Cost per Deal</span>
              </div>
              <span className={`text-sm font-mono ${getCostLevelColor(metrics.currentCostPerDeal, COST_LIMITS.maxCostPerDeal)}`}>
                ${metrics.currentCostPerDeal.toFixed(2)} / ${COST_LIMITS.maxCostPerDeal.toFixed(2)}
              </span>
            </div>
            <Progress 
              value={getCostProgress(metrics.currentCostPerDeal, COST_LIMITS.maxCostPerDeal)} 
              className="h-2"
            />
          </div>

          {/* Cost Per Minute */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Cost per Minute</span>
              </div>
              <span className={`text-sm font-mono ${getCostLevelColor(metrics.currentCostPerMinute, COST_LIMITS.maxCostPerMinute)}`}>
                ${metrics.currentCostPerMinute.toFixed(2)} / ${COST_LIMITS.maxCostPerMinute.toFixed(2)}
              </span>
            </div>
            <Progress 
              value={getCostProgress(metrics.currentCostPerMinute, COST_LIMITS.maxCostPerMinute)} 
              className="h-2"
            />
          </div>

          {/* Daily Total */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span>Total Cost Today</span>
              </div>
              <span className="font-mono">${metrics.totalCostToday.toFixed(2)}</span>
            </div>
          </div>

          {/* Queue Status */}
          <div className="flex items-center justify-between text-sm pt-2 border-t">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-600" />
                <span>Active: {metrics.activeJobs}</span>
              </div>
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-amber-600" />
                <span>Queued: {metrics.queuedJobs}</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCostMetrics}
              className="gap-2"
            >
              <Zap className="h-3 w-3" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Degradation Mode Alert */}
      {metrics.degredationTriggered && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Degradation Mode Active:</strong> Analysis quality has been reduced to stay within cost limits. 
            Some features may be temporarily disabled until costs decrease.
          </AlertDescription>
        </Alert>
      )}

      {/* Smart Batching Status */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4" />
              <span className="text-sm font-medium">Smart Batching</span>
            </div>
            <Badge variant={metrics.queuedJobs > 10 ? "default" : "secondary"}>
              {metrics.queuedJobs > 10 ? 'Active' : 'Standby'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Automatically groups analysis requests to optimize cost and performance
          </p>
        </CardContent>
      </Card>
    </div>
  );
};