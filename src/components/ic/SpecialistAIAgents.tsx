import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Target, 
  TrendingDown,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AgentResult {
  agent: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  confidence: number;
  executionTime?: number;
  insights: string[];
  data: any;
  lastRun?: string;
}

interface SpecialistAIAgentsProps {
  dealId: string;
  fundId: string;
  memoId?: string;
  onResultsUpdate?: (results: AgentResult[]) => void;
}

const SPECIALIST_AGENTS = [
  {
    id: 'market-positioning',
    name: 'Market Positioning Analysis',
    icon: TrendingUp,
    description: 'Competitive landscape and market position assessment',
    color: 'text-blue-600'
  },
  {
    id: 'competitive-intelligence',
    name: 'Competitive Intelligence',
    icon: Target,
    description: 'Deep-dive competitor analysis and differentiation',
    color: 'text-purple-600'
  },
  {
    id: 'financial-sensitivity',
    name: 'Financial Sensitivity & Stress Test',
    icon: DollarSign,
    description: 'Financial projections and scenario analysis',
    color: 'text-green-600'
  },
  {
    id: 'team-risk-profile',
    name: 'Founder & Team Risk Profile',
    icon: Users,
    description: 'Leadership assessment and team capability analysis',
    color: 'text-orange-600'
  },
  {
    id: 'exit-scenarios',
    name: 'Exit Scenarios & Comparables',
    icon: TrendingDown,
    description: 'Exit strategy analysis and comparable outcomes',
    color: 'text-red-600'
  }
];

