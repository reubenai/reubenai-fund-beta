import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, AlertTriangle, Play, Beaker, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAnalysisIntegration } from '@/hooks/useAnalysisIntegration';
import { supabase } from '@/integrations/supabase/client';

interface SyntheticDeal {
  company_name: string;
  founder: string;
  industry: string;
  description: string;
  deal_size: number;
  valuation: number;
  location: string;
  website: string;
  fund_type: 'vc' | 'pe';
  priority: 'high' | 'normal' | 'low';
}

interface WorkflowStep {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  message?: string;
  duration?: number;
}

interface TestRun {
  dealId: string;
  companyName: string;
  fundType: 'vc' | 'pe';
  startTime: Date;
  endTime?: Date;
  steps: WorkflowStep[];
  overallStatus: 'running' | 'completed' | 'failed';
}

const SYNTHETIC_DEALS: Record<'vc' | 'pe', SyntheticDeal[]> = {
  vc: [
    {
      company_name: "NeuralFlow AI",
      founder: "Dr. Sarah Chen",
      industry: "Artificial Intelligence",
      description: "Advanced neural network platform for real-time data processing and predictive analytics",
      deal_size: 5000000,
      valuation: 25000000,
      location: "San Francisco, CA",
      website: "https://neuralflow-ai.com",
      fund_type: "vc",
      priority: "high"
    },
    {
      company_name: "GreenTech Solutions",
      founder: "Marcus Rodriguez",
      industry: "CleanTech",
      description: "Solar energy optimization platform using AI to maximize efficiency",
      deal_size: 3000000,
      valuation: 15000000,
      location: "Austin, TX",
      website: "https://greentech-solutions.com",
      fund_type: "vc",
      priority: "normal"
    }
  ],
  pe: [
    {
      company_name: "DataCorp Analytics",
      founder: "Jennifer Park",
      industry: "Business Intelligence",
      description: "Established B2B analytics platform serving enterprise clients",
      deal_size: 25000000,
      valuation: 100000000,
      location: "New York, NY",
      website: "https://datacorp-analytics.com",
      fund_type: "pe",
      priority: "high"
    },
    {
      company_name: "Manufacturing Plus",
      founder: "Robert Kim",
      industry: "Manufacturing",
      description: "Industrial automation and process optimization company",
      deal_size: 15000000,
      valuation: 60000000,
      location: "Detroit, MI",
      website: "https://manufacturing-plus.com",
      fund_type: "pe",
      priority: "normal"
    }
  ]
};

