import { useCallback } from 'react';
import { useAnalysisOnceEnforcement } from './useAnalysisOnceEnforcement';
import { useFundMemoryIsolation } from './useFundMemoryIsolation';
import { useEnhancedAnalysisQueue } from './useEnhancedAnalysisQueue';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function useAnalysisIntegration() {
  const { enforceAnalysisOnce, markFirstAnalysisComplete } = useAnalysisOnceEnforcement();
  const { checkFundMemoryIsolation } = useFundMemoryIsolation();
  const { queueDealAnalysis } = useEnhancedAnalysisQueue();
  const { toast } = useToast();

  const triggerDealAnalysis = useCallback(async (
    dealId: string,
    triggerType: 'initial' | 'document_upload' | 'note_added' | 'thesis_change' | 'manual_trigger',
    fundId?: string
  ) => {
    try {
      // Step 1: Enforce analysis rules
      const enforcement = await enforceAnalysisOnce(dealId, triggerType);
      
      if (!enforcement.success) {
        return { success: false, message: enforcement.message };
      }

      // Step 2: Check fund memory isolation (if fundId provided)
      if (fundId) {
        const isolation = await checkFundMemoryIsolation(fundId);
        if (isolation.isolationScore < 85) {
          console.warn('Fund memory isolation concerns detected:', isolation);
        }
      }

      // Step 3: Queue analysis with appropriate priority
      const priority = triggerType === 'manual_trigger' ? 'high' : 
                      triggerType === 'initial' ? 'normal' : 'low';
      
      const queueResult = await queueDealAnalysis(dealId, {
        priority,
        triggerReason: triggerType,
        immediate: triggerType === 'manual_trigger'
      });

      if (queueResult.success) {
        // Step 4: Mark first analysis complete if this was initial
        if (triggerType === 'initial') {
          await markFirstAnalysisComplete(dealId);
        }

        toast({
          title: "Analysis Triggered",
          description: `Deal analysis ${triggerType === 'manual_trigger' ? 'started immediately' : 'queued successfully'}`,
          variant: "default"
        });

        return { success: true, queueId: queueResult.queueId };
      }

      return { success: false, message: "Failed to queue analysis" };

    } catch (error) {
      console.error('Error triggering deal analysis:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to trigger deal analysis",
        variant: "destructive"
      });
      return { success: false, message: "Analysis trigger failed" };
    }
  }, [enforceAnalysisOnce, markFirstAnalysisComplete, checkFundMemoryIsolation, queueDealAnalysis, toast]);

  const validateThesisScoring = useCallback(async (fundId: string) => {
    try {
      // Check that fund type drives correct rubric
      const { data: fund, error: fundError } = await supabase
        .from('funds')
        .select('fund_type')
        .eq('id', fundId)
        .single();

      if (fundError) throw fundError;

      const { data: strategy, error: strategyError } = await supabase
        .from('investment_strategies')
        .select('enhanced_criteria, fund_type')
        .eq('fund_id', fundId)
        .single();

      if (strategyError) throw strategyError;

      // Verify fund type matches strategy
      const fundTypeMatches = fund.fund_type === strategy.fund_type;
      const hasEnhancedCriteria = strategy.enhanced_criteria && 
        Object.keys(strategy.enhanced_criteria).length > 0;

      return {
        valid: fundTypeMatches && hasEnhancedCriteria,
        fundType: fund.fund_type,
        strategyType: strategy.fund_type,
        hasCriteria: hasEnhancedCriteria
      };

    } catch (error) {
      console.error('Error validating thesis scoring:', error);
      return { valid: false, error: error.message };
    }
  }, []);

  return {
    triggerDealAnalysis,
    validateThesisScoring
  };
}