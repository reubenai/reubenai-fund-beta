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
  CheckCircle, 
  Clock, 
  Activity,
  RefreshCw,
  Settings,
  Zap,
  DollarSign
} from 'lucide-react';

interface AIAgent {
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
  total_cost?: number;
  cost_per_deal?: number;
  execution_count?: number;
  degradation_triggered?: boolean;
}

export function AIAgentsHealthPanel() {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAgentsData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchAgentsData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAgentsData = async () => {
    try {
      setRefreshing(true);
      
      // Fetch ops control switches data
      const { data: switchesData, error: switchesError } = await supabase
        .from('ops_control_switches')
        .select('*')
        .order('agent_name');

      if (switchesError) throw switchesError;

      // Fetch cost tracking data
      const { data: costData, error: costError } = await supabase
        .from('analysis_cost_tracking')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (costError) throw costError;

      // Process cost data by agent
      const costByAgent = costData?.reduce((acc, cost) => {
        const agentName = extractAgentFromExecutionId(cost.execution_id);
        if (!acc[agentName]) {
          acc[agentName] = {
            total_cost: 0,
            cost_per_deal: 0,
            execution_count: 0,
            degradation_triggered: false
          };
        }
        acc[agentName].total_cost += Number(cost.total_cost || 0);
        acc[agentName].cost_per_deal += Number(cost.cost_per_deal || 0);
        acc[agentName].execution_count += 1;
        if (cost.degradation_triggered) {
          acc[agentName].degradation_triggered = true;
        }
        return acc;
      }, {} as Record<string, any>) || {};

      // Merge data
      const mergedAgents = switchesData?.map(agent => ({
        ...agent,
        ...costByAgent[agent.agent_name]
      })) || [];

      setAgents(mergedAgents);
    } catch (error) {
      console.error('Error fetching agents data:', error);
      toast.error('Failed to fetch agents data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const extractAgentFromExecutionId = (executionId: string | null): string => {
    if (!executionId) return 'unknown';
    
    const agentMappings: Record<string, string> = {
      'financial-engine': 'financial-engine',
      'market-intelligence': 'market-intelligence-engine', 
      'team-research': 'team-research-engine',
      'product-ip': 'product-ip-engine',
      'thesis-alignment': 'thesis-alignment-engine',
      'risk-mitigation': 'risk-mitigation-engine',
      'fund-memory': 'enhanced-fund-memory-engine',
      'document-processor': 'document-processor',
      'web-research': 'web-research-engine',
      'reuben-orchestrator': 'reuben-orchestrator'
    };

    for (const [key, value] of Object.entries(agentMappings)) {
      if (executionId.includes(key)) {
        return value;
      }
    }
    
    return executionId.split('-')[0] || 'unknown';
  };

  const toggleAgent = async (agentName: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('ops_control_switches')
        .update({ enabled })
        .eq('agent_name', agentName);

      if (error) throw error;

      setAgents(agents.map(agent => 
        agent.agent_name === agentName ? { ...agent, enabled } : agent
      ));

      toast.success(`${agentName} ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling agent:', error);
      toast.error('Failed to update agent status');
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

      setAgents(agents.map(agent => 
        agent.agent_name === agentName 
          ? { 
              ...agent, 
              circuit_breaker_open: false, 
              failure_count: 0, 
              last_failure_at: null 
            } 
          : agent
      ));

      toast.success(`Circuit breaker reset for ${agentName}`);
    } catch (error) {
      console.error('Error resetting circuit breaker:', error);
      toast.error('Failed to reset circuit breaker');
    }
  };

  const getAgentStatus = (agent: AIAgent) => {
    if (!agent.enabled) return { status: 'disabled', color: 'secondary' };
    if (agent.circuit_breaker_open) return { status: 'circuit_open', color: 'destructive' };
    if (agent.degradation_triggered) return { status: 'degraded', color: 'warning' };
    if (agent.failure_count > 0) return { status: 'warning', color: 'warning' };
    return { status: 'healthy', color: 'default' };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'circuit_open': return <Shield className="h-4 w-4 text-red-500" />;
      case 'disabled': return <Clock className="h-4 w-4 text-gray-500" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const healthyAgents = agents.filter(a => a.enabled && !a.circuit_breaker_open && !a.degradation_triggered).length;
  const totalCost24h = agents.reduce((sum, agent) => sum + (agent.total_cost || 0), 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                AI Agents Health Status
              </CardTitle>
              <CardDescription>
                Real-time monitoring of all {agents.length} AI agents and their operational status
              </CardDescription>
            </div>
            <Button 
              onClick={fetchAgentsData} 
              disabled={refreshing}
              variant="outline" 
              size="sm"
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Overview Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-primary/5 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium">Healthy Agents</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{healthyAgents}</p>
            </div>
            
            <div className="p-4 bg-secondary/5 rounded-lg">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium">Total Agents</span>
              </div>
              <p className="text-2xl font-bold">{agents.length}</p>
            </div>
            
            <div className="p-4 bg-accent/5 rounded-lg">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-yellow-500" />
                <span className="text-sm font-medium">24h Cost</span>
              </div>
              <p className="text-2xl font-bold">${totalCost24h.toFixed(2)}</p>
            </div>
            
            <div className="p-4 bg-muted/5 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <span className="text-sm font-medium">Issues</span>
              </div>
              <p className="text-2xl font-bold text-orange-600">
                {agents.filter(a => a.circuit_breaker_open || a.degradation_triggered || a.failure_count > 0).length}
              </p>
            </div>
          </div>

          {/* Agents Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>24h Cost</TableHead>
                  <TableHead>Executions</TableHead>
                  <TableHead>Failures</TableHead>
                  <TableHead>Controls</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Loading agents...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : agents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No agents found
                    </TableCell>
                  </TableRow>
                ) : (
                  agents.map((agent) => {
                    const { status, color } = getAgentStatus(agent);
                    return (
                      <TableRow key={agent.id}>
                        <TableCell className="font-medium">
                          {agent.agent_name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(status)}
                            <Badge variant={color as any}>
                              {status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono">
                            ${(agent.total_cost || 0).toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {agent.execution_count || 0}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{agent.failure_count}</span>
                            {agent.last_failure_at && (
                              <span className="text-xs text-muted-foreground">
                                ({new Date(agent.last_failure_at).toLocaleDateString()})
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={agent.enabled}
                              onCheckedChange={(enabled) => toggleAgent(agent.agent_name, enabled)}
                            />
                            {agent.circuit_breaker_open && (
                              <Button
                                onClick={() => resetCircuitBreaker(agent.agent_name)}
                                size="sm"
                                variant="outline"
                                className="text-xs"
                              >
                                Reset
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Alerts */}
          {agents.some(a => a.degradation_triggered || a.circuit_breaker_open) && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {agents.filter(a => a.degradation_triggered).length > 0 && (
                  <span>
                    {agents.filter(a => a.degradation_triggered).length} agent(s) in degraded mode. 
                  </span>
                )}
                {agents.filter(a => a.circuit_breaker_open).length > 0 && (
                  <span>
                    {agents.filter(a => a.circuit_breaker_open).length} agent(s) have circuit breakers open.
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}