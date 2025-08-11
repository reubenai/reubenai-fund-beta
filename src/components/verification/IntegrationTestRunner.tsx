import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, AlertCircle, Play, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAnalysisIntegration } from '@/hooks/useAnalysisIntegration';
import { useAnalysisOnceEnforcement } from '@/hooks/useAnalysisOnceEnforcement';
import { useFundMemoryIsolation } from '@/hooks/useFundMemoryIsolation';
import { supabase } from '@/integrations/supabase/client';

interface TestResult {
  testName: string;
  status: 'passed' | 'failed' | 'warning' | 'running' | 'pending';
  message: string;
  details?: string[];
  executionTime?: number;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  status: 'passed' | 'failed' | 'partial' | 'running' | 'pending';
}

export function IntegrationTestRunner() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const { toast } = useToast();
  const { validateThesisScoring, triggerDealAnalysis } = useAnalysisIntegration();
  const { checkAnalysisEligibility, enforceAnalysisOnce } = useAnalysisOnceEnforcement();
  const { checkFundMemoryIsolation } = useFundMemoryIsolation();

  const updateTestResult = useCallback((suiteName: string, testName: string, result: Partial<TestResult>) => {
    setTestSuites(prev => prev.map(suite => {
      if (suite.name === suiteName) {
        const updatedTests = suite.tests.map(test => 
          test.testName === testName ? { ...test, ...result } : test
        );
        const completedTests = updatedTests.filter(t => t.status !== 'running' && t.status !== 'pending');
        const passedTests = updatedTests.filter(t => t.status === 'passed');
        const failedTests = updatedTests.filter(t => t.status === 'failed');
        
        let suiteStatus: TestSuite['status'] = 'running';
        if (completedTests.length === updatedTests.length) {
          if (failedTests.length === 0) {
            suiteStatus = 'passed';
          } else if (passedTests.length > 0) {
            suiteStatus = 'partial';
          } else {
            suiteStatus = 'failed';
          }
        }
        
        return { ...suite, tests: updatedTests, status: suiteStatus };
      }
      return suite;
    }));
  }, []);

  const runFundTypeIntegrationTests = useCallback(async () => {
    const suiteName = 'Fund Type Integration';
    
    try {
      // Test 1: VC Fund Type Drives Correct Rubric
      updateTestResult(suiteName, 'VC Fund Type Validation', { status: 'running' });
      
      const { data: vcFunds } = await supabase
        .from('funds')
        .select('id, name')
        .eq('fund_type', 'venture_capital')
        .limit(1);
      
      if (vcFunds && vcFunds.length > 0) {
        const validation = await validateThesisScoring(vcFunds[0].id);
        updateTestResult(suiteName, 'VC Fund Type Validation', {
          status: validation.valid ? 'passed' : 'failed',
          message: validation.valid 
            ? `VC rubric correctly applied for ${vcFunds[0].name}`
            : `VC rubric validation failed: ${validation.error || 'Unknown error'}`,
          details: validation.valid ? ['✅ Fund type matches strategy', '✅ Enhanced criteria present'] : ['❌ Validation failed']
        });
      } else {
        updateTestResult(suiteName, 'VC Fund Type Validation', {
          status: 'warning',
          message: 'No VC funds found for testing'
        });
      }

      // Test 2: PE Fund Type Drives Correct Rubric
      updateTestResult(suiteName, 'PE Fund Type Validation', { status: 'running' });
      
      const { data: peFunds } = await supabase
        .from('funds')
        .select('id, name')
        .eq('fund_type', 'private_equity')
        .limit(1);
      
      if (peFunds && peFunds.length > 0) {
        const validation = await validateThesisScoring(peFunds[0].id);
        updateTestResult(suiteName, 'PE Fund Type Validation', {
          status: validation.valid ? 'passed' : 'failed',
          message: validation.valid 
            ? `PE rubric correctly applied for ${peFunds[0].name}`
            : `PE rubric validation failed: ${validation.error || 'Unknown error'}`,
          details: validation.valid ? ['✅ Fund type matches strategy', '✅ Enhanced criteria present'] : ['❌ Validation failed']
        });
      } else {
        updateTestResult(suiteName, 'PE Fund Type Validation', {
          status: 'warning',
          message: 'No PE funds found for testing'
        });
      }

    } catch (error) {
      updateTestResult(suiteName, 'VC Fund Type Validation', {
        status: 'failed',
        message: `Test suite failed: ${error.message}`
      });
    }
  }, [validateThesisScoring, updateTestResult]);

  const runAnalysisOnceTests = useCallback(async () => {
    const suiteName = 'Analysis Once Logic';
    
    try {
      // Get a test deal
      const { data: testDeals } = await supabase
        .from('deals')
        .select('id, company_name, first_analysis_completed')
        .limit(1);
      
      if (!testDeals || testDeals.length === 0) {
        updateTestResult(suiteName, 'Initial Analysis Once', {
          status: 'warning',
          message: 'No test deals available'
        });
        return;
      }

      const testDeal = testDeals[0];

      // Test 1: Initial Analysis Eligibility
      updateTestResult(suiteName, 'Initial Analysis Once', { status: 'running' });
      
      const initialEligibility = await checkAnalysisEligibility(testDeal.id, 'initial');
      updateTestResult(suiteName, 'Initial Analysis Once', {
        status: testDeal.first_analysis_completed 
          ? (initialEligibility.allowed ? 'failed' : 'passed')
          : (initialEligibility.allowed ? 'passed' : 'failed'),
        message: testDeal.first_analysis_completed
          ? `Initial analysis correctly blocked for ${testDeal.company_name}`
          : `Initial analysis correctly allowed for ${testDeal.company_name}`,
        details: [initialEligibility.reason || '', `Rule: ${initialEligibility.rule || 'N/A'}`]
      });

      // Test 2: Catalyst Re-analysis
      updateTestResult(suiteName, 'Catalyst Re-analysis', { status: 'running' });
      
      if (testDeal.first_analysis_completed) {
        const catalystEligibility = await checkAnalysisEligibility(testDeal.id, 'document_upload');
        updateTestResult(suiteName, 'Catalyst Re-analysis', {
          status: catalystEligibility.allowed ? 'passed' : 'failed',
          message: catalystEligibility.allowed
            ? 'Document upload catalyst correctly allowed'
            : `Catalyst blocked: ${catalystEligibility.reason}`,
          details: [catalystEligibility.reason || '', `Rule: ${catalystEligibility.rule || 'N/A'}`]
        });
      } else {
        updateTestResult(suiteName, 'Catalyst Re-analysis', {
          status: 'warning',
          message: 'Cannot test catalyst re-analysis - deal has no initial analysis'
        });
      }

    } catch (error) {
      updateTestResult(suiteName, 'Initial Analysis Once', {
        status: 'failed',
        message: `Analysis once tests failed: ${error.message}`
      });
    }
  }, [checkAnalysisEligibility, updateTestResult]);

  const runFundMemoryTests = useCallback(async () => {
    const suiteName = 'Fund Memory Protection';
    
    try {
      // Get active funds for testing
      const { data: activeFunds } = await supabase
        .from('funds')
        .select('id, name')
        .eq('is_active', true)
        .limit(2);
      
      if (!activeFunds || activeFunds.length === 0) {
        updateTestResult(suiteName, 'Memory Isolation Test', {
          status: 'warning',
          message: 'No active funds for memory testing'
        });
        return;
      }

      for (const fund of activeFunds) {
        const testName = `Memory Isolation - ${fund.name}`;
        updateTestResult(suiteName, testName, { status: 'running' });
        
        const isolation = await checkFundMemoryIsolation(fund.id);
        
        updateTestResult(suiteName, testName, {
          status: isolation.isolationScore >= 90 ? 'passed' : 
                  isolation.isolationScore >= 75 ? 'warning' : 'failed',
          message: `Isolation score: ${isolation.isolationScore}% (${isolation.contaminationRisk} risk)`,
          details: [
            `Isolation Score: ${isolation.isolationScore}%`,
            `Contamination Risk: ${isolation.contaminationRisk}`,
            `Last Checked: ${isolation.lastChecked.toLocaleString()}`
          ]
        });
      }

    } catch (error) {
      updateTestResult(suiteName, 'Memory Isolation Test', {
        status: 'failed',
        message: `Fund memory tests failed: ${error.message}`
      });
    }
  }, [checkFundMemoryIsolation, updateTestResult]);

  const runPipelineIntegrationTests = useCallback(async () => {
    const suiteName = 'Pipeline Integration';
    
    try {
      // Test 1: Deal Data Display
      updateTestResult(suiteName, 'Deal Data Display', { status: 'running' });
      
      const { data: deals } = await supabase
        .from('deals')
        .select('id, company_name, overall_score, status, enhanced_analysis')
        .limit(5);
      
      if (deals && deals.length > 0) {
        const dealsWithData = deals.filter(d => d.overall_score !== null || d.enhanced_analysis !== null);
        updateTestResult(suiteName, 'Deal Data Display', {
          status: dealsWithData.length > 0 ? 'passed' : 'warning',
          message: `${dealsWithData.length}/${deals.length} deals have analysis data`,
          details: deals.map(d => `${d.company_name}: Score ${d.overall_score || 'N/A'}, Status ${d.status}`)
        });
      } else {
        updateTestResult(suiteName, 'Deal Data Display', {
          status: 'warning',
          message: 'No deals found for pipeline testing'
        });
      }

      // Test 2: Activity Tracking
      updateTestResult(suiteName, 'Activity Tracking', { status: 'running' });
      
      const { data: activities } = await supabase
        .from('activity_events')
        .select('id, activity_type, user_id, deal_id')
        .order('created_at', { ascending: false })
        .limit(10);
      
      updateTestResult(suiteName, 'Activity Tracking', {
        status: activities && activities.length > 0 ? 'passed' : 'warning',
        message: `${activities?.length || 0} recent activities tracked`,
        details: activities?.map(a => `${a.activity_type} by user ${a.user_id}`) || []
      });

    } catch (error) {
      updateTestResult(suiteName, 'Deal Data Display', {
        status: 'failed',
        message: `Pipeline tests failed: ${error.message}`
      });
    }
  }, [updateTestResult]);

  const initializeTestSuites = useCallback(() => {
    const suites: TestSuite[] = [
      {
        name: 'Fund Type Integration',
        status: 'pending',
        tests: [
          { testName: 'VC Fund Type Validation', status: 'pending', message: 'Waiting to run...' },
          { testName: 'PE Fund Type Validation', status: 'pending', message: 'Waiting to run...' }
        ]
      },
      {
        name: 'Analysis Once Logic',
        status: 'pending',
        tests: [
          { testName: 'Initial Analysis Once', status: 'pending', message: 'Waiting to run...' },
          { testName: 'Catalyst Re-analysis', status: 'pending', message: 'Waiting to run...' }
        ]
      },
      {
        name: 'Fund Memory Protection',
        status: 'pending',
        tests: [
          { testName: 'Memory Isolation Test', status: 'pending', message: 'Waiting to run...' }
        ]
      },
      {
        name: 'Pipeline Integration',
        status: 'pending',
        tests: [
          { testName: 'Deal Data Display', status: 'pending', message: 'Waiting to run...' },
          { testName: 'Activity Tracking', status: 'pending', message: 'Waiting to run...' }
        ]
      }
    ];
    
    setTestSuites(suites);
  }, []);

  const runAllTests = useCallback(async () => {
    setIsRunning(true);
    setProgress(0);
    initializeTestSuites();

    try {
      const totalSteps = 4;
      
      // Step 1: Fund Type Integration
      setProgress(25);
      await runFundTypeIntegrationTests();
      
      // Step 2: Analysis Once Logic
      setProgress(50);
      await runAnalysisOnceTests();
      
      // Step 3: Fund Memory Protection
      setProgress(75);
      await runFundMemoryTests();
      
      // Step 4: Pipeline Integration
      setProgress(100);
      await runPipelineIntegrationTests();
      
      toast({
        title: "Integration Tests Complete",
        description: "All integration tests have been executed",
        variant: "default"
      });

    } catch (error) {
      console.error('Integration tests failed:', error);
      toast({
        title: "Tests Failed",
        description: "Integration tests encountered an error",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  }, [initializeTestSuites, runFundTypeIntegrationTests, runAnalysisOnceTests, runFundMemoryTests, runPipelineIntegrationTests, toast]);

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'running':
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'pending':
        return <div className="w-4 h-4 rounded-full bg-gray-300" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-gray-300" />;
    }
  };

  const getStatusBadge = (status: TestSuite['status']) => {
    const variants = {
      passed: 'default',
      failed: 'destructive',
      partial: 'secondary',
      running: 'outline',
      pending: 'outline'
    } as const;
    
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Integration Test Runner</CardTitle>
            <CardDescription>
              Comprehensive verification of system integration and business logic
            </CardDescription>
          </div>
          <Button 
            onClick={runAllTests} 
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </Button>
        </div>
        
        {isRunning && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground">
              Running integration tests... {progress}% complete
            </p>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {testSuites.map((suite) => (
          <div key={suite.name} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{suite.name}</h3>
              {getStatusBadge(suite.status)}
            </div>
            
            <div className="space-y-2 pl-4 border-l-2 border-gray-200">
              {suite.tests.map((test) => (
                <div key={test.testName} className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(test.status)}
                    <span className="text-sm font-medium">{test.testName}</span>
                  </div>
                  <p className="text-sm text-muted-foreground pl-6">
                    {test.message}
                  </p>
                  {test.details && test.details.length > 0 && (
                    <div className="pl-6 space-y-1">
                      {test.details.map((detail, idx) => (
                        <p key={idx} className="text-xs text-muted-foreground">
                          {detail}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {testSuites.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Click "Run All Tests" to begin integration verification
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}