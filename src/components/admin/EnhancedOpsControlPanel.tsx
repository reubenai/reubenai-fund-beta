import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Activity,
  RefreshCw,
  Settings
} from 'lucide-react';

interface OpsControlSwitch {
  id: string;
  agent_name: string;
  enabled: boolean;
  circuit_breaker_open: boolean;
  failure_count: number;
  last_failure_at: string | null;
  config: {
    max_cost_per_deal: number;
    max_cost_per_minute: number;
  };
}

interface CostTracking {
  agent_name: string;
  total_cost: number;
  cost_per_deal: number;
  cost_per_minute: number;
  degradation_triggered: boolean;
  execution_count: number;
}

export function EnhancedOpsControlPanel() {
  const [switches, setSwitches] = useState<OpsControlSwitch[]>([]);
  const [costTracking, setCostTracking] = useState<CostTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOpsData();
    const interval = setInterval(fetchOpsData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchOpsData = async () => {
    try {
      setRefreshing(true);
      
      // Fetch ops control switches
      const { data: switchesData, error: switchesError } = await supabase
        .from('ops_control_switches')
        .select('*')
        .order('agent_name');

      if (switchesError) throw switchesError;

      // Fetch cost tracking data (aggregated)
      const { data: costData, error: costError } = await supabase
        .from('analysis_cost_tracking')
        .select(`
          execution_id,
          cost_per_deal,
          cost_per_minute,
          total_cost,
          degradation_triggered,
          created_at
        `)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (costError) throw costError;

      // Process cost data by agent (inferred from execution patterns)
      const costByAgent: { [key: string]: CostTracking } = {};
      (costData || []).forEach((cost: any) => {
        // Extract agent name from execution_id pattern or default grouping
        const agentName = extractAgentFromExecutionId(cost.execution_id);
        
        if (!costByAgent[agentName]) {
          costByAgent[agentName] = {
            agent_name: agentName,
            total_cost: 0,
            cost_per_deal: 0,
            cost_per_minute: 0,
            degradation_triggered: false,
            execution_count: 0
          };
        }
        
        costByAgent[agentName].total_cost += cost.total_cost || 0;
        costByAgent[agentName].execution_count += 1;
        costByAgent[agentName].cost_per_deal = Math.max(
          costByAgent[agentName].cost_per_deal,
          cost.cost_per_deal || 0
        );
        costByAgent[agentName].cost_per_minute = Math.max(
          costByAgent[agentName].cost_per_minute,
          cost.cost_per_minute || 0
        );
        if (cost.degradation_triggered) {
          costByAgent[agentName].degradation_triggered = true;
        }
      });

      setSwitches((switchesData || []).map(s => ({
        ...s,
        config: s.config as { max_cost_per_deal: number; max_cost_per_minute: number }
      })));
      setCostTracking(Object.values(costByAgent));
    } catch (error) {
      console.error('Error fetching ops data:', error);
      toast.error('Failed to fetch operations data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const extractAgentFromExecutionId = (executionId: string): string => {
    // Try to extract agent name from execution ID patterns
    if (executionId.includes('market-intelligence')) return 'market-intelligence-engine';
    if (executionId.includes('financial')) return 'financial-engine';
    if (executionId.includes('team-research')) return 'team-research-engine';
    if (executionId.includes('product-ip')) return 'product-ip-engine';
    if (executionId.includes('thesis-alignment')) return 'thesis-alignment-engine';
    if (executionId.includes('enhanced-deal')) return 'enhanced-deal-analysis';
    if (executionId.includes('orchestrator')) return 'reuben-orchestrator';
    return 'unknown-agent';
  };

  const toggleAgent = async (agentName: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('ops_control_switches')
        .update({ enabled })
        .eq('agent_name', agentName);

      if (error) throw error;

      setSwitches(prev => prev.map(s => 
        s.agent_name === agentName ? { ...s, enabled } : s
      ));

      toast.success(`${agentName} ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling agent:', error);
      toast.error('Failed to toggle agent');
    }
  };

  const resetCircuitBreaker = async (agentName: string) => {
    try {
      const { error } = await supabase
        .from('ops_control_switches')
        .update({ 
          circuit_breaker_open: false, 
          failure_count: 0,
          last_failure_at: null
        })
        .eq('agent_name', agentName);

      if (error) throw error;

      setSwitches(prev => prev.map(s => 
        s.agent_name === agentName 
          ? { ...s, circuit_breaker_open: false, failure_count: 0, last_failure_at: null }
          : s
      ));

      toast.success(`Circuit breaker reset for ${agentName}`);
    } catch (error) {
      console.error('Error resetting circuit breaker:', error);
      toast.error('Failed to reset circuit breaker');
    }
  };

  const getAgentStatus = (agent: OpsControlSwitch) => {
    if (!agent.enabled) return { status: 'disabled', color: 'bg-gray-500' };
    if (agent.circuit_breaker_open) return { status: 'circuit_open', color: 'bg-red-500' };
    if (agent.failure_count > 0) return { status: 'degraded', color: 'bg-yellow-500' };
    return { status: 'healthy', color: 'bg-green-500' };
  };

  const getCostStatus = (agent: CostTracking, switchConfig?: OpsControlSwitch) => {
    if (!switchConfig) return 'unknown';
    
    const { max_cost_per_deal, max_cost_per_minute } = switchConfig.config;
    
    if (agent.degradation_triggered) return 'degraded';
    if (agent.cost_per_deal > max_cost_per_deal * 0.8 || 
        agent.cost_per_minute > max_cost_per_minute * 0.8) return 'warning';
    return 'healthy';
  };

  const totalSystemCost = costTracking.reduce((sum, agent) => sum + agent.total_cost, 0);
  const degradedAgents = switches.filter(s => !s.enabled || s.circuit_breaker_open).length;
  const totalExecutions = costTracking.reduce((sum, agent) => sum + agent.execution_count, 0);

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
      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">System Status</p>
                <p className="text-2xl font-bold">
                  {degradedAgents === 0 ? 'Healthy' : 'Degraded'}
                </p>
              </div>
              <Shield className={`h-8 w-8 ${degradedAgents === 0 ? 'text-green-500' : 'text-red-500'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">24h Cost</p>
                <p className="text-2xl font-bold">${totalSystemCost.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Executions</p>
                <p className="text-2xl font-bold">{totalExecutions}</p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Agents</p>
                <p className="text-2xl font-bold">
                  {switches.filter(s => s.enabled && !s.circuit_breaker_open).length}/{switches.length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Control Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Agent Control Panel
              </CardTitle>
              <CardDescription>
                Manage AI agents and circuit breakers
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchOpsData}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cost Limits</TableHead>
                <TableHead>24h Usage</TableHead>
                <TableHead>Failures</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {switches.map((agent) => {
                const status = getAgentStatus(agent);
                const costData = costTracking.find(c => c.agent_name === agent.agent_name);
                const costStatus = costData ? getCostStatus(costData, agent) : 'unknown';
                
                return (
                  <TableRow key={agent.id}>
                    <TableCell className="font-medium">
                      {agent.agent_name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${status.color}`}></div>
                        <Badge variant={status.status === 'healthy' ? 'default' : 'destructive'}>
                          {status.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>${agent.config.max_cost_per_deal}/deal</div>
                        <div>${agent.config.max_cost_per_minute}/min</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {costData ? (
                        <div className="text-sm">
                          <div className="font-medium">${costData.total_cost.toFixed(2)}</div>
                          <Badge 
                            variant={costStatus === 'healthy' ? 'default' : costStatus === 'warning' ? 'secondary' : 'destructive'}
                            className="text-xs"
                          >
                            {costData.execution_count} runs
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No data</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {agent.failure_count > 0 ? (
                        <Badge variant="destructive">
                          {agent.failure_count} failures
                        </Badge>
                      ) : (
                        <Badge variant="default">
                          Stable
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={agent.enabled}
                          onCheckedChange={(enabled) => toggleAgent(agent.agent_name, enabled)}
                        />
                        {agent.circuit_breaker_open && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => resetCircuitBreaker(agent.agent_name)}
                          >
                            Reset
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Alerts */}
      {degradedAgents > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {degradedAgents} agent{degradedAgents > 1 ? 's are' : ' is'} currently disabled or degraded. 
            This may impact analysis capabilities.
          </AlertDescription>
        </Alert>
      )}

      {costTracking.some(c => c.degradation_triggered) && (
        <Alert>
          <DollarSign className="h-4 w-4" />
          <AlertDescription>
            Cost limits triggered degradation mode for some agents. Review cost thresholds and usage patterns.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}