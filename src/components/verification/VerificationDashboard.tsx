import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  AlertTriangle, 
  Play,
  Loader2,
  Target,
  Shield,
  Eye,
  TestTube,
  Database,
  Settings,
  BarChart3,
  Users,
  FileText,
  Zap
} from 'lucide-react';
import { VerificationChecklist } from './VerificationChecklist';
import { SyntheticDealTester } from './SyntheticDealTester';
import { ThesisSetupValidator } from './ThesisSetupValidator';
import { DealIngestionValidator } from './DealIngestionValidator';

interface VerificationStage {
  id: string;
  title: string;
  status: 'completed' | 'partial' | 'pending' | 'failed';
  component?: React.ComponentType<any>;
}

const verificationStages: VerificationStage[] = [
  {
    id: 'fund-thesis-setup',
    title: 'Fund & Thesis Setup',
    status: 'partial',
    component: ThesisSetupValidator
  },
  {
    id: 'deal-ingestion',
    title: 'Deal Ingestion',
    status: 'partial',
    component: DealIngestionValidator
  },
  {
    id: 'deal-analysis-controls',
    title: 'Deal Analysis Controls',
    status: 'pending'
  },
  {
    id: 'pipeline-management',
    title: 'Pipeline Management',
    status: 'partial'
  },
  {
    id: 'ic-workflow',
    title: 'IC Workflow',
    status: 'partial'
  },
  {
    id: 'fund-memory-protection',
    title: 'Fund Memory Protection',
    status: 'pending'
  },
  {
    id: 'synthetic-testing',
    title: 'Synthetic Deal Testing',
    status: 'pending',
    component: SyntheticDealTester
  }
];

export function VerificationDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stageStatuses, setStageStatuses] = useState<Record<string, string>>({});

  const updateStageStatus = (stageId: string, status: string) => {
    setStageStatuses(prev => ({
      ...prev,
      [stageId]: status
    }));
  };

  const getStageIcon = (stageId: string) => {
    switch (stageId) {
      case 'fund-thesis-setup': return Settings;
      case 'deal-ingestion': return Database;
      case 'deal-analysis-controls': return Target;
      case 'pipeline-management': return BarChart3;
      case 'ic-workflow': return Users;
      case 'fund-memory-protection': return Eye;
      case 'synthetic-testing': return TestTube;
      default: return Shield;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'partial': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pending': return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const partialStages = verificationStages.filter(s => s.status === 'partial');
  const pendingStages = verificationStages.filter(s => s.status === 'pending');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Verification Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Complete verification tests for partial and pending stages
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="partial">Partial ({partialStages.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingStages.length})</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <VerificationChecklist />
        </TabsContent>

        <TabsContent value="partial" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Partial Implementation Stages</h2>
            <p className="text-muted-foreground mb-6">
              These stages have basic functionality but need additional validation and testing.
            </p>
          </div>
          
          <div className="grid gap-6">
            {partialStages.map((stage) => {
              const Icon = getStageIcon(stage.id);
              const Component = stage.component;
              
              return (
                <Card key={stage.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      {stage.title}
                      <Badge variant="outline" className={getStatusColor(stage.status)}>
                        {stage.status}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {Component ? (
                      <Component 
                        onComplete={() => updateStageStatus(stage.id, 'completed')}
                      />
                    ) : (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Validation component for {stage.title} is under development.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Pending Implementation Stages</h2>
            <p className="text-muted-foreground mb-6">
              These stages need to be implemented and validated before go-live.
            </p>
          </div>
          
          <div className="grid gap-6">
            {pendingStages.map((stage) => {
              const Icon = getStageIcon(stage.id);
              
              return (
                <Card key={stage.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      {stage.title}
                      <Badge variant="outline" className={getStatusColor(stage.status)}>
                        {stage.status}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Alert>
                      <Target className="h-4 w-4" />
                      <AlertDescription>
                        {stage.id === 'deal-analysis-controls' && 
                          'Implement once-per-deal analysis enforcement and queue management controls.'
                        }
                        {stage.id === 'fund-memory-protection' && 
                          'Implement fund memory isolation and cross-contamination prevention.'
                        }
                        {stage.id === 'synthetic-testing' && 
                          'Comprehensive end-to-end testing with synthetic data scenarios.'
                        }
                      </AlertDescription>
                    </Alert>
                    
                    <Button variant="outline" className="mt-4" disabled>
                      <Play className="h-4 w-4 mr-2" />
                      Implementation Required
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <SyntheticDealTester />
        </TabsContent>
      </Tabs>
    </div>
  );
}