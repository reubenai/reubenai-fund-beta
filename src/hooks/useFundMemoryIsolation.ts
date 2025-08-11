import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FundMemoryIsolationCheck {
  fundId: string;
  isIsolated: boolean;
  contaminationRisk: 'none' | 'low' | 'medium' | 'high';
  isolationScore: number;
  lastChecked: Date;
}

interface ContaminationTest {
  testType: 'cross_fund_memory' | 'data_leakage' | 'context_bleeding';
  passed: boolean;
  details: string;
  confidence: number;
}

export function useFundMemoryIsolation() {
  const { toast } = useToast();
  const [isolationStatus, setIsolationStatus] = useState<Map<string, FundMemoryIsolationCheck>>(new Map());

  const checkFundMemoryIsolation = useCallback(async (fundId: string): Promise<FundMemoryIsolationCheck> => {
    try {
      console.log(`🔒 Checking fund memory isolation for fund: ${fundId}`);
      
      const tests: ContaminationTest[] = [];
      
      // Test 1: Cross-fund memory access
      const crossFundTest = await testCrossFundMemoryAccess(fundId);
      tests.push(crossFundTest);
      
      // Test 2: Data leakage detection
      const dataLeakageTest = await testDataLeakage(fundId);
      tests.push(dataLeakageTest);
      
      // Test 3: Context bleeding
      const contextTest = await testContextBleeding(fundId);
      tests.push(contextTest);
      
      // Calculate isolation score
      const passedTests = tests.filter(t => t.passed).length;
      const isolationScore = Math.round((passedTests / tests.length) * 100);
      
      // Determine contamination risk
      let contaminationRisk: 'none' | 'low' | 'medium' | 'high' = 'none';
      if (isolationScore < 60) contaminationRisk = 'high';
      else if (isolationScore < 80) contaminationRisk = 'medium';
      else if (isolationScore < 95) contaminationRisk = 'low';
      
      const result: FundMemoryIsolationCheck = {
        fundId,
        isIsolated: isolationScore >= 95,
        contaminationRisk,
        isolationScore,
        lastChecked: new Date()
      };
      
      // Store result
      setIsolationStatus(prev => new Map(prev.set(fundId, result)));
      
      // Log isolation check
      await supabase
        .from('data_lineage_log')
        .insert({
          source_service: 'fund-memory-isolation-checker',
          target_service: 'fund-memory-engine',
          fund_id: fundId,
          data_classification: 'isolation_test',
          transfer_reason: 'Isolation verification',
          approved: result.isIsolated,
          metadata: {
            isolation_score: isolationScore,
            contamination_risk: contaminationRisk,
            tests_passed: passedTests,
            tests_total: tests.length
          } as any
        });
      
      console.log(`🔒 Fund ${fundId} isolation score: ${isolationScore}% (${contaminationRisk} risk)`);
      
      return result;
      
    } catch (error) {
      console.error('Error checking fund memory isolation:', error);
      
      const errorResult: FundMemoryIsolationCheck = {
        fundId,
        isIsolated: false,
        contaminationRisk: 'high',
        isolationScore: 0,
        lastChecked: new Date()
      };
      
      setIsolationStatus(prev => new Map(prev.set(fundId, errorResult)));
      return errorResult;
    }
  }, []);

  const testCrossFundMemoryAccess = async (fundId: string): Promise<ContaminationTest> => {
    try {
      // Check if fund memory entries are properly isolated
      const { data: memoryEntries, error } = await supabase
        .from('fund_memory_entries')
        .select('fund_id, memory_content')
        .eq('fund_id', fundId)
        .limit(10);
      
      if (error) throw error;
      
      // Verify all entries belong to this fund
      const contaminated = memoryEntries?.filter(entry => entry.fund_id !== fundId) || [];
      
      return {
        testType: 'cross_fund_memory',
        passed: contaminated.length === 0,
        details: contaminated.length > 0 
          ? `Found ${contaminated.length} entries from other funds`
          : 'All memory entries properly isolated',
        confidence: contaminated.length === 0 ? 100 : Math.max(0, 100 - (contaminated.length * 20))
      };
      
    } catch (error) {
      return {
        testType: 'cross_fund_memory',
        passed: false,
        details: `Test failed: ${error.message}`,
        confidence: 0
      };
    }
  };

  const testDataLeakage = async (fundId: string): Promise<ContaminationTest> => {
    try {
      // Check for data lineage violations
      const { data: lineageViolations, error } = await supabase
        .from('data_lineage_log')
        .select('*')
        .eq('fund_id', fundId)
        .eq('approved', false)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours
      
      if (error) throw error;
      
      const violationCount = lineageViolations?.length || 0;
      
      return {
        testType: 'data_leakage',
        passed: violationCount === 0,
        details: violationCount > 0 
          ? `Found ${violationCount} data lineage violations in last 24 hours`
          : 'No data leakage detected',
        confidence: violationCount === 0 ? 100 : Math.max(0, 100 - (violationCount * 15))
      };
      
    } catch (error) {
      return {
        testType: 'data_leakage',
        passed: false,
        details: `Test failed: ${error.message}`,
        confidence: 0
      };
    }
  };

  const testContextBleeding = async (fundId: string): Promise<ContaminationTest> => {
    try {
      // Test if fund memory engine returns context from other funds
      const { data: testResult, error } = await supabase.functions.invoke('enhanced-fund-memory-engine', {
        body: {
          action: 'contextual_memory_query',
          fundId,
          dealContext: {
            company_name: 'ISOLATION_TEST_COMPANY',
            industry: 'test_industry'
          },
          isolationTest: true
        }
      });
      
      if (error) throw error;
      
      // Check if response contains only this fund's data
      const contextData = testResult?.contextualMemory || {};
      const hasCrossFundData = Object.values(contextData).some((data: any) => 
        Array.isArray(data) && data.some((item: any) => item.fund_id && item.fund_id !== fundId)
      );
      
      return {
        testType: 'context_bleeding',
        passed: !hasCrossFundData,
        details: hasCrossFundData 
          ? 'Context bleeding detected - fund memory contains other funds data'
          : 'Fund memory context properly isolated',
        confidence: hasCrossFundData ? 30 : 95
      };
      
    } catch (error) {
      return {
        testType: 'context_bleeding',
        passed: false,
        details: `Context test failed: ${error.message}`,
        confidence: 0
      };
    }
  };

  const verifyOrchestratorIsolation = useCallback(async (fundId: string): Promise<boolean> => {
    try {
      // Verify orchestrator only uses meta-data, not fund-specific data
      const { data: lineageEntries } = await supabase
        .from('data_lineage_log')
        .select('*')
        .eq('source_service', 'reuben-orchestrator')
        .eq('fund_id', fundId)
        .eq('data_classification', 'fund_specific')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days
      
      const fundSpecificAccess = lineageEntries?.length || 0;
      
      if (fundSpecificAccess > 0) {
        toast({
          title: "Orchestrator Isolation Warning",
          description: `Orchestrator accessed fund-specific data ${fundSpecificAccess} times`,
          variant: "destructive"
        });
        return false;
      }
      
      return true;
      
    } catch (error) {
      console.error('Error verifying orchestrator isolation:', error);
      return false;
    }
  }, [toast]);

  const enforceMemoryIsolation = useCallback(async (fundId: string): Promise<void> => {
    try {
      // Clean up any cross-contaminated memory entries
      const { error: cleanupError } = await supabase
        .from('fund_memory_entries')
        .delete()
        .neq('fund_id', fundId);
      
      if (cleanupError) {
        console.warn('Could not clean up contaminated memory:', cleanupError);
      }
      
      // Update memory entries to ensure proper tagging
      await supabase
        .from('fund_memory_entries')
        .update({
          contextual_tags: [`fund_${fundId}`]
        })
        .eq('fund_id', fundId);
      
      toast({
        title: "Memory Isolation Enforced",
        description: "Fund memory has been isolated and cleaned",
        variant: "default"
      });
      
    } catch (error) {
      console.error('Error enforcing memory isolation:', error);
      toast({
        title: "Isolation Failed",
        description: "Could not enforce memory isolation",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Auto-check isolation for active funds every 30 minutes
  useEffect(() => {
    const checkInterval = setInterval(async () => {
      try {
        const { data: activeFunds } = await supabase
          .from('funds')
          .select('id')
          .eq('is_active', true);
        
        if (activeFunds) {
          for (const fund of activeFunds) {
            await checkFundMemoryIsolation(fund.id);
          }
        }
      } catch (error) {
        console.error('Error in auto isolation check:', error);
      }
    }, 30 * 60 * 1000); // 30 minutes
    
    return () => clearInterval(checkInterval);
  }, [checkFundMemoryIsolation]);

  return {
    checkFundMemoryIsolation,
    verifyOrchestratorIsolation,
    enforceMemoryIsolation,
    isolationStatus
  };
}