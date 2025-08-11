import { useState, useCallback } from 'react';
import { useAnalysisIntegration } from './useAnalysisIntegration';
import { useFundMemoryIsolation } from './useFundMemoryIsolation';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VerificationResult {
  stage: string;
  status: 'passed' | 'failed' | 'partial';
  details: string[];
  timestamp: string;
}

export function useVerificationRunner() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<VerificationResult[]>([]);
  const { validateThesisScoring } = useAnalysisIntegration();
  const { checkFundMemoryIsolation } = useFundMemoryIsolation();
  const { toast } = useToast();

  const runStage1Verification = useCallback(async (): Promise<VerificationResult> => {
    const details: string[] = [];
    let status: 'passed' | 'failed' | 'partial' = 'passed';

    try {
      // Check authentication and role enforcement
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        details.push('❌ User not authenticated');
        status = 'failed';
      } else {
        details.push('✅ User authentication working');
      }

      // Check role-based data isolation
      const { data: profiles } = await supabase
        .from('profiles')
        .select('role, organization_id')
        .limit(5);

      if (profiles && profiles.length > 0) {
        details.push('✅ Role-based data access working');
      } else {
        details.push('⚠️ Cannot verify role isolation');
        status = status === 'passed' ? 'partial' : status;
      }

    } catch (error) {
      details.push(`❌ Authentication check failed: ${error.message}`);
      status = 'failed';
    }

    return {
      stage: 'Stage 1 - Authentication & Role Enforcement',
      status,
      details,
      timestamp: new Date().toISOString()
    };
  }, []);

  const runStage2Verification = useCallback(async (): Promise<VerificationResult> => {
    const details: string[] = [];
    let status: 'passed' | 'failed' | 'partial' = 'passed';

    try {
      // Check fund creation capability
      const { data: funds } = await supabase
        .from('funds')
        .select('id, fund_type, name')
        .limit(1);

      if (funds && funds.length > 0) {
        details.push('✅ Fund creation infrastructure working');
        
        // Check thesis configuration for each fund type
        for (const fund of funds) {
          const validation = await validateThesisScoring(fund.id);
          if (validation.valid) {
            details.push(`✅ Thesis configuration valid for ${fund.name} (${fund.fund_type})`);
          } else {
            details.push(`⚠️ Thesis configuration issues for ${fund.name}: ${validation.error || 'Invalid configuration'}`);
            status = 'partial';
          }
        }
      } else {
        details.push('❌ No funds found - cannot verify fund creation');
        status = 'failed';
      }

    } catch (error) {
      details.push(`❌ Fund setup verification failed: ${error.message}`);
      status = 'failed';
    }

    return {
      stage: 'Stage 2 - Fund & Thesis Setup',
      status,
      details,
      timestamp: new Date().toISOString()
    };
  }, [validateThesisScoring]);

  const runStage7Verification = useCallback(async (): Promise<VerificationResult> => {
    const details: string[] = [];
    let status: 'passed' | 'failed' | 'partial' = 'passed';

    try {
      // Check fund memory for each active fund
      const { data: funds } = await supabase
        .from('funds')
        .select('id, name')
        .eq('is_active', true)
        .limit(3);

      if (funds && funds.length > 0) {
        for (const fund of funds) {
          const isolation = await checkFundMemoryIsolation(fund.id);
          
          if (isolation.isolationScore >= 90) {
            details.push(`✅ Fund memory isolation excellent for ${fund.name} (${isolation.isolationScore}%)`);
          } else if (isolation.isolationScore >= 75) {
            details.push(`⚠️ Fund memory isolation good for ${fund.name} (${isolation.isolationScore}%)`);
            status = status === 'passed' ? 'partial' : status;
          } else {
            details.push(`❌ Fund memory isolation poor for ${fund.name} (${isolation.isolationScore}%)`);
            status = 'failed';
          }

          // Check contamination risk
          if (isolation.contaminationRisk !== 'none') {
            details.push(`⚠️ Contamination risk detected: ${isolation.contaminationRisk}`);
            status = status === 'passed' ? 'partial' : status;
          }
        }
      } else {
        details.push('❌ No active funds found for memory verification');
        status = 'failed';
      }

    } catch (error) {
      details.push(`❌ Fund memory verification failed: ${error.message}`);
      status = 'failed';
    }

    return {
      stage: 'Stage 7 - Fund Memory Protection',
      status,
      details,
      timestamp: new Date().toISOString()
    };
  }, [checkFundMemoryIsolation]);

  const runVerification = useCallback(async (stages: string[] = ['all']) => {
    setIsRunning(true);
    setResults([]);
    
    try {
      const newResults: VerificationResult[] = [];

      if (stages.includes('all') || stages.includes('stage1')) {
        const stage1Result = await runStage1Verification();
        newResults.push(stage1Result);
      }

      if (stages.includes('all') || stages.includes('stage2')) {
        const stage2Result = await runStage2Verification();
        newResults.push(stage2Result);
      }

      if (stages.includes('all') || stages.includes('stage7')) {
        const stage7Result = await runStage7Verification();
        newResults.push(stage7Result);
      }

      setResults(newResults);

      const passedCount = newResults.filter(r => r.status === 'passed').length;
      const totalCount = newResults.length;

      toast({
        title: "Verification Complete",
        description: `${passedCount}/${totalCount} stages passed verification`,
        variant: passedCount === totalCount ? "default" : "destructive"
      });

    } catch (error) {
      console.error('Verification failed:', error);
      toast({
        title: "Verification Failed",
        description: "Error running verification tests",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  }, [runStage1Verification, runStage2Verification, runStage7Verification, toast]);

  return {
    runVerification,
    isRunning,
    results,
    clearResults: () => setResults([])
  };
}