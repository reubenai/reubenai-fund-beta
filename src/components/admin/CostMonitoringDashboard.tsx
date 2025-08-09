import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  Clock,
  Activity,
  BarChart3
} from 'lucide-react';

interface CostMetrics {
  agent_name: string;
  total_cost_24h: number;
  avg_cost_per_deal: number;
  avg_cost_per_minute: number;
  execution_count: number;
  degradation_events: number;
  cost_limit_per_deal: number;
  cost_limit_per_minute: number;
  utilization_percentage: number;
}

interface SystemCostOverview {
  total_daily_cost: number;
  total_monthly_projection: number;
  degraded_agents: number;
  cost_alerts: number;
  execution_efficiency: number;
}

export function CostMonitoringDashboard() {
  const [costMetrics, setCostMetrics] = useState<CostMetrics[]>([]);
  const [systemOverview, setSystemOverview] = useState<SystemCostOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCostData();
    const interval = setInterval(fetchCostData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchCostData = async () => {
    try {
      // Fetch cost tracking data for last 24 hours
      const { data: costData, error: costError } = await supabase
        .from('analysis_cost_tracking')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (costError) throw costError;

      // Fetch ops control switches for limits
      const { data: switchesData, error: switchesError } = await supabase
        .from('ops_control_switches')
        .select('*');

      if (switchesError) throw switchesError;

      // Process and aggregate data
      const agentMap = new Map<string, CostMetrics>();
      const switches = new Map(
        (switchesData || []).map(s => [s.agent_name, s])
      );

      // Process cost data
      (costData || []).forEach((record: any) => {
        const agentName = extractAgentName(record.execution_id);
        
        if (!agentMap.has(agentName)) {
          const switchData = switches.get(agentName);
          const config = switchData?.config as { max_cost_per_deal?: number; max_cost_per_minute?: number } || {};
          agentMap.set(agentName, {
            agent_name: agentName,
            total_cost_24h: 0,
            avg_cost_per_deal: 0,
            avg_cost_per_minute: 0,
            execution_count: 0,
            degradation_events: 0,
            cost_limit_per_deal: config.max_cost_per_deal || 0,
            cost_limit_per_minute: config.max_cost_per_minute || 0,
            utilization_percentage: 0
          });
        }

        const metrics = agentMap.get(agentName)!;
        metrics.total_cost_24h += record.total_cost || 0;
        metrics.execution_count += 1;
        metrics.avg_cost_per_deal = Math.max(metrics.avg_cost_per_deal, record.cost_per_deal || 0);
        metrics.avg_cost_per_minute = Math.max(metrics.avg_cost_per_minute, record.cost_per_minute || 0);
        
        if (record.degradation_triggered) {
          metrics.degradation_events += 1;
        }
      });

      // Calculate utilization percentages
      agentMap.forEach((metrics) => {
        if (metrics.cost_limit_per_deal > 0) {
          metrics.utilization_percentage = Math.min(
            100,
            (metrics.avg_cost_per_deal / metrics.cost_limit_per_deal) * 100
          );
        }
      });

      const metricsArray = Array.from(agentMap.values());
      setCostMetrics(metricsArray);

      // Calculate system overview
      const totalCost = metricsArray.reduce((sum, m) => sum + m.total_cost_24h, 0);
      const degradedCount = metricsArray.filter(m => m.degradation_events > 0).length;
      const highUtilization = metricsArray.filter(m => m.utilization_percentage > 80).length;
      const totalExecutions = metricsArray.reduce((sum, m) => sum + m.execution_count, 0);

      setSystemOverview({
        total_daily_cost: totalCost,
        total_monthly_projection: totalCost * 30,
        degraded_agents: degradedCount,
        cost_alerts: highUtilization,
        execution_efficiency: totalExecutions > 0 ? totalCost / totalExecutions : 0
      });

    } catch (error) {
      console.error('Error fetching cost data:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractAgentName = (executionId: string): string => {
    if (executionId.includes('market-intelligence')) return 'market-intelligence-engine';
    if (executionId.includes('financial')) return 'financial-engine';
    if (executionId.includes('team-research')) return 'team-research-engine';
    if (executionId.includes('product-ip')) return 'product-ip-engine';
    if (executionId.includes('thesis-alignment')) return 'thesis-alignment-engine';
    if (executionId.includes('enhanced-deal')) return 'enhanced-deal-analysis';
    if (executionId.includes('orchestrator')) return 'reuben-orchestrator';
    return 'unknown-agent';
  };

  const getCostStatus = (utilization: number, degradationEvents: number) => {
    if (degradationEvents > 0) return { status: 'critical', color: 'text-red-500' };
    if (utilization > 80) return { status: 'warning', color: 'text-yellow-500' };
    if (utilization > 60) return { status: 'moderate', color: 'text-blue-500' };
    return { status: 'healthy', color: 'text-green-500' };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Cost Overview */}
      {systemOverview && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">24h Cost</p>
                  <p className="text-2xl font-bold">${systemOverview.total_daily_cost.toFixed(2)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Monthly Proj.</p>
                  <p className="text-2xl font-bold">${systemOverview.total_monthly_projection.toFixed(0)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cost/Execution</p>
                  <p className="text-2xl font-bold">${systemOverview.execution_efficiency.toFixed(2)}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Degraded</p>
                  <p className="text-2xl font-bold">{systemOverview.degraded_agents}</p>
                </div>
                <AlertTriangle className={`h-8 w-8 ${systemOverview.degraded_agents > 0 ? 'text-red-500' : 'text-green-500'}`} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">High Usage</p>
                  <p className="text-2xl font-bold">{systemOverview.cost_alerts}</p>
                </div>
                <Activity className={`h-8 w-8 ${systemOverview.cost_alerts > 0 ? 'text-yellow-500' : 'text-green-500'}`} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Agent Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Agent Cost Analysis (24h)
          </CardTitle>
          <CardDescription>
            Real-time cost monitoring with degradation tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {costMetrics.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No cost data available for the last 24 hours
              </p>
            ) : (
              costMetrics.map((metrics) => {
                const status = getCostStatus(metrics.utilization_percentage, metrics.degradation_events);
                
                return (
                  <div key={metrics.agent_name} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">
                          {metrics.agent_name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {metrics.execution_count} executions
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">${metrics.total_cost_24h.toFixed(2)}</p>
                        <Badge variant={status.status === 'healthy' ? 'default' : status.status === 'warning' ? 'secondary' : 'destructive'}>
                          {status.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Avg/Deal:</span>
                        <p className="font-medium">${metrics.avg_cost_per_deal.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Avg/Min:</span>
                        <p className="font-medium">${metrics.avg_cost_per_minute.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Limit/Deal:</span>
                        <p className="font-medium">${metrics.cost_limit_per_deal.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Degraded:</span>
                        <p className="font-medium">{metrics.degradation_events}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Cost Utilization</span>
                        <span className={status.color}>{metrics.utilization_percentage.toFixed(1)}%</span>
                      </div>
                      <Progress 
                        value={metrics.utilization_percentage} 
                        className="h-2"
                      />
                    </div>

                    {metrics.degradation_events > 0 && (
                      <Alert className="mt-3">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          This agent triggered degradation mode {metrics.degradation_events} time{metrics.degradation_events > 1 ? 's' : ''} 
                          in the last 24 hours due to cost limits.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cost Alerts */}
      {systemOverview && (systemOverview.degraded_agents > 0 || systemOverview.cost_alerts > 0) && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Cost Alert:</strong> {systemOverview.degraded_agents} agent{systemOverview.degraded_agents !== 1 ? 's' : ''} 
            experienced degradation and {systemOverview.cost_alerts} agent{systemOverview.cost_alerts !== 1 ? 's are' : ' is'} 
            approaching cost limits. Review usage patterns and consider adjusting thresholds.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}