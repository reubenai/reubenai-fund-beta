import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OrchestrationRequest {
  workflow_type: 'deal_analysis' | 'ic_memo_generation';
  org_id: string;
  fund_id: string;
  deal_id?: string;
  input_data: any;
  resume_from_step?: string;
}

interface OrchestrationResult {
  success: boolean;
  execution_token?: string;
  workflow_type?: string;
  final_output?: any;
  telemetry?: any;
  error?: string;
}

export function useOrchestrator() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [executionHistory, setExecutionHistory] = useState<any[]>([]);

  const executeWorkflow = async (request: OrchestrationRequest): Promise<OrchestrationResult> => {
    setIsProcessing(true);
    
    try {
      console.log(`🎼 [Orchestrator Hook] Starting workflow: ${request.workflow_type}`);
      
      const { data, error } = await supabase.functions.invoke('orchestrator-engine', {
        body: request
      });

      if (error) throw error;

      console.log(`✅ [Orchestrator Hook] Workflow completed:`, data);
      
      // Add to execution history
      setExecutionHistory(prev => [data, ...prev.slice(0, 9)]); // Keep last 10
      
      toast.success(`Workflow ${request.workflow_type} completed successfully`);
      
      return data;
      
    } catch (error) {
      console.error('❌ [Orchestrator Hook] Workflow failed:', error);
      toast.error(`Workflow failed: ${error.message}`);
      
      return {
        success: false,
        error: error.message
      };
    } finally {
      setIsProcessing(false);
    }
  };

  const analyzeDeal = async (
    org_id: string,
    fund_id: string, 
    deal_id: string,
    input_data: any = {}
  ) => {
    return executeWorkflow({
      workflow_type: 'deal_analysis',
      org_id,
      fund_id,
      deal_id,
      input_data: {
        deal_id,
        trigger_reason: 'manual_analysis',
        ...input_data
      }
    });
  };

  const generateICMemo = async (
    org_id: string,
    fund_id: string,
    deal_id: string,
    input_data: any = {}
  ) => {
    return executeWorkflow({
      workflow_type: 'ic_memo_generation',
      org_id,
      fund_id,
      deal_id,
      input_data: {
        deal_id,
        memo_type: 'full',
        ...input_data
      }
    });
  };

  const getExecutionLogs = async (execution_token: string) => {
    try {
      const { data, error } = await supabase
        .from('orchestrator_executions')
        .select('*')
        .eq('execution_token', execution_token)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Failed to fetch execution logs:', error);
      return [];
    }
  };

  const resumeWorkflow = async (
    execution_token: string,
    from_step: string,
    input_data: any = {}
  ) => {
    // Get the original workflow context
    const { data: executions } = await supabase
      .from('orchestrator_executions')
      .select('*')
      .eq('execution_token', execution_token)
      .limit(1);

    if (!executions?.length) {
      throw new Error('Execution not found');
    }

    const original = executions[0];
    
    return executeWorkflow({
      workflow_type: original.workflow_type as any,
      org_id: original.org_id,
      fund_id: original.fund_id,
      deal_id: original.deal_id,
      input_data,
      resume_from_step: from_step
    });
  };

  return {
    isProcessing,
    executionHistory,
    executeWorkflow,
    analyzeDeal,
    generateICMemo,
    getExecutionLogs,
    resumeWorkflow
  };
}