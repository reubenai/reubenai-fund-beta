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

// Orchestrator workflow definitions
const WORKFLOWS = {
  deal_analysis: [
    'CanonicaliseEntities',
    'CacheCheck', 
    'RetrievalPlan',
    'HybridRetrieve',
    'ReRank',
    'ContextPack',
    'ExtractFeatures',
    'ScoreDealV2',
    'PersistArtifacts'
  ],
  ic_memo_generation: [
    'CacheCheck',
    'RetrievalPlan', 
    'HybridRetrieve',
    'ContextPack',
    'DraftICMemo',
    'FactConsistencyCheck',
    'PersistArtifacts'
  ]
};

interface OrchestrationRequest {
  workflow_type: 'deal_analysis' | 'ic_memo_generation';
  org_id: string;
  fund_id: string;
  deal_id?: string;
  input_data: any;
  resume_from_step?: string;
}

interface StepContext {
  org_id: string;
  fund_id: string;
  deal_id?: string;
  execution_token: string;
  step_input: any;
  step_output?: any;
  telemetry: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: OrchestrationRequest = await req.json();
    
    console.log(`🎼 [Orchestrator] Starting workflow: ${request.workflow_type}`);
    console.log(`📍 [Orchestrator] Context: org=${request.org_id}, fund=${request.fund_id}, deal=${request.deal_id}`);

    // Check feature flags
    const { data: flags } = await supabase
      .from('feature_flags')
      .select('flag_name, flag_value')
      .or(`org_id.is.null,org_id.eq.${request.org_id}`);

    const enabledFlags = new Set(flags?.filter(f => f.flag_value).map(f => f.flag_name) || []);
    
    // Generate execution token for idempotency
    const execution_token = `${request.org_id}_${request.fund_id}_${request.deal_id || 'global'}_${Date.now()}`;
    
    // Get workflow steps
    const workflow_steps = WORKFLOWS[request.workflow_type];
    if (!workflow_steps) {
      throw new Error(`Unknown workflow type: ${request.workflow_type}`);
    }

    let current_step_index = 0;
    if (request.resume_from_step) {
      current_step_index = workflow_steps.indexOf(request.resume_from_step);
      if (current_step_index === -1) {
        throw new Error(`Invalid resume step: ${request.resume_from_step}`);
      }
    }

    const context: StepContext = {
      org_id: request.org_id,
      fund_id: request.fund_id,
      deal_id: request.deal_id,
      execution_token,
      step_input: request.input_data,
      telemetry: {
        workflow_type: request.workflow_type,
        started_at: new Date().toISOString(),
        feature_flags: Array.from(enabledFlags)
      }
    };

    // Execute workflow steps
    for (let i = current_step_index; i < workflow_steps.length; i++) {
      const step_name = workflow_steps[i];
      
      console.log(`🔄 [Orchestrator] Executing step ${i + 1}/${workflow_steps.length}: ${step_name}`);
      
      // Log step start
      await supabase.from('orchestrator_executions').insert({
        org_id: request.org_id,
        fund_id: request.fund_id,
        deal_id: request.deal_id,
        execution_token,
        workflow_type: request.workflow_type,
        current_step: step_name,
        step_status: 'running',
        step_input: context.step_input,
        telemetry_data: context.telemetry
      });

      try {
        // Execute step
        const step_result = await executeStep(step_name, context, enabledFlags);
        
        // Update context for next step
        context.step_input = step_result.output;
        context.step_output = step_result.output;
        
        // Log step completion
        await supabase.from('orchestrator_executions')
          .update({
            step_status: 'completed',
            step_output: step_result.output,
            telemetry_data: { ...context.telemetry, ...step_result.telemetry }
          })
          .eq('execution_token', execution_token)
          .eq('current_step', step_name);

        console.log(`✅ [Orchestrator] Step ${step_name} completed successfully`);
        
      } catch (error) {
        console.error(`❌ [Orchestrator] Step ${step_name} failed:`, error);
        
        // Log step failure
        await supabase.from('orchestrator_executions')
          .update({
            step_status: 'failed',
            error_details: { 
              error: error.message,
              stack: error.stack,
              timestamp: new Date().toISOString()
            }
          })
          .eq('execution_token', execution_token)
          .eq('current_step', step_name);
        
        // For now, fail fast. Later we can add retry logic
        throw error;
      }
    }

    console.log(`🎉 [Orchestrator] Workflow ${request.workflow_type} completed successfully`);
    
    return new Response(JSON.stringify({
      success: true,
      execution_token,
      workflow_type: request.workflow_type,
      final_output: context.step_output,
      telemetry: context.telemetry
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ [Orchestrator] Workflow failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function executeStep(
  step_name: string, 
  context: StepContext, 
  enabledFlags: Set<string>
): Promise<{ output: any; telemetry: any }> {
  
  const step_start = Date.now();
  
  switch (step_name) {
    case 'CanonicaliseEntities':
      return await canonicaliseEntities(context);
      
    case 'CacheCheck':
      if (!enabledFlags.has('promptcache_v1')) {
        return { output: context.step_input, telemetry: { cache_skipped: true } };
      }
      return await cacheCheck(context);
      
    case 'RetrievalPlan':
      return await retrievalPlan(context);
      
    case 'HybridRetrieve':
      if (!enabledFlags.has('retrieval_hybrid_v1')) {
        return await basicRetrieve(context);
      }
      return await hybridRetrieve(context);
      
    case 'ReRank':
      return await reRank(context);
      
    case 'ContextPack':
      return await contextPack(context);
      
    case 'ExtractFeatures':
      if (!enabledFlags.has('feature_store_v1')) {
        return { output: context.step_input, telemetry: { features_skipped: true } };
      }
      return await extractFeatures(context);
      
    case 'ScoreDealV2':
      if (!enabledFlags.has('scoring_v2')) {
        return await scoreDealV1(context);
      }
      return await scoreDealV2(context);
      
    case 'DraftICMemo':
      if (!enabledFlags.has('ic_memo_drafter_v1')) {
        return { output: context.step_input, telemetry: { memo_skipped: true } };
      }
      return await draftICMemo(context);
      
    case 'FactConsistencyCheck':
      return await factConsistencyCheck(context);
      
    case 'PersistArtifacts':
      return await persistArtifacts(context);
      
    default:
      throw new Error(`Unknown step: ${step_name}`);
  }
}

// Step implementations (placeholder for now)
async function canonicaliseEntities(context: StepContext) {
  // TODO: Implement entity canonicalisation
  return {
    output: { ...context.step_input, entities_canonicalised: true },
    telemetry: { step_duration_ms: 100 }
  };
}

async function cacheCheck(context: StepContext) {
  // TODO: Implement cache checking
  return {
    output: { ...context.step_input, cache_hit: false },
    telemetry: { step_duration_ms: 50 }
  };
}

async function retrievalPlan(context: StepContext) {
  // TODO: Implement retrieval planning
  return {
    output: { ...context.step_input, retrieval_plan: { chunks_needed: 8, search_terms: [] } },
    telemetry: { step_duration_ms: 200 }
  };
}

async function hybridRetrieve(context: StepContext) {
  // TODO: Implement hybrid retrieval
  return {
    output: { ...context.step_input, retrieved_chunks: [] },
    telemetry: { step_duration_ms: 1000, chunks_retrieved: 0 }
  };
}

async function basicRetrieve(context: StepContext) {
  // TODO: Implement basic retrieval
  return {
    output: { ...context.step_input, retrieved_chunks: [] },
    telemetry: { step_duration_ms: 800, chunks_retrieved: 0 }
  };
}

async function reRank(context: StepContext) {
  // TODO: Implement re-ranking
  return {
    output: { ...context.step_input, chunks_reranked: true },
    telemetry: { step_duration_ms: 300 }
  };
}

async function contextPack(context: StepContext) {
  // TODO: Implement context packing
  return {
    output: { ...context.step_input, context_packed: true },
    telemetry: { step_duration_ms: 150 }
  };
}

async function extractFeatures(context: StepContext) {
  // TODO: Implement feature extraction
  return {
    output: { ...context.step_input, features_extracted: true },
    telemetry: { step_duration_ms: 2000 }
  };
}

async function scoreDealV1(context: StepContext) {
  // TODO: Keep existing scoring logic
  return {
    output: { ...context.step_input, score_v1: true },
    telemetry: { step_duration_ms: 1500 }
  };
}

async function scoreDealV2(context: StepContext) {
  // TODO: Implement feature-first scoring
  return {
    output: { ...context.step_input, score_v2: true },
    telemetry: { step_duration_ms: 1200 }
  };
}

async function draftICMemo(context: StepContext) {
  // TODO: Implement IC memo drafting
  return {
    output: { ...context.step_input, memo_drafted: true },
    telemetry: { step_duration_ms: 3000 }
  };
}

async function factConsistencyCheck(context: StepContext) {
  // TODO: Implement fact consistency checking
  return {
    output: { ...context.step_input, fact_check_passed: true },
    telemetry: { step_duration_ms: 800 }
  };
}

async function persistArtifacts(context: StepContext) {
  // TODO: Implement artifact persistence
  return {
    output: { ...context.step_input, artifacts_persisted: true },
    telemetry: { step_duration_ms: 500 }
  };
}