export function SyntheticDealTester() {
  const [selectedFundType, setSelectedFundType] = useState<'vc' | 'pe'>('vc');
  const [selectedFund, setSelectedFund] = useState<string>('');
  const [availableFunds, setAvailableFunds] = useState<any[]>([]);
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const { toast } = useToast();
  const { triggerDealAnalysis } = useAnalysisIntegration();

  React.useEffect(() => {
    loadFunds();
  }, [selectedFundType]);

  const loadFunds = async () => {
    try {
      const fundTypeMap = {
        vc: 'venture_capital',
        pe: 'private_equity'
      };

      const { data: funds } = await supabase
        .from('funds')
        .select('id, name, fund_type')
        .eq('fund_type', fundTypeMap[selectedFundType] as any)
        .eq('is_active', true);

      setAvailableFunds(funds || []);
      if (funds && funds.length > 0) {
        setSelectedFund(funds[0].id);
      }
    } catch (error) {
      console.error('Error loading funds:', error);
      toast({
        title: "Error",
        description: "Failed to load funds",
        variant: "destructive"
      });
    }
  };

  const updateTestRunStep = useCallback((dealId: string, stepName: string, update: Partial<WorkflowStep>) => {
    setTestRuns(prev => prev.map(run => {
      if (run.dealId === dealId) {
        const updatedSteps = run.steps.map(step => 
          step.name === stepName ? { ...step, ...update } : step
        );
        return { ...run, steps: updatedSteps };
      }
      return run;
    }));
  }, []);

  const createSyntheticDeal = async (dealData: SyntheticDeal, fundId: string): Promise<string> => {
    const { data: deal, error } = await supabase
      .from('deals')
      .insert({
        fund_id: fundId,
        company_name: dealData.company_name,
        founder: dealData.founder,
        industry: dealData.industry,
        description: dealData.description,
        deal_size: dealData.deal_size,
        valuation: dealData.valuation,
        location: dealData.location,
        website: dealData.website,
        priority: dealData.priority,
        status: 'sourced',
        source_method: 'synthetic_test',
        created_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select('id')
      .single();

    if (error) throw error;
    return deal.id;
  };

  const runWorkflowStep = async (
    dealId: string,
    stepName: string,
    stepFunction: () => Promise<any>
  ): Promise<any> => {
    const startTime = Date.now();
    
    updateTestRunStep(dealId, stepName, { status: 'running' });
    
    try {
      const result = await stepFunction();
      const duration = Date.now() - startTime;
      
      updateTestRunStep(dealId, stepName, {
        status: 'completed',
        result,
        duration,
        message: 'Completed successfully'
      });
      
      return { result };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      updateTestRunStep(dealId, stepName, {
        status: 'failed',
        duration,
        message: error.message || 'Step failed'
      });
      throw error;
    }
  };

  const runSyntheticTest = async (dealData: SyntheticDeal) => {
    const startTime = new Date();
    let dealId: string;

    const workflowSteps: WorkflowStep[] = [
      { name: 'Deal Creation', status: 'pending' },
      { name: 'Initial Analysis', status: 'pending' },
      { name: 'Pipeline Progression', status: 'pending' },
      { name: 'IC Memo Generation', status: 'pending' },
      { name: 'Activity Verification', status: 'pending' },
      { name: 'Fund Memory Update', status: 'pending' }
    ];

    // Create initial test run entry
    const testRun: TestRun = {
      dealId: '', // Will be updated after creation
      companyName: dealData.company_name,
      fundType: dealData.fund_type,
      startTime,
      steps: workflowSteps,
      overallStatus: 'running'
    };

    setTestRuns(prev => [...prev, testRun]);

    try {
      // Step 1: Create Deal
      const creationResult = await runWorkflowStep('', 'Deal Creation', async () => {
        const id = await createSyntheticDeal(dealData, selectedFund);
        // Update test run with actual deal ID
        setTestRuns(prev => prev.map(run => 
          run.companyName === dealData.company_name && run.dealId === '' 
            ? { ...run, dealId: id }
            : run
        ));
        return { dealId: id };
      });
      
      dealId = creationResult.result?.dealId || '';

      // Step 2: Trigger Initial Analysis
      await runWorkflowStep(dealId, 'Initial Analysis', async () => {
        const result = await triggerDealAnalysis(dealId, 'initial', selectedFund);
        if (!result.success) {
          throw new Error(result.message || 'Analysis trigger failed');
        }
        return result;
      });

      // Wait for analysis to complete (simplified)
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Step 3: Check Pipeline Progression
      await runWorkflowStep(dealId, 'Pipeline Progression', async () => {
        const { data: deal } = await supabase
          .from('deals')
          .select('status, overall_score, enhanced_analysis')
          .eq('id', dealId)
          .single();

        return {
          status: deal?.status,
          score: deal?.overall_score,
          hasAnalysis: !!deal?.enhanced_analysis
        };
      });

      // Step 4: Test IC Memo Generation (if applicable)
      await runWorkflowStep(dealId, 'IC Memo Generation', async () => {
        // Check if deal is ready for IC
        const { data: deal } = await supabase
          .from('deals')
          .select('status, overall_score')
          .eq('id', dealId)
          .single();

        if (deal?.overall_score && deal.overall_score > 70) {
          // Try to generate IC memo
          const { data: memo, error } = await supabase.functions.invoke('ai-memo-generator', {
            body: { dealId }
          });
          
          if (error) throw error;
          return { memoGenerated: true, memoId: memo?.id };
        }
        
        return { memoGenerated: false, reason: 'Deal not ready for IC' };
      });

      // Step 5: Verify Activity Tracking
      await runWorkflowStep(dealId, 'Activity Verification', async () => {
        const { data: activities } = await supabase
          .from('activity_events')
          .select('id, activity_type, created_at')
          .eq('deal_id', dealId)
          .order('created_at', { ascending: false });

        return {
          activityCount: activities?.length || 0,
          activities: activities?.map(a => a.activity_type) || []
        };
      });

      // Step 6: Check Fund Memory Update
      await runWorkflowStep(dealId, 'Fund Memory Update', async () => {
        const { data: memoryEntries } = await supabase
          .from('fund_memory_entries')
          .select('id, memory_type, created_at')
          .eq('fund_id', selectedFund)
          .eq('deal_id', dealId);

        return {
          memoryEntries: memoryEntries?.length || 0,
          types: memoryEntries?.map(m => m.memory_type) || []
        };
      });

      // Mark test run as completed
      setTestRuns(prev => prev.map(run => 
        run.dealId === dealId 
          ? { ...run, overallStatus: 'completed', endTime: new Date() }
          : run
      ));

    } catch (error) {
      console.error('Synthetic test failed:', error);
      
      // Mark test run as failed
      setTestRuns(prev => prev.map(run => 
        run.dealId === dealId || (run.companyName === dealData.company_name && run.dealId === '')
          ? { ...run, overallStatus: 'failed', endTime: new Date() }
          : run
      ));
      
      throw error;
    }
  };

  const runAllSyntheticTests = async () => {
    if (!selectedFund) {
      toast({
        title: "No Fund Selected",
        description: "Please select a fund before running tests",
        variant: "destructive"
      });
      return;
    }

    setIsRunning(true);
    setCurrentProgress(0);
    setTestRuns([]);

    try {
      const dealsToTest = SYNTHETIC_DEALS[selectedFundType];
      
      for (let i = 0; i < dealsToTest.length; i++) {
        setCurrentProgress((i / dealsToTest.length) * 100);
        await runSyntheticTest(dealsToTest[i]);
      }

      setCurrentProgress(100);
      
      toast({
        title: "Synthetic Tests Complete",
        description: `Completed ${dealsToTest.length} end-to-end workflow tests`,
        variant: "default"
      });

    } catch (error) {
      console.error('Synthetic tests failed:', error);
      toast({
        title: "Tests Failed",
        description: "Synthetic deal tests encountered an error",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStepIcon = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'running':
        return <div className="w-4 h-4 rounded-full bg-blue-600 animate-pulse" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-gray-300" />;
    }
  };

  const getRunStatusBadge = (status: TestRun['overallStatus']) => {
    const variants = {
      completed: 'default',
      failed: 'destructive',
      running: 'secondary'
    } as const;
    
    return (
      <Badge variant={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <Card className="w-full max-w-6xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Beaker className="w-5 h-5" />
              Synthetic Deal End-to-End Tester
            </CardTitle>
            <CardDescription>
              Test complete deal workflows with synthetic data to verify system integration
            </CardDescription>
          </div>
          <Button 
            onClick={runAllSyntheticTests} 
            disabled={isRunning || !selectedFund}
            className="flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            {isRunning ? 'Running Tests...' : 'Run End-to-End Tests'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Configuration */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Fund Type</label>
            <Select value={selectedFundType} onValueChange={(value: 'vc' | 'pe') => setSelectedFundType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vc">Venture Capital</SelectItem>
                <SelectItem value="pe">Private Equity</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Target Fund</label>
            <Select value={selectedFund} onValueChange={setSelectedFund}>
              <SelectTrigger>
                <SelectValue placeholder="Select a fund" />
              </SelectTrigger>
              <SelectContent>
                {availableFunds.map(fund => (
                  <SelectItem key={fund.id} value={fund.id}>
                    {fund.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Progress */}
        {isRunning && (
          <div className="space-y-2">
            <Progress value={currentProgress} className="w-full" />
            <p className="text-sm text-muted-foreground">
              Running synthetic deal tests... {Math.round(currentProgress)}% complete
            </p>
          </div>
        )}

        {/* Test Runs */}
        <div className="space-y-4">
          {testRuns.map((run, idx) => (
            <Card key={`${run.companyName}-${idx}`} className="w-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5" />
                    <div>
                      <h4 className="font-semibold">{run.companyName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {run.fundType.toUpperCase()} • Started {run.startTime.toLocaleTimeString()}
                        {run.endTime && ` • Completed in ${Math.round((run.endTime.getTime() - run.startTime.getTime()) / 1000)}s`}
                      </p>
                    </div>
                  </div>
                  {getRunStatusBadge(run.overallStatus)}
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {run.steps.map((step) => (
                    <div key={step.name} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                      {getStepIcon(step.status)}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{step.name}</p>
                        {step.message && (
                          <p className="text-xs text-muted-foreground">{step.message}</p>
                        )}
                        {step.duration && (
                          <p className="text-xs text-muted-foreground">
                            {step.duration}ms
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Synthetic Deal Previews */}
        {!isRunning && testRuns.length === 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Test Scenarios ({selectedFundType.toUpperCase()})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SYNTHETIC_DEALS[selectedFundType].map((deal, idx) => (
                <Card key={idx} className="p-4">
                  <h4 className="font-medium">{deal.company_name}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{deal.industry}</p>
                  <p className="text-xs">{deal.description}</p>
                  <div className="mt-2 flex gap-2">
                    <Badge variant="outline">${(deal.deal_size / 1000000).toFixed(1)}M</Badge>
                    <Badge variant="outline">${(deal.valuation / 1000000).toFixed(1)}M valuation</Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}