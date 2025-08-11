import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AnalysisOnceRule {
  dealId: string;
  firstAnalysisCompleted: boolean;
  allowedCatalysts: string[];
  blockUntil?: Date;
}

export function useAnalysisOnceEnforcement() {
  const { toast } = useToast();
  const processedDeals = useRef<Set<string>>(new Set());

  const checkAnalysisEligibility = useCallback(async (
    dealId: string,
    triggerType: 'initial' | 'document_upload' | 'note_added' | 'thesis_change' | 'manual_trigger'
  ): Promise<{
    allowed: boolean;
    reason?: string;
    rule?: string;
  }> => {
    try {
      // Get deal's current analysis state
      const { data: deal, error } = await supabase
        .from('deals')
        .select('first_analysis_completed, analysis_blocked_until, auto_analysis_enabled, created_at')
        .eq('id', dealId)
        .single();

      if (error) throw error;

      // Rule 1: Check if analysis is blocked
      if (deal.analysis_blocked_until) {
        const blockUntil = new Date(deal.analysis_blocked_until);
        if (blockUntil > new Date()) {
          return {
            allowed: false,
            reason: `Analysis blocked until ${blockUntil.toLocaleDateString()}`,
            rule: 'BLOCKED_ANALYSIS'
          };
        }
      }

      // Rule 2: Initial analysis - only once per deal
      if (triggerType === 'initial') {
        if (deal.first_analysis_completed) {
          return {
            allowed: false,
            reason: 'Initial analysis already completed',
            rule: 'INITIAL_ONCE_ONLY'
          };
        }
        return { allowed: true, rule: 'INITIAL_ANALYSIS_ALLOWED' };
      }

      // Rule 3: Subsequent analysis only allowed for specific catalysts
      if (!deal.first_analysis_completed) {
        return {
          allowed: false,
          reason: 'Initial analysis must complete first',
          rule: 'AWAIT_INITIAL_ANALYSIS'
        };
      }

      // Rule 4: Check auto-analysis setting
      if (!deal.auto_analysis_enabled && triggerType !== 'manual_trigger') {
        return {
          allowed: false,
          reason: 'Auto-analysis disabled for this deal',
          rule: 'AUTO_ANALYSIS_DISABLED'
        };
      }

      // Rule 5: Catalyst-based re-analysis rules
      const allowedCatalysts = ['document_upload', 'note_added', 'thesis_change', 'manual_trigger'];
      if (!allowedCatalysts.includes(triggerType)) {
        return {
          allowed: false,
          reason: `Trigger type '${triggerType}' not allowed for re-analysis`,
          rule: 'INVALID_CATALYST'
        };
      }

      // Rule 6: Prevent duplicate processing
      const dealKey = `${dealId}-${triggerType}`;
      if (processedDeals.current.has(dealKey)) {
        return {
          allowed: false,
          reason: 'Analysis already in progress for this trigger',
          rule: 'DUPLICATE_PREVENTION'
        };
      }

      // Rule 7: Rate limiting - max 1 analysis per deal per hour (except manual)
      if (triggerType !== 'manual_trigger') {
        const { data: recentAnalysis } = await supabase
          .from('analysis_queue')
          .select('created_at')
          .eq('deal_id', dealId)
          .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(1);

        if (recentAnalysis && recentAnalysis.length > 0) {
          return {
            allowed: false,
            reason: 'Rate limit: Only one analysis per hour allowed',
            rule: 'RATE_LIMIT_EXCEEDED'
          };
        }
      }

      // Mark as processing to prevent duplicates
      processedDeals.current.add(dealKey);
      
      // Clean up after 5 minutes
      setTimeout(() => {
        processedDeals.current.delete(dealKey);
      }, 5 * 60 * 1000);

      return { allowed: true, rule: 'CATALYST_ANALYSIS_ALLOWED' };

    } catch (error) {
      console.error('Error checking analysis eligibility:', error);
      return {
        allowed: false,
        reason: 'Failed to check analysis eligibility',
        rule: 'ERROR_STATE'
      };
    }
  }, []);

  const enforceAnalysisOnce = useCallback(async (
    dealId: string,
    triggerType: 'initial' | 'document_upload' | 'note_added' | 'thesis_change' | 'manual_trigger'
  ): Promise<{ success: boolean; message?: string; rule?: string }> => {
    try {
      const eligibility = await checkAnalysisEligibility(dealId, triggerType);
      
      if (!eligibility.allowed) {
        toast({
          title: "Analysis Not Allowed",
          description: eligibility.reason,
          variant: "destructive"
        });
        
        return {
          success: false,
          message: eligibility.reason,
          rule: eligibility.rule
        };
      }

      // Log the enforcement decision
      await supabase
        .from('deal_analysis_catalysts')
        .insert({
          deal_id: dealId,
          catalyst_type: triggerType,
          triggered_by: (await supabase.auth.getUser()).data.user?.id,
          metadata: {
            enforcement_rule: eligibility.rule,
            allowed: true,
            timestamp: new Date().toISOString()
          }
        });

      return {
        success: true,
        message: 'Analysis approved by enforcement rules',
        rule: eligibility.rule
      };

    } catch (error) {
      console.error('Error enforcing analysis once:', error);
      return {
        success: false,
        message: 'Enforcement check failed',
        rule: 'ERROR_STATE'
      };
    }
  }, [checkAnalysisEligibility, toast]);

  const markFirstAnalysisComplete = useCallback(async (dealId: string): Promise<void> => {
    try {
      await supabase
        .from('deals')
        .update({ 
          first_analysis_completed: true,
          last_analysis_trigger_reason: 'initial_complete'
        })
        .eq('id', dealId);
        
      processedDeals.current.delete(`${dealId}-initial`);
    } catch (error) {
      console.error('Error marking first analysis complete:', error);
    }
  }, []);

  const blockAnalysisTemporarily = useCallback(async (
    dealId: string,
    blockUntil: Date,
    reason: string
  ): Promise<void> => {
    try {
      await supabase
        .from('deals')
        .update({
          analysis_blocked_until: blockUntil.toISOString(),
          last_analysis_trigger_reason: `blocked: ${reason}`
        })
        .eq('id', dealId);

      toast({
        title: "Analysis Blocked",
        description: `Analysis blocked until ${blockUntil.toLocaleDateString()}`,
        variant: "default"
      });
    } catch (error) {
      console.error('Error blocking analysis:', error);
      toast({
        title: "Block Failed",
        description: "Failed to block analysis",
        variant: "destructive"
      });
    }
  }, [toast]);

  return {
    checkAnalysisEligibility,
    enforceAnalysisOnce,
    markFirstAnalysisComplete,
    blockAnalysisTemporarily
  };
}