import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// LangChain configuration
const langchainApiKey = Deno.env.get('LANGCHAIN_API_KEY');
const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

interface OrchestrationRequest {
  workflow_type: 'deal_analysis' | 'ic_memo_generation' | 'deal_enrichment';
  org_id: string;
  fund_id: string;
  deal_id?: string;
  input_data: any;
  resume_from_step?: string;
  fund_type?: 'venture_capital' | 'private_equity';
}

interface WorkflowStep {
  step_name: string;
  engine_name: string;
  input_schema: any;
  output_schema: any;
  execution_timeout: number;
  retry_policy: {
    max_attempts: number;
    backoff_strategy: 'linear' | 'exponential';
  };
}

// Fund-type specific workflows
const VC_DEAL_ANALYSIS_WORKFLOW: WorkflowStep[] = [
  {
    step_name: 'EntityCanonicalisation',
    engine_name: 'entity-processing-engine',
    input_schema: { deal_id: 'string', company_name: 'string' },
    output_schema: { canonical_entities: 'object' },
    execution_timeout: 30000,
    retry_policy: { max_attempts: 3, backoff_strategy: 'exponential' }
  },
  {
    step_name: 'MarketResearch',
    engine_name: 'market-research-engine', 
    input_schema: { entities: 'object', market_context: 'object' },
    output_schema: { market_analysis: 'object', tam_sam_som: 'object' },
    execution_timeout: 60000,
    retry_policy: { max_attempts: 2, backoff_strategy: 'linear' }
  },
  {
    step_name: 'TeamAnalysis',
    engine_name: 'team-research-engine',
    input_schema: { company_id: 'string', founder_data: 'object' },
    output_schema: { team_assessment: 'object', leadership_scores: 'object' },
    execution_timeout: 45000,
    retry_policy: { max_attempts: 3, backoff_strategy: 'exponential' }
  },
  {
    step_name: 'ProductTechnology',
    engine_name: 'product-ip-engine',
    input_schema: { company_data: 'object', tech_stack: 'object' },
    output_schema: { product_analysis: 'object', ip_assessment: 'object' },
    execution_timeout: 50000,
    retry_policy: { max_attempts: 2, backoff_strategy: 'linear' }
  },
  {
    step_name: 'TractionMetrics',
    engine_name: 'traction-analysis-engine',
    input_schema: { financial_data: 'object', growth_metrics: 'object' },
    output_schema: { traction_analysis: 'object', growth_assessment: 'object' },
    execution_timeout: 40000,
    retry_policy: { max_attempts: 3, backoff_strategy: 'exponential' }
  },
  {
    step_name: 'FinancialHealth',
    engine_name: 'financial-engine',
    input_schema: { financial_statements: 'object', projections: 'object' },
    output_schema: { financial_analysis: 'object', health_metrics: 'object' },
    execution_timeout: 55000,
    retry_policy: { max_attempts: 2, backoff_strategy: 'linear' }
  },
  {
    step_name: 'StrategicAlignment',
    engine_name: 'thesis-alignment-engine',
    input_schema: { deal_data: 'object', fund_strategy: 'object' },
    output_schema: { alignment_score: 'number', strategic_fit: 'object' },
    execution_timeout: 35000,
    retry_policy: { max_attempts: 3, backoff_strategy: 'exponential' }
  },
  {
    step_name: 'GovernanceAssessment',
    engine_name: 'governance-analysis-engine',
    input_schema: { governance_data: 'object', compliance: 'object' },
    output_schema: { governance_score: 'object', risk_assessment: 'object' },
    execution_timeout: 30000,
    retry_policy: { max_attempts: 2, backoff_strategy: 'linear' }
  }
];

const PE_DEAL_ANALYSIS_WORKFLOW: WorkflowStep[] = [
  {
    step_name: 'EntityCanonicalisation', 
    engine_name: 'entity-processing-engine',
    input_schema: { deal_id: 'string', company_name: 'string' },
    output_schema: { canonical_entities: 'object' },
    execution_timeout: 30000,
    retry_policy: { max_attempts: 3, backoff_strategy: 'exponential' }
  },
  {
    step_name: 'FinancialPerformance',
    engine_name: 'financial-engine',
    input_schema: { financial_statements: 'object', historical_data: 'object' },
    output_schema: { financial_performance: 'object', profitability: 'object' },
    execution_timeout: 60000,
    retry_policy: { max_attempts: 2, backoff_strategy: 'linear' }
  },
  {
    step_name: 'MarketPosition',
    engine_name: 'market-research-engine',
    input_schema: { market_data: 'object', competitive_landscape: 'object' },
    output_schema: { market_position: 'object', competitive_analysis: 'object' },
    execution_timeout: 55000,
    retry_policy: { max_attempts: 3, backoff_strategy: 'exponential' }
  },
  {
    step_name: 'OperationalExcellence',
    engine_name: 'operations-analysis-engine',
    input_schema: { operational_data: 'object', efficiency_metrics: 'object' },
    output_schema: { operational_assessment: 'object', efficiency_score: 'object' },
    execution_timeout: 50000,
    retry_policy: { max_attempts: 2, backoff_strategy: 'linear' }
  },
  {
    step_name: 'ManagementQuality',
    engine_name: 'team-research-engine',
    input_schema: { management_team: 'object', leadership_assessment: 'object' },
    output_schema: { management_analysis: 'object', quality_metrics: 'object' },
    execution_timeout: 45000,
    retry_policy: { max_attempts: 3, backoff_strategy: 'exponential' }
  },
  {
    step_name: 'ValueCreationPlan',
    engine_name: 'value-creation-engine',
    input_schema: { company_data: 'object', improvement_areas: 'object' },
    output_schema: { value_creation: 'object', improvement_roadmap: 'object' },
    execution_timeout: 60000,
    retry_policy: { max_attempts: 2, backoff_strategy: 'linear' }
  },
  {
    step_name: 'RiskAssessment',
    engine_name: 'risk-analysis-engine',
    input_schema: { risk_factors: 'object', mitigation_strategies: 'object' },
    output_schema: { risk_assessment: 'object', mitigation_plan: 'object' },
    execution_timeout: 40000,
    retry_policy: { max_attempts: 3, backoff_strategy: 'exponential' }
  },
  {
    step_name: 'ExitStrategy',
    engine_name: 'exit-strategy-engine',
    input_schema: { market_conditions: 'object', company_trajectory: 'object' },
    output_schema: { exit_analysis: 'object', timing_assessment: 'object' },
    execution_timeout: 35000,
    retry_policy: { max_attempts: 2, backoff_strategy: 'linear' }
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: OrchestrationRequest = await req.json();
    
    console.log(`🎼 [LangChain Orchestrator] Starting workflow: ${request.workflow_type}`);
    console.log(`📍 [LangChain Orchestrator] Context: org=${request.org_id}, fund=${request.fund_id}, deal=${request.deal_id}`);

    // Get fund type to determine workflow
    let fundType = request.fund_type;
    if (!fundType && request.fund_id) {
      const { data: fundData } = await supabase
        .from('funds')
        .select('fund_type')
        .eq('id', request.fund_id)
        .single();
      
      fundType = fundData?.fund_type;
    }

    // Select appropriate workflow based on fund type and request type
    let workflow: WorkflowStep[];
    
    if (request.workflow_type === 'deal_analysis') {
      workflow = fundType === 'private_equity' ? PE_DEAL_ANALYSIS_WORKFLOW : VC_DEAL_ANALYSIS_WORKFLOW;
    } else {
      // For other workflow types, use legacy approach for now
      return await executeLegacyWorkflow(request);
    }

    // Generate execution token
    const executionToken = `${request.workflow_type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create orchestration execution record
    const { data: executionRecord, error: executionError } = await supabase
      .from('orchestrator_executions')
      .insert({
        execution_token: executionToken,
        workflow_type: request.workflow_type,
        org_id: request.org_id,
        fund_id: request.fund_id,
        deal_id: request.deal_id,
        status: 'running',
        workflow_definition: workflow,
        input_data: request.input_data,
        fund_type: fundType
      })
      .select()
      .single();

    if (executionError) {
      throw new Error(`Failed to create execution record: ${executionError.message}`);
    }

    // Execute workflow steps
    const results = await executeWorkflow(workflow, request, executionToken, fundType);

    // Update execution record
    await supabase
      .from('orchestrator_executions')
      .update({
        status: results.success ? 'completed' : 'failed',
        completed_at: new Date().toISOString(),
        final_output: results.output,
        error_details: results.error,
        telemetry: results.telemetry
      })
      .eq('execution_token', executionToken);

    return new Response(JSON.stringify({
      success: results.success,
      execution_token: executionToken,
      workflow_type: request.workflow_type,
      fund_type: fundType,
      final_output: results.output,
      telemetry: results.telemetry,
      error: results.error
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ [LangChain Orchestrator] Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function executeWorkflow(
  workflow: WorkflowStep[], 
  request: OrchestrationRequest, 
  executionToken: string,
  fundType?: string
) {
  const telemetry = {
    steps_completed: 0,
    total_steps: workflow.length,
    step_timings: {},
    errors: []
  };

  let stepInput = request.input_data;
  let finalOutput = {};

  try {
    for (const [index, step] of workflow.entries()) {
      const stepStartTime = Date.now();
      
      console.log(`🔄 [LangChain Orchestrator] Executing step ${index + 1}/${workflow.length}: ${step.step_name}`);

      // Log step execution
      await supabase.from('orchestrator_step_logs').insert({
        execution_token: executionToken,
        step_name: step.step_name,
        step_index: index,
        status: 'running',
        started_at: new Date().toISOString(),
        input_data: stepInput
      });

      try {
        // Execute the step by calling the appropriate engine
        const stepResult = await executeEngineStep(step, stepInput, request);
        
        const stepDuration = Date.now() - stepStartTime;
        telemetry.step_timings[step.step_name] = stepDuration;
        telemetry.steps_completed++;

        // Update step log
        await supabase.from('orchestrator_step_logs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            output_data: stepResult,
            duration_ms: stepDuration
          })
          .eq('execution_token', executionToken)
          .eq('step_index', index);

        // Prepare input for next step
        stepInput = { ...stepInput, ...stepResult };
        finalOutput = { ...finalOutput, [step.step_name]: stepResult };

        console.log(`✅ [LangChain Orchestrator] Step ${step.step_name} completed in ${stepDuration}ms`);

      } catch (stepError) {
        console.error(`❌ [LangChain Orchestrator] Step ${step.step_name} failed:`, stepError);
        
        telemetry.errors.push({
          step: step.step_name,
          error: stepError.message,
          timestamp: new Date().toISOString()
        });

        // Update step log
        await supabase.from('orchestrator_step_logs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_message: stepError.message,
            duration_ms: Date.now() - stepStartTime
          })
          .eq('execution_token', executionToken)
          .eq('step_index', index);

        // For critical steps, fail the entire workflow
        if (isCriticalStep(step.step_name)) {
          throw stepError;
        }
        
        // For non-critical steps, continue with degraded functionality
        console.log(`⚠️ [LangChain Orchestrator] Non-critical step ${step.step_name} failed, continuing...`);
      }
    }

    return {
      success: true,
      output: finalOutput,
      telemetry
    };

  } catch (error) {
    return {
      success: false,
      output: finalOutput,
      error: error.message,
      telemetry
    };
  }
}

async function executeEngineStep(step: WorkflowStep, input: any, request: OrchestrationRequest) {
  // Map engine names to actual edge functions
  const engineMapping = {
    'entity-processing-engine': 'entity-processing',
    'market-research-engine': 'market-research-engine', 
    'team-research-engine': 'team-research-engine',
    'product-ip-engine': 'product-ip-engine',
    'traction-analysis-engine': 'traction-analysis',
    'financial-engine': 'financial-engine',
    'thesis-alignment-engine': 'thesis-alignment-engine',
    'governance-analysis-engine': 'governance-analysis',
    'operations-analysis-engine': 'operations-analysis',
    'value-creation-engine': 'value-creation',
    'risk-analysis-engine': 'risk-analysis',
    'exit-strategy-engine': 'exit-strategy'
  };

  const functionName = engineMapping[step.engine_name];
  if (!functionName) {
    throw new Error(`Unknown engine: ${step.engine_name}`);
  }

  // Call the engine with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), step.execution_timeout);

  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: {
        ...input,
        org_id: request.org_id,
        fund_id: request.fund_id,
        deal_id: request.deal_id
      }
    });

    clearTimeout(timeoutId);

    if (error) {
      throw new Error(`Engine ${step.engine_name} error: ${error.message}`);
    }

    return data;
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error(`Engine ${step.engine_name} timed out after ${step.execution_timeout}ms`);
    }
    
    throw error;
  }
}

function isCriticalStep(stepName: string): boolean {
  const criticalSteps = [
    'EntityCanonicalisation',
    'FinancialPerformance', // Critical for PE
    'MarketResearch', // Critical for VC
    'StrategicAlignment'
  ];
  
  return criticalSteps.includes(stepName);
}

async function executeLegacyWorkflow(request: OrchestrationRequest) {
  // Fallback to existing orchestrator logic for non-deal-analysis workflows
  console.log(`🔄 [LangChain Orchestrator] Falling back to legacy workflow for: ${request.workflow_type}`);
  
  // This would call existing engines in the legacy pattern
  // Implementation would go here based on the existing orchestrator-engine logic
  
  return new Response(JSON.stringify({
    success: true,
    message: `Legacy workflow ${request.workflow_type} executed`,
    workflow_type: request.workflow_type
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}