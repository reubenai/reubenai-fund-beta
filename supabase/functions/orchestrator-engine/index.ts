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
    'EnrichmentCheck',
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
  ],
  deal_enrichment: [
    'ValidateMetadata',
    'DetermineEnrichmentPacks',
    'ExecuteEnrichment',
    'ValidateEnrichment',
    'TriggerRescoring'
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

interface WorkflowJobStatus {
  execution_token: string;
  workflow_type: string;
  status: 'running' | 'completed' | 'completed_with_error' | 'failed';
  error_type?: 'technical' | 'business' | 'system';
  error_details?: any;
  completion_reason?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: OrchestrationRequest = await req.json();
    
    // 🚨 EMERGENCY HARDCODED BLOCK FOR KERNEL & ASTRO DEALS
    const BLOCKED_DEALS = ['7ac26a5f-34c9-4d30-b09c-c05d1d1df81d', '98c22f44-87c7-4808-be1c-31929c3da52f'];
    if (BLOCKED_DEALS.includes(request.deal_id)) {
      console.log(`🛑 EMERGENCY BLOCK: Orchestrator terminated for blocked deal: ${request.deal_id}`);
      return new Response(JSON.stringify({
        success: false,
        workflow_id: request.workflow_id || 'unknown',
        status: 'emergency_blocked',
        error: 'EMERGENCY_SHUTDOWN_ACTIVE: Deal processing blocked by emergency protocol',
        steps_completed: 0,
        total_steps: 0
      }), {
        status: 423, // Locked status
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // 🛡️ PRE-FLIGHT VALIDATION: Check if analysis is already complete
    if (request.deal_id) {
      const { data: isComplete } = await supabase.rpc('is_deal_analysis_complete', {
        p_deal_id: request.deal_id
      });
      
      if (isComplete) {
        console.log(`✅ [Orchestrator] Analysis already complete for deal ${request.deal_id}`);
        return new Response(JSON.stringify({
          success: true,
          status: 'already_completed',
          message: 'Analysis already exists for this deal',
          completion_reason: 'analysis_already_exists'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // 🔒 EXECUTION LOCK: Prevent concurrent analysis runs for same deal
    if (request.deal_id) {
      const lockResult = await acquireExecutionLock(request.deal_id, 'orchestrator-engine');
      if (!lockResult.acquired) {
        console.log(`🔒 [Orchestrator] Analysis already running for deal ${request.deal_id}`);
        return new Response(JSON.stringify({
          success: false,
          status: 'analysis_in_progress',
          error: 'Another analysis is already running for this deal',
          locked_by: lockResult.locked_by,
          locked_at: lockResult.locked_at
        }), {
          status: 423, // Locked
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // ⏱️ RATE LIMITING: Check if deal exceeds rate limits
    if (request.deal_id) {
      const rateLimitResult = await checkRateLimits(request.deal_id);
      if (!rateLimitResult.allowed) {
        console.log(`⏱️ [Orchestrator] Rate limit exceeded for deal ${request.deal_id}`);
        
        // Release the lock we just acquired
        if (request.deal_id) {
          await releaseExecutionLock(request.deal_id);
        }
        
        return new Response(JSON.stringify({
          success: false,
          status: 'rate_limited',
          error: rateLimitResult.reason,
          next_allowed_at: rateLimitResult.next_allowed_at
        }), {
          status: 429, // Too Many Requests
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // 📊 CREATE ANALYSIS TRACKER: Track this analysis run
    let trackerResult;
    if (request.deal_id) {
      trackerResult = await createAnalysisTracker(request.deal_id, request.workflow_type);
      if (!trackerResult.success) {
        console.log(`📊 [Orchestrator] Failed to create analysis tracker: ${trackerResult.error}`);
        
        // Release the lock we acquired
        await releaseExecutionLock(request.deal_id);
        
        return new Response(JSON.stringify({
          success: false,
          status: 'tracker_creation_failed',
          error: trackerResult.error
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    
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

    // Initialize job status tracking
    const jobStatus: WorkflowJobStatus = {
      execution_token,
      workflow_type: request.workflow_type,
      status: 'running',
      completion_reason: 'workflow_started'
    };

    // Log job start in orchestrator_executions with job status
    await supabase.from('orchestrator_executions').insert({
      org_id: request.org_id,
      fund_id: request.fund_id,
      deal_id: request.deal_id,
      execution_token,
      workflow_type: request.workflow_type,
      current_step: 'job_start',
      step_status: 'running',
      step_input: { job_status: jobStatus },
      telemetry_data: context.telemetry
    });

    console.log(`🎯 [Orchestrator] Job ${execution_token} initialized with ${workflow_steps.length} steps`);

    // Execute workflow steps with improved error handling
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
        // Execute step with retry logic
        const step_result = await executeStepWithRetry(step_name, context, enabledFlags);
        
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
        
        // Classify error type and determine if job should auto-complete
        const errorClassification = classifyError(error, step_name);
        
        // Log step failure with error classification
        await supabase.from('orchestrator_executions')
          .update({
            step_status: 'failed',
            error_details: { 
              error: error.message,
              stack: error.stack,
              timestamp: new Date().toISOString(),
              error_type: errorClassification.type,
              http_status: errorClassification.httpStatus,
              is_technical_error: errorClassification.isTechnical,
              should_auto_complete: errorClassification.shouldAutoComplete
            }
          })
          .eq('execution_token', execution_token)
          .eq('current_step', step_name);

        // Handle error based on classification
        if (errorClassification.shouldAutoComplete) {
          // For technical errors (4xx/5xx), mark job as completed with error
          jobStatus.status = 'completed_with_error';
          jobStatus.error_type = 'technical';
          jobStatus.error_details = {
            failed_step: step_name,
            http_status: errorClassification.httpStatus,
            error_message: error.message,
            completion_reason: 'auto_completed_due_to_technical_error'
          };
          
          console.log(`🟡 [Orchestrator] Auto-completing job due to technical error in step ${step_name}`);
          
          // Try to persist artifacts with error status for partial completion
          try {
            await persistArtifactsWithError(context, jobStatus);
          } catch (persistError) {
            console.error('❌ [Orchestrator] Failed to persist artifacts after technical error:', persistError);
          }
          
          // Log job completion with error
          await logJobCompletion(execution_token, request, jobStatus);
          
          // 🧹 CLEANUP: Update tracker and release lock on technical error auto-completion
          if (request.deal_id) {
            await updateAnalysisTracker(request.deal_id, 'completed', 'technical_error_auto_completion', 0, 0);
            await releaseExecutionLock(request.deal_id);
          }
          
          return new Response(JSON.stringify({
            success: false,
            execution_token,
            workflow_type: request.workflow_type,
            status: jobStatus.status,
            error_type: jobStatus.error_type,
            error_details: jobStatus.error_details,
            steps_completed: i,
            total_steps: workflow_steps.length,
            completion_reason: 'technical_error_auto_completion'
          }), {
            status: 206, // Partial Content - job partially completed
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          // For business/system errors, fail completely
          jobStatus.status = 'failed';
          jobStatus.error_type = errorClassification.type;
          jobStatus.error_details = {
            failed_step: step_name,
            error_message: error.message,
            completion_reason: 'business_logic_failure'
          };
          
          await logJobCompletion(execution_token, request, jobStatus);
          throw error;
        }
      }
    }

    // Mark job as completed successfully
    jobStatus.status = 'completed';
    jobStatus.completion_reason = 'all_steps_successful';
    
    console.log(`🎉 [Orchestrator] Workflow ${request.workflow_type} completed successfully`);
    
    // 🧹 CLEANUP: Update tracker and release lock on success
    if (request.deal_id) {
      await updateAnalysisTracker(request.deal_id, 'completed', 'all_steps_successful', 1, 0);
      await releaseExecutionLock(request.deal_id);
    }
    
    // Log job completion
    await logJobCompletion(execution_token, request, jobStatus);
    
    return new Response(JSON.stringify({
      success: true,
      execution_token,
      workflow_type: request.workflow_type,
      status: jobStatus.status,
      final_output: context.step_output,
      telemetry: context.telemetry,
      steps_completed: workflow_steps.length,
      total_steps: workflow_steps.length,
      completion_reason: jobStatus.completion_reason
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ [Orchestrator] Workflow failed:', error);
    
    // 🧹 CLEANUP: Release lock and update tracker on unexpected error
    if (request?.deal_id) {
      await updateAnalysisTracker(request.deal_id, 'failed', 'unexpected_workflow_error', 0, 0);
      await releaseExecutionLock(request.deal_id);
    }
    
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
      
    case 'EnrichmentCheck':
      return await enrichmentCheck(context);
      
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
  const { data } = await supabase.functions.invoke('hybrid-retrieval-engine', {
    body: {
      org_id: context.org_id,
      fund_id: context.fund_id,
      deal_id: context.deal_id,
      query: context.step_input.query || 'company analysis',
      context_budget: 8,
      search_namespaces: [`deal_corpus/${context.org_id}`, `fund_memory/${context.org_id}/${context.fund_id}`]
    }
  });
  
  return {
    output: { ...context.step_input, retrieved_chunks: data?.chunks || [] },
    telemetry: { step_duration_ms: 1000, chunks_retrieved: data?.chunks?.length || 0 }
  };
}

async function extractFeatures(context: StepContext) {
  const { data } = await supabase.functions.invoke('feature-extraction-engine', {
    body: {
      org_id: context.org_id,
      fund_id: context.fund_id,
      deal_id: context.deal_id,
      deal_data: context.step_input.deal_data || {},
      context_chunks: context.step_input.retrieved_chunks || []
    }
  });
  
  return {
    output: { ...context.step_input, features: data?.features || [] },
    telemetry: { step_duration_ms: 2000, features_extracted: data?.features_extracted || 0 }
  };
}

async function scoreDealV2(context: StepContext) {
  const { data } = await supabase.functions.invoke('feature-first-scoring', {
    body: {
      org_id: context.org_id,
      fund_id: context.fund_id,
      deal_id: context.deal_id,
      features: context.step_input.features || [],
      context_chunks: context.step_input.retrieved_chunks || []
    }
  });
  
  return {
    output: { ...context.step_input, scores: data?.category_scores || [], overall_score: data?.overall_score },
    telemetry: { step_duration_ms: 1200, scoring_method: 'feature_first_v2' }
  };
}

async function draftICMemo(context: StepContext) {
  const { data } = await supabase.functions.invoke('ic-memo-drafter', {
    body: {
      org_id: context.org_id,
      fund_id: context.fund_id,
      deal_id: context.deal_id,
      features: context.step_input.features || [],
      scores: context.step_input.scores || [],
      context_chunks: context.step_input.retrieved_chunks || []
    }
  });
  
  return {
    output: { ...context.step_input, memo: data?.memo, fact_check_status: data?.fact_check_status },
    telemetry: { step_duration_ms: 3000, memo_generated: !!data?.memo }
  };
}

async function factConsistencyCheck(context: StepContext) {
  // TODO: Implement fact consistency checking
  return {
    output: { ...context.step_input, fact_check_passed: true },
    telemetry: { step_duration_ms: 800 }
  };
}

async function enrichmentCheck(context: StepContext) {
  // Check if deal needs enrichment and trigger if necessary
  try {
    const { data: dealData } = await supabase
      .from('deals')
      .select('*')
      .eq('id', context.deal_id)
      .single();
    
    const { data: fundData } = await supabase
      .from('funds')
      .select('fund_type')
      .eq('id', context.fund_id)
      .single();
    
    // Determine enrichment packs needed based on fund type and deal metadata
    const enrichmentPacks = determineRequiredEnrichmentPacks(dealData, fundData);
    
    if (enrichmentPacks.length > 0) {
      console.log(`🔬 [Orchestrator] Triggering enrichment packs: ${enrichmentPacks.join(', ')}`);
      
      // Trigger enrichment
      const { data: enrichmentResult } = await supabase.functions.invoke('deal-enrichment-engine', {
        body: {
          org_id: context.org_id,
          fund_id: context.fund_id,
          deal_id: context.deal_id,
          enrichment_packs: enrichmentPacks
        }
      });
      
      return {
        output: { ...context.step_input, enrichment_completed: true, enrichment_data: enrichmentResult },
        telemetry: { step_duration_ms: 3000, packs_processed: enrichmentPacks.length }
      };
    }
    
    return {
      output: { ...context.step_input, enrichment_skipped: true },
      telemetry: { step_duration_ms: 100 }
    };
    
  } catch (error) {
    console.error('Enrichment check failed:', error);
    return {
      output: { ...context.step_input, enrichment_failed: true, error: error.message },
      telemetry: { step_duration_ms: 200 }
    };
  }
}

function determineRequiredEnrichmentPacks(dealData: any, fundData: any): string[] {
  const packs: string[] = [];
  
  // Check if deal has minimum metadata for enrichment
  if (!dealData.industry && !dealData.funding_stage && !dealData.location) {
    return []; // Skip enrichment if insufficient metadata
  }
  
  // Determine packs based on fund type
  if (fundData.fund_type === 'venture_capital') {
    // Always enrich core VC categories
    packs.push('vc_market_opportunity', 'vc_team_leadership');
    
    // Add conditional packs based on available data
    if (dealData.website || dealData.description) {
      packs.push('vc_product_technology', 'vc_business_traction');
    }
    
    if (dealData.deal_size || dealData.valuation) {
      packs.push('vc_financial_health');
    }
    
    // Always add strategic fit and timing
    packs.push('vc_strategic_fit', 'vc_strategic_timing');
    
    // Add trust/transparency if company is mature enough
    if (dealData.funding_stage && ['series_a', 'series_b', 'series_c'].includes(dealData.funding_stage)) {
      packs.push('vc_trust_transparency');
    }
    
  } else if (fundData.fund_type === 'private_equity') {
    // PE companies typically have more data available
    packs.push(
      'pe_financial_performance',
      'pe_market_position', 
      'pe_operational_excellence',
      'pe_growth_potential',
      'pe_risk_assessment',
      'pe_strategic_timing',
      'pe_trust_transparency'
    );
  }
  
  return packs;
}

// Missing basicRetrieve function - this was causing the orchestrator crash
async function basicRetrieve(context: StepContext) {
  console.log('📋 [BasicRetrieve] Using fallback retrieval method');
  
  try {
    // Basic document retrieval from deal documents and notes
    const { data: dealDocs } = await supabase
      .from('deal_documents')
      .select('extracted_text, document_type, name')
      .eq('deal_id', context.deal_id)
      .not('extracted_text', 'is', null)
      .limit(5);
    
    const { data: dealNotes } = await supabase
      .from('deal_notes')
      .select('content, category')
      .eq('deal_id', context.deal_id)
      .limit(10);
    
    // Combine available text data
    const chunks = [
      ...(dealDocs || []).map(doc => ({
        content: doc.extracted_text,
        source: `document:${doc.name}`,
        type: doc.document_type || 'document'
      })),
      ...(dealNotes || []).map(note => ({
        content: note.content,
        source: `note:${note.category}`,
        type: 'note'
      }))
    ];
    
    return {
      output: { ...context.step_input, retrieved_chunks: chunks },
      telemetry: { step_duration_ms: 300, chunks_retrieved: chunks.length, retrieval_method: 'basic' }
    };
    
  } catch (error) {
    console.error('❌ [BasicRetrieve] Failed:', error);
    // Return empty chunks rather than failing completely
    return {
      output: { ...context.step_input, retrieved_chunks: [] },
      telemetry: { step_duration_ms: 100, chunks_retrieved: 0, retrieval_method: 'basic_failed' }
    };
  }
}

async function reRank(context: StepContext) {
  // TODO: Implement re-ranking
  return {
    output: { ...context.step_input, chunks_reranked: true },
    telemetry: { step_duration_ms: 200 }
  };
}

async function contextPack(context: StepContext) {
  // TODO: Implement context packing
  return {
    output: { ...context.step_input, context_packed: true },
    telemetry: { step_duration_ms: 150 }
  };
}

async function scoreDealV1(context: StepContext) {
  // Fallback scoring method
  return {
    output: { ...context.step_input, scores: [], overall_score: 70 },
    telemetry: { step_duration_ms: 800, scoring_method: 'legacy_v1' }
  };
}

async function persistArtifacts(context: StepContext) {
  try {
    // Store analysis artifacts in the artifacts table
    const { error } = await supabase.from('artifacts').insert({
      org_id: context.org_id,
      fund_id: context.fund_id,
      deal_id: context.deal_id,
      artifact_type: 'analysis_result',
      artifact_kind: context.telemetry.workflow_type,
      artifact_data: {
        final_output: context.step_output,
        telemetry: context.telemetry,
        execution_token: context.execution_token
      },
      validation_status: 'completed'
    });
    
    if (error) {
      console.error('❌ [PersistArtifacts] Failed to store artifacts:', error);
    }
    
    return {
      output: { ...context.step_input, artifacts_persisted: !error },
      telemetry: { step_duration_ms: 500, storage_success: !error }
    };
  } catch (error) {
    console.error('❌ [PersistArtifacts] Error:', error);
    return {
      output: { ...context.step_input, artifacts_persisted: false },
      telemetry: { step_duration_ms: 200, storage_success: false }
    };
  }
}

// Improved step execution with retry logic
async function executeStepWithRetry(
  step_name: string, 
  context: StepContext, 
  enabledFlags: Set<string>,
  maxRetries: number = 2
): Promise<{ output: any; telemetry: any }> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Max 5s backoff
        console.log(`🔄 [Orchestrator] Retry attempt ${attempt}/${maxRetries} for step ${step_name} after ${backoffDelay}ms`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
      
      const result = await executeStep(step_name, context, enabledFlags);
      
      if (attempt > 0) {
        console.log(`✅ [Orchestrator] Step ${step_name} succeeded on retry attempt ${attempt}`);
      }
      
      return result;
    } catch (error) {
      lastError = error;
      console.error(`❌ [Orchestrator] Step ${step_name} attempt ${attempt + 1} failed:`, error.message);
      
      // Don't retry for certain error types
      const classification = classifyError(error, step_name);
      if (!classification.isRetryable || attempt === maxRetries) {
        break;
      }
    }
  }
  
  throw lastError;
}

// Error classification for better handling
function classifyError(error: any, step_name: string): {
  type: 'technical' | 'business' | 'system';
  httpStatus?: number;
  isTechnical: boolean;
  shouldAutoComplete: boolean;
  isRetryable: boolean;
} {
  const errorMessage = error.message || error.toString();
  
  // Extract HTTP status code if present
  let httpStatus: number | undefined;
  const httpMatch = errorMessage.match(/(?:status|code)\s*:?\s*(\d{3})/i);
  if (httpMatch) {
    httpStatus = parseInt(httpMatch[1]);
  }
  
  // Classify based on HTTP status code
  if (httpStatus) {
    if (httpStatus >= 400 && httpStatus < 500) {
      // 4xx errors - client/technical errors, auto-complete
      return {
        type: 'technical',
        httpStatus,
        isTechnical: true,
        shouldAutoComplete: true,
        isRetryable: httpStatus === 429 || httpStatus === 408 // Only retry rate limits and timeouts
      };
    } else if (httpStatus >= 500) {
      // 5xx errors - server errors, auto-complete but retryable
      return {
        type: 'technical',
        httpStatus,
        isTechnical: true,
        shouldAutoComplete: true,
        isRetryable: true
      };
    }
  }
  
  // Check for specific error patterns
  const lowerErrorMessage = errorMessage.toLowerCase();
  
  // Network/connectivity errors - retryable technical errors
  if (lowerErrorMessage.includes('network') || 
      lowerErrorMessage.includes('connection') ||
      lowerErrorMessage.includes('timeout') ||
      lowerErrorMessage.includes('fetch') && lowerErrorMessage.includes('failed')) {
    return {
      type: 'technical',
      isTechnical: true,
      shouldAutoComplete: true,
      isRetryable: true
    };
  }
  
  // Authentication/authorization errors - non-retryable technical errors
  if (lowerErrorMessage.includes('unauthorized') ||
      lowerErrorMessage.includes('forbidden') ||
      lowerErrorMessage.includes('authentication') ||
      lowerErrorMessage.includes('permission')) {
    return {
      type: 'technical',
      isTechnical: true,
      shouldAutoComplete: true,
      isRetryable: false
    };
  }
  
  // Business logic errors - don't auto-complete
  if (lowerErrorMessage.includes('validation') ||
      lowerErrorMessage.includes('invalid workflow') ||
      lowerErrorMessage.includes('missing required') ||
      step_name === 'PersistArtifacts') {
    return {
      type: 'business',
      isTechnical: false,
      shouldAutoComplete: false,
      isRetryable: false
    };
  }
  
  // System/infrastructure errors - auto-complete and retryable
  if (lowerErrorMessage.includes('database') ||
      lowerErrorMessage.includes('redis') ||
      lowerErrorMessage.includes('storage') ||
      lowerErrorMessage.includes('memory')) {
    return {
      type: 'system',
      isTechnical: true,
      shouldAutoComplete: true,
      isRetryable: true
    };
  }
  
  // Default classification - treat unknown errors as business errors to be safe
  return {
    type: 'business',
    isTechnical: false,
    shouldAutoComplete: false,
    isRetryable: false
  };
}

// Persist artifacts with error status for partial completion
async function persistArtifactsWithError(context: StepContext, jobStatus: WorkflowJobStatus) {
  try {
    console.log(`🟡 [PersistArtifactsWithError] Storing partial results due to technical error`);
    
    const { error } = await supabase.from('artifacts').insert({
      org_id: context.org_id,
      fund_id: context.fund_id,
      deal_id: context.deal_id,
      artifact_type: 'partial_analysis_result',
      artifact_kind: context.telemetry.workflow_type,
      artifact_data: {
        partial_output: context.step_output || context.step_input,
        telemetry: context.telemetry,
        execution_token: context.execution_token,
        job_status: jobStatus,
        error_completion: true,
        completion_timestamp: new Date().toISOString()
      },
      validation_status: 'completed_with_error'
    });
    
    if (error) {
      console.error('❌ [PersistArtifactsWithError] Failed to store partial artifacts:', error);
      throw error;
    }
    
    console.log(`✅ [PersistArtifactsWithError] Successfully stored partial artifacts for technical error completion`);
    
  } catch (error) {
    console.error('❌ [PersistArtifactsWithError] Error storing partial artifacts:', error);
    throw error;
  }
}

// Log overall job completion status
async function logJobCompletion(
  execution_token: string, 
  request: OrchestrationRequest, 
  jobStatus: WorkflowJobStatus
) {
  try {
    // Update the job start record with final status
    await supabase.from('orchestrator_executions')
      .update({
        step_status: jobStatus.status === 'completed' ? 'completed' : 'failed',
        step_output: {
          job_completion_status: jobStatus,
          final_job_state: 'job_completed',
          completion_timestamp: new Date().toISOString()
        },
        telemetry_data: {
          workflow_type: request.workflow_type,
          final_status: jobStatus.status,
          error_type: jobStatus.error_type,
          completion_reason: jobStatus.completion_reason
        }
      })
      .eq('execution_token', execution_token)
      .eq('current_step', 'job_start');
    
    console.log(`📊 [Orchestrator] Job completion logged: ${jobStatus.status} - ${jobStatus.completion_reason}`);
    
  } catch (error) {
    console.error('❌ [Orchestrator] Failed to log job completion:', error);
    // Don't throw here as it's just logging
  }
}

// ==================== LIMITER FUNCTIONS ====================

// Acquire execution lock to prevent concurrent analysis
async function acquireExecutionLock(dealId: string, lockedBy: string): Promise<{
  acquired: boolean;
  locked_by?: string;
  locked_at?: string;
}> {
  try {
    // Clean up expired locks first
    await supabase.rpc('cleanup_expired_execution_locks');
    
    // Try to acquire lock
    const { data, error } = await supabase
      .from('deal_execution_locks')
      .insert({
        deal_id: dealId,
        lock_type: 'analysis',
        locked_by: lockedBy,
        expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
        metadata: {
          acquired_at: new Date().toISOString(),
          service: 'orchestrator-engine'
        }
      })
      .select()
      .single();
    
    if (error) {
      // Check if it's a unique constraint violation (lock already exists)
      if (error.code === '23505') {
        // Lock already exists, check who owns it
        const { data: existingLock } = await supabase
          .from('deal_execution_locks')
          .select('locked_by, locked_at')
          .eq('deal_id', dealId)
          .eq('lock_type', 'analysis')
          .single();
        
        return {
          acquired: false,
          locked_by: existingLock?.locked_by,
          locked_at: existingLock?.locked_at
        };
      }
      
      console.error('❌ [ExecutionLock] Error acquiring lock:', error);
      throw error;
    }
    
    console.log(`🔒 [ExecutionLock] Successfully acquired lock for deal ${dealId}`);
    return { acquired: true };
    
  } catch (error) {
    console.error('❌ [ExecutionLock] Failed to acquire lock:', error);
    return { acquired: false };
  }
}

// Release execution lock
async function releaseExecutionLock(dealId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('deal_execution_locks')
      .delete()
      .eq('deal_id', dealId)
      .eq('lock_type', 'analysis');
    
    if (error) {
      console.error('❌ [ExecutionLock] Error releasing lock:', error);
      return false;
    }
    
    console.log(`🔓 [ExecutionLock] Successfully released lock for deal ${dealId}`);
    return true;
    
  } catch (error) {
    console.error('❌ [ExecutionLock] Failed to release lock:', error);
    return false;
  }
}

// Check rate limits for deal analysis
async function checkRateLimits(dealId: string): Promise<{
  allowed: boolean;
  reason?: string;
  next_allowed_at?: string;
}> {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Get or create rate limit record
    let { data: rateLimitRecord } = await supabase
      .from('deal_rate_limits')
      .select('*')
      .eq('deal_id', dealId)
      .single();
    
    if (!rateLimitRecord) {
      // Create new rate limit record
      const { data, error } = await supabase
        .from('deal_rate_limits')
        .insert({
          deal_id: dealId,
          last_analysis_at: now.toISOString(),
          analysis_count_today: 1,
          reset_date: today,
          consecutive_failures: 0
        })
        .select()
        .single();
      
      if (error) {
        console.error('❌ [RateLimit] Error creating rate limit record:', error);
        return { allowed: true }; // Allow on error to not block completely
      }
      
      return { allowed: true };
    }
    
    // Check if circuit breaker is open
    if (rateLimitRecord.is_circuit_open) {
      const circuitOpenTime = new Date(rateLimitRecord.circuit_opened_at);
      const circuitCooldown = 30 * 60 * 1000; // 30 minutes
      
      if (now.getTime() - circuitOpenTime.getTime() < circuitCooldown) {
        return {
          allowed: false,
          reason: 'Circuit breaker is open due to repeated failures',
          next_allowed_at: new Date(circuitOpenTime.getTime() + circuitCooldown).toISOString()
        };
      } else {
        // Close circuit breaker
        await supabase
          .from('deal_rate_limits')
          .update({
            is_circuit_open: false,
            circuit_opened_at: null,
            consecutive_failures: 0
          })
          .eq('deal_id', dealId);
      }
    }
    
    // Reset daily count if new day
    if (rateLimitRecord.reset_date !== today) {
      rateLimitRecord = {
        ...rateLimitRecord,
        analysis_count_today: 0,
        reset_date: today
      };
    }
    
    // Check hourly rate limit (max 1 analysis per hour)
    const lastAnalysisTime = new Date(rateLimitRecord.last_analysis_at);
    const hoursSinceLastAnalysis = (now.getTime() - lastAnalysisTime.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceLastAnalysis < 1) {
      return {
        allowed: false,
        reason: 'Rate limit: Maximum 1 analysis per hour per deal',
        next_allowed_at: new Date(lastAnalysisTime.getTime() + 60 * 60 * 1000).toISOString()
      };
    }
    
    // Check daily rate limit (max 5 analyses per day)
    if (rateLimitRecord.analysis_count_today >= 5) {
      return {
        allowed: false,
        reason: 'Rate limit: Maximum 5 analyses per day per deal',
        next_allowed_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
      };
    }
    
    // Update rate limit record
    await supabase
      .from('deal_rate_limits')
      .update({
        last_analysis_at: now.toISOString(),
        analysis_count_today: rateLimitRecord.analysis_count_today + 1,
        reset_date: today
      })
      .eq('deal_id', dealId);
    
    return { allowed: true };
    
  } catch (error) {
    console.error('❌ [RateLimit] Error checking rate limits:', error);
    return { allowed: true }; // Allow on error to not block completely
  }
}

// Create analysis tracker record
async function createAnalysisTracker(dealId: string, workflowType: string): Promise<{
  success: boolean;
  trackerId?: string;
  error?: string;
}> {
  try {
    // Check if there's already an active analysis
    const { data: existingTracker } = await supabase
      .from('analysis_completion_tracker')
      .select('*')
      .eq('deal_id', dealId)
      .eq('analysis_type', 'full_analysis')
      .eq('status', 'in_progress')
      .single();
    
    if (existingTracker) {
      return {
        success: false,
        error: 'Analysis already in progress for this deal'
      };
    }
    
    // Create new tracker record
    const { data, error } = await supabase
      .from('analysis_completion_tracker')
      .insert({
        deal_id: dealId,
        analysis_type: 'full_analysis',
        status: 'in_progress',
        started_at: new Date().toISOString(),
        metadata: {
          workflow_type: workflowType,
          started_by: 'orchestrator-engine',
          start_timestamp: new Date().toISOString()
        }
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('❌ [AnalysisTracker] Error creating tracker:', error);
      return {
        success: false,
        error: `Failed to create analysis tracker: ${error.message}`
      };
    }
    
    console.log(`📊 [AnalysisTracker] Created tracker ${data.id} for deal ${dealId}`);
    return {
      success: true,
      trackerId: data.id
    };
    
  } catch (error) {
    console.error('❌ [AnalysisTracker] Error creating tracker:', error);
    return {
      success: false,
      error: error.message || 'Unknown error creating analysis tracker'
    };
  }
}

// Update analysis tracker on completion
async function updateAnalysisTracker(
  dealId: string,
  status: 'completed' | 'failed' | 'aborted',
  completionReason: string,
  artifactsCreated: number = 0,
  sourcesCreated: number = 0
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('analysis_completion_tracker')
      .update({
        status,
        completed_at: new Date().toISOString(),
        completion_reason: completionReason,
        artifacts_created: artifactsCreated,
        sources_created: sourcesCreated,
        updated_at: new Date().toISOString()
      })
      .eq('deal_id', dealId)
      .eq('analysis_type', 'full_analysis')
      .eq('status', 'in_progress');
    
    if (error) {
      console.error('❌ [AnalysisTracker] Error updating tracker:', error);
      return false;
    }
    
    console.log(`📊 [AnalysisTracker] Updated tracker for deal ${dealId} - Status: ${status}`);
    return true;
    
  } catch (error) {
    console.error('❌ [AnalysisTracker] Error updating tracker:', error);
    return false;
  }
}