export function SpecialistAIAgents({ dealId, fundId, memoId, onResultsUpdate }: SpecialistAIAgentsProps) {
  const { toast } = useToast();
  const [agentResults, setAgentResults] = useState<AgentResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [lastRunTime, setLastRunTime] = useState<Date | null>(null);

  const runSingleAgent = useCallback(async (agentId: string) => {
    try {
      setAgentResults(prev => prev.map(result => 
        result.agent === agentId 
          ? { ...result, status: 'running' as const }
          : result
      ));

      // Map specialist agents to existing engines instead of creating new ones
      const startTime = Date.now();
      let engineName = '';
      let engineBody = {};
      
      // Map each specialist agent to corresponding existing engine
      switch (agentId) {
        case 'market-positioning':
          engineName = 'market-intelligence-engine';
          engineBody = { 
            dealId, 
            enhancedMode: true, 
            competitiveDepth: 'deep',
            marketSizingAccuracy: 'high'
          };
          break;
        case 'competitive-intelligence':
          engineName = 'market-intelligence-engine';
          engineBody = { 
            dealId, 
            focus: 'competitive_analysis',
            enhancedMode: true
          };
          break;
        case 'financial-sensitivity':
          engineName = 'financial-engine';
          engineBody = { 
            dealId,
            projectionYears: 5,
            sensitivityAnalysis: true,
            riskAdjustedModeling: true
          };
          break;
        case 'team-risk-profile':
          engineName = 'management-assessment-engine';
          engineBody = { 
            dealId,
            deepDive: true,
            leadershipAssessment: true,
            riskProfiling: true
          };
          break;
        case 'exit-scenarios':
          engineName = 'exit-strategy-engine';
          engineBody = { 
            dealId,
            probabilityWeighting: true,
            returnProjections: true,
            comparableAnalysis: true
          };
          break;
        default:
          throw new Error(`Unknown agent ID: ${agentId}`);
      }
      
      const { data, error } = await supabase.functions.invoke(engineName, {
        body: engineBody
      });

      if (error) throw error;

      const executionTime = Date.now() - startTime;
      const result: AgentResult = {
        agent: agentId,
        status: 'completed',
        confidence: data.confidence || 85,
        executionTime,
        insights: data.insights || [],
        data: data.analysis || {},
        lastRun: new Date().toISOString()
      };

      setAgentResults(prev => {
        const updated = prev.map(r => r.agent === agentId ? result : r);
        if (onResultsUpdate) onResultsUpdate(updated);
        return updated;
      });

      return result;
    } catch (error) {
      console.error(`Error running agent ${agentId}:`, error);
      
      const failedResult: AgentResult = {
        agent: agentId,
        status: 'failed',
        confidence: 0,
        insights: [`Failed to execute: ${error.message}`],
        data: {},
        lastRun: new Date().toISOString()
      };

      setAgentResults(prev => prev.map(r => r.agent === agentId ? failedResult : r));
      return failedResult;
    }
  }, [dealId, fundId, memoId, onResultsUpdate]);

  const runAllAgents = useCallback(async () => {
    setIsRunning(true);
    setLastRunTime(new Date());
    
    // Initialize all agents as pending
    const initialResults: AgentResult[] = SPECIALIST_AGENTS.map(agent => ({
      agent: agent.id,
      status: 'pending' as const,
      confidence: 0,
      insights: [],
      data: {}
    }));
    
    setAgentResults(initialResults);

    try {
      // Run agents sequentially to avoid overwhelming the system
      const results = [];
      for (const agent of SPECIALIST_AGENTS) {
        const result = await runSingleAgent(agent.id);
        results.push(result);
        
        // Small delay between agents
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      const successCount = results.filter(r => r.status === 'completed').length;
      
      toast({
        title: "Specialist Analysis Complete",
        description: `${successCount}/${SPECIALIST_AGENTS.length} agents completed successfully`,
        variant: successCount === SPECIALIST_AGENTS.length ? "default" : "destructive"
      });

    } catch (error) {
      console.error('Error running specialist agents:', error);
      toast({
        title: "Analysis Error",
        description: "Failed to complete specialist analysis",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  }, [runSingleAgent, toast]);

  const getAgentResult = (agentId: string) => {
    return agentResults.find(r => r.agent === agentId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'running':
        return 'border-blue-200 bg-blue-50';
      case 'failed':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const overallProgress = agentResults.length > 0 
    ? (agentResults.filter(r => r.status === 'completed').length / agentResults.length) * 100
    : 0;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Specialist IC AI Agents</CardTitle>
            <CardDescription>
              5 specialized agents for comprehensive IC memo enrichment
            </CardDescription>
          </div>
          <Button 
            onClick={runAllAgents}
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Target className="h-4 w-4" />
            )}
            {isRunning ? 'Running Analysis...' : 'Run All Agents'}
          </Button>
        </div>
        
        {agentResults.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Overall Progress</span>
              <span>{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {lastRunTime && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Last analysis run: {lastRunTime.toLocaleString()}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {SPECIALIST_AGENTS.map((agent) => {
            const result = getAgentResult(agent.id);
            const Icon = agent.icon;
            
            return (
              <div
                key={agent.id}
                className={`border rounded-lg p-4 transition-colors ${
                  result ? getStatusColor(result.status) : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full bg-white ${agent.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{agent.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {agent.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {result && (
                      <Badge variant="outline" className="text-xs">
                        {result.confidence}% conf.
                      </Badge>
                    )}
                    {getStatusIcon(result?.status || 'pending')}
                  </div>
                </div>
                
                {result && result.status === 'completed' && result.insights.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <h5 className="text-xs font-medium text-muted-foreground">Key Insights:</h5>
                    {result.insights.slice(0, 2).map((insight, index) => (
                      <p key={index} className="text-xs text-gray-700">• {insight}</p>
                    ))}
                    {result.insights.length > 2 && (
                      <p className="text-xs text-muted-foreground">
                        +{result.insights.length - 2} more insights
                      </p>
                    )}
                  </div>
                )}
                
                {result && result.status === 'failed' && (
                  <div className="mt-3">
                    <p className="text-xs text-red-600">
                      Analysis failed. Please try running the agent again.
                    </p>
                  </div>
                )}
                
                {result && result.executionTime && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Executed in {(result.executionTime / 1000).toFixed(1)}s
                  </div>
                )}
                
                <div className="mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => runSingleAgent(agent.id)}
                    disabled={isRunning || result?.status === 'running'}
                    className="text-xs h-6 px-2"
                  >
                    {result?.status === 'running' ? 'Running...' : 'Run Agent'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}