import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  Circle, 
  AlertTriangle, 
  Play, 
  Clock,
  Shield,
  Users,
  Database,
  Settings,
  BarChart3,
  FileText,
  Eye,
  Target,
  Zap,
  TestTube
} from 'lucide-react';

interface VerificationStage {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'partial' | 'pending' | 'failed';
  priority: 'critical' | 'high' | 'medium';
  icon: React.ComponentType<any>;
  testSuite?: string[];
  dependencies?: string[];
}

const verificationStages: VerificationStage[] = [
  {
    id: 'auth-role-enforcement',
    title: 'Authentication & Role Enforcement',
    description: 'RLS policies, JWT validation, role-based access controls',
    status: 'completed',
    priority: 'critical',
    icon: Shield,
    testSuite: ['JWT validation', 'RLS policies', 'Role permissions'],
    dependencies: []
  },
  {
    id: 'fund-thesis-setup',
    title: 'Fund & Thesis Setup',
    description: 'Fund creation, thesis configuration, scoring criteria',
    status: 'partial',
    priority: 'critical',
    icon: Settings,
    testSuite: ['Fund creation flow', 'Thesis drives scoring', 'Criteria validation'],
    dependencies: ['auth-role-enforcement']
  },
  {
    id: 'deal-ingestion',
    title: 'Deal Ingestion',
    description: 'Manual/batch upload, data validation, processing pipeline',
    status: 'partial',
    priority: 'high',
    icon: Database,
    testSuite: ['Batch upload', 'Data validation', 'Processing pipeline'],
    dependencies: ['fund-thesis-setup']
  },
  {
    id: 'deal-analysis-controls',
    title: 'Deal Analysis Controls',
    description: 'Once-per-deal enforcement, analysis queue management',
    status: 'pending',
    priority: 'critical',
    icon: Target,
    testSuite: ['Analysis once enforcement', 'Queue management', 'Resource limits'],
    dependencies: ['deal-ingestion']
  },
  {
    id: 'pipeline-management',
    title: 'Pipeline Management',
    description: 'Deal cards, filtering, stage management, RAG status',
    status: 'partial',
    priority: 'high',
    icon: BarChart3,
    testSuite: ['Deal filtering', 'Stage transitions', 'RAG status display'],
    dependencies: ['deal-analysis-controls']
  },
  {
    id: 'ic-workflow',
    title: 'IC Workflow',
    description: 'Memo generation, approval flow, voting system',
    status: 'partial',
    priority: 'high',
    icon: Users,
    testSuite: ['Memo generation', 'Approval workflow', 'Voting mechanics'],
    dependencies: ['pipeline-management']
  },
  {
    id: 'fund-memory-protection',
    title: 'Fund Memory Protection',
    description: 'Memory isolation, context storage, cross-contamination prevention',
    status: 'pending',
    priority: 'critical',
    icon: Eye,
    testSuite: ['Memory isolation', 'Context storage', 'Contamination prevention'],
    dependencies: ['ic-workflow']
  },
  {
    id: 'ic-page-ux',
    title: 'IC Page UX Redesign',
    description: 'Modern interface, responsive design, workflow integration',
    status: 'completed',
    priority: 'medium',
    icon: FileText,
    testSuite: ['Responsive design', 'Workflow integration', 'User experience'],
    dependencies: ['fund-memory-protection']
  },
  {
    id: 'load-cost-guardrails',
    title: 'Load & Cost Guardrails',
    description: 'Rate limiting, cost monitoring, degradation modes',
    status: 'completed',
    priority: 'high',
    icon: Zap,
    testSuite: ['Rate limiting', 'Cost monitoring', 'Graceful degradation'],
    dependencies: ['ic-page-ux']
  },
  {
    id: 'synthetic-testing',
    title: 'Synthetic Deal Testing',
    description: 'End-to-end testing with synthetic data, edge case validation',
    status: 'pending',
    priority: 'high',
    icon: TestTube,
    testSuite: ['E2E testing', 'Edge cases', 'Performance validation'],
    dependencies: ['load-cost-guardrails']
  }
];

export function VerificationChecklist() {
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [runningTests, setRunningTests] = useState<string | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'partial':
        return <Circle className="h-5 w-5 text-yellow-500 fill-yellow-100" />;
      case 'failed':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'bg-green-100 text-green-800 border-green-200',
      partial: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      pending: 'bg-gray-100 text-gray-600 border-gray-200',
      failed: 'bg-red-100 text-red-800 border-red-200'
    };
    return variants[status as keyof typeof variants] || variants.pending;
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      critical: 'bg-red-50 text-red-700 border-red-200',
      high: 'bg-orange-50 text-orange-700 border-orange-200',
      medium: 'bg-blue-50 text-blue-700 border-blue-200'
    };
    return variants[priority as keyof typeof variants] || variants.medium;
  };

  const runStageTests = async (stageId: string) => {
    setRunningTests(stageId);
    
    // Simulate test execution
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setRunningTests(null);
    
    // Update stage status based on test results
    // This would integrate with actual test runners
  };

  const completedStages = verificationStages.filter(s => s.status === 'completed').length;
  const totalStages = verificationStages.length;
  const completionPercentage = (completedStages / totalStages) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Verification Checklist</h2>
          <p className="text-muted-foreground">
            Production readiness verification for the ReubenAI platform
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-foreground">
            {completedStages}/{totalStages}
          </div>
          <p className="text-sm text-muted-foreground">Stages Complete</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Overall Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Completion Progress</span>
              <span>{Math.round(completionPercentage)}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {verificationStages.map((stage, index) => {
          const Icon = stage.icon;
          const isExpanded = expandedStage === stage.id;
          const isRunning = runningTests === stage.id;
          
          return (
            <Card key={stage.id} className="transition-all duration-200">
              <CardHeader 
                className="cursor-pointer"
                onClick={() => setExpandedStage(isExpanded ? null : stage.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-muted-foreground">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {getStatusIcon(stage.status)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="h-4 w-4 text-primary" />
                      <CardTitle className="text-base">{stage.title}</CardTitle>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {stage.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getPriorityBadge(stage.priority)}>
                      {stage.priority}
                    </Badge>
                    <Badge variant="outline" className={getStatusBadge(stage.status)}>
                      {stage.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              {isExpanded && (
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {stage.dependencies && stage.dependencies.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Dependencies</h4>
                        <div className="flex flex-wrap gap-2">
                          {stage.dependencies.map(dep => {
                            const depStage = verificationStages.find(s => s.id === dep);
                            return (
                              <Badge key={dep} variant="outline" className="text-xs">
                                {depStage?.title || dep}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {stage.testSuite && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Test Suite</h4>
                        <div className="space-y-2">
                          {stage.testSuite.map((test, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                              {test}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => runStageTests(stage.id)}
                        disabled={isRunning}
                        className="flex items-center gap-2"
                      >
                        {isRunning ? (
                          <>
                            <Clock className="h-4 w-4 animate-spin" />
                            Running Tests...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4" />
                            Run Tests
                          </>
                        )}
                      </Button>
                      
                      {stage.status === 'partial' && (
                        <Button variant="outline" size="sm">
                          View Issues
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-medium text-foreground mb-1">Ready for Go-Live Assessment</h3>
              <p className="text-sm text-muted-foreground">
                Once all verification stages are completed, the platform will be ready for production deployment.
                Critical stages must pass before proceeding to high-priority stages.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}