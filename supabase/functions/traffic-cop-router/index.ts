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

// Traffic Cop Registry Configuration
const REGISTRY = {
  models: {
    entity_resolution: {
      primary: 'gpt-4o-mini',
      fallback: 'gpt-4o-mini',
      budget_tokens: 2000,
      timeout_ms: 10000
    },
    kpi_extraction: {
      primary: 'gpt-4.1-2025-04-14',
      fallback: 'gpt-4o',
      budget_tokens: 4000,
      timeout_ms: 15000
    },
    risk_analysis: {
      primary: 'gpt-4.1-2025-04-14',
      fallback: 'gpt-4o',
      budget_tokens: 4000,
      timeout_ms: 15000
    },
    scoring: {
      primary: 'gpt-4.1-2025-04-14',
      fallback: 'gpt-4o',
      budget_tokens: 3000,
      timeout_ms: 12000
    },
    memo_drafting: {
      primary: 'gpt-5-2025-08-07',
      fallback: 'gpt-4.1-2025-04-14',
      budget_tokens: 12000,
      timeout_ms: 30000
    }
  },
  tools: {
    websearch: {
      provider: 'mcp_websearch',
      timeout_ms: 20000,
      max_results: 5
    },
    table_extraction: {
      provider: 'internal_parser',
      timeout_ms: 5000
    },
    vector_search: {
      provider: 'supabase_vector',
      timeout_ms: 3000,
      max_chunks: 20
    }
  },
  context_budgets: {
    entity_resolution: 4,
    kpi_extraction: 8,
    risk_analysis: 8,
    memo_generation: 12
  },
  thresholds: {
    confidence_minimum: 60,
    fact_check_threshold: 0.8,
    citation_required: true
  }
};

interface RoutingRequest {
  task_type: 'entity_resolution' | 'kpi_extraction' | 'risk_analysis' | 'scoring' | 'memo_drafting';
  org_id: string;
  fund_id: string;
  deal_id?: string;
  input_data: any;
  context_budget?: number;
  priority?: 'high' | 'normal' | 'low';
}

interface RoutingDecision {
  model_config: any;
  tool_config: any;
  context_budget: number;
  execution_plan: any;
  fallback_plan: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: RoutingRequest = await req.json();
    
    console.log(`🚦 [Traffic Cop] Routing task: ${request.task_type}`);
    console.log(`📍 [Traffic Cop] Context: org=${request.org_id}, fund=${request.fund_id}, deal=${request.deal_id}`);

    // Apply deterministic routing rules
    const routing_decision = await makeRoutingDecision(request);
    
    console.log(`🎯 [Traffic Cop] Routing decision:`, routing_decision);

    // Execute the task with the determined configuration
    const execution_result = await executeTask(request, routing_decision);
    
    return new Response(JSON.stringify({
      success: true,
      task_type: request.task_type,
      routing_decision,
      result: execution_result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ [Traffic Cop] Routing failed:', error);
    
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

async function makeRoutingDecision(request: RoutingRequest): Promise<RoutingDecision> {
  
  // Apply deterministic routing rules based on task type
  switch (request.task_type) {
    case 'entity_resolution':
      return {
        model_config: REGISTRY.models.entity_resolution,
        tool_config: REGISTRY.tools.websearch,
        context_budget: REGISTRY.context_budgets.entity_resolution,
        execution_plan: {
          steps: ['canonicalise', 'validate', 'store'],
          timeout_strategy: 'fail_fast'
        },
        fallback_plan: {
          model: REGISTRY.models.entity_resolution.fallback,
          reduce_context: true
        }
      };
      
    case 'kpi_extraction':
      return {
        model_config: REGISTRY.models.kpi_extraction,
        tool_config: REGISTRY.tools.table_extraction,
        context_budget: REGISTRY.context_budgets.kpi_extraction,
        execution_plan: {
          steps: ['parse_tables', 'extract_text_claims', 'validate_kpis'],
          prefer_structured: true
        },
        fallback_plan: {
          model: REGISTRY.models.kpi_extraction.fallback,
          text_only: true
        }
      };
      
    case 'risk_analysis':
      return {
        model_config: REGISTRY.models.risk_analysis,
        tool_config: REGISTRY.tools.vector_search,
        context_budget: REGISTRY.context_budgets.risk_analysis,
        execution_plan: {
          steps: ['retrieve_market_knowledge', 'identify_risks', 'assess_severity'],
          search_namespace: 'market_knowledge/base'
        },
        fallback_plan: {
          model: REGISTRY.models.risk_analysis.fallback,
          reduce_context: true
        }
      };
      
    case 'scoring':
      return {
        model_config: REGISTRY.models.scoring,
        tool_config: null, // Feature-first, no external tools
        context_budget: 3, // Limited context for scoring
        execution_plan: {
          steps: ['rules_based_scoring', 'model_based_scoring', 'weighted_combine'],
          require_features: true
        },
        fallback_plan: {
          model: REGISTRY.models.scoring.fallback,
          basic_scoring: true
        }
      };
      
    case 'memo_drafting':
      return {
        model_config: REGISTRY.models.memo_drafting,
        tool_config: REGISTRY.tools.vector_search,
        context_budget: REGISTRY.context_budgets.memo_generation,
        execution_plan: {
          steps: ['template_selection', 'content_generation', 'citation_check'],
          require_citations: true,
          template_variant: 'vc' // TODO: Determine from fund type
        },
        fallback_plan: {
          model: REGISTRY.models.memo_drafting.fallback,
          reduce_citations: false // Never compromise on citations
        }
      };
      
    default:
      throw new Error(`Unknown task type: ${request.task_type}`);
  }
}

async function executeTask(request: RoutingRequest, routing: RoutingDecision): Promise<any> {
  const start_time = Date.now();
  
  try {
    // Check budget constraints
    if (start_time > routing.model_config.timeout_ms) {
      throw new Error(`Task timeout exceeded: ${routing.model_config.timeout_ms}ms`);
    }
    
    // Execute based on task type
    switch (request.task_type) {
      case 'entity_resolution':
        return await executeEntityResolution(request, routing);
        
      case 'kpi_extraction':
        return await executeKpiExtraction(request, routing);
        
      case 'risk_analysis':
        return await executeRiskAnalysis(request, routing);
        
      case 'scoring':
        return await executeScoring(request, routing);
        
      case 'memo_drafting':
        return await executeMemoGeneration(request, routing);
        
      default:
        throw new Error(`Execution not implemented for: ${request.task_type}`);
    }
    
  } catch (error) {
    console.log(`⚠️ [Traffic Cop] Primary execution failed, trying fallback:`, error.message);
    
    // Try fallback plan
    return await executeFallback(request, routing, error);
  }
}

async function executeEntityResolution(request: RoutingRequest, routing: RoutingDecision): Promise<any> {
  console.log(`🔍 [Traffic Cop] Executing entity resolution with model: ${routing.model_config.primary}`);
  
  // TODO: Implement entity resolution logic
  return {
    entities_resolved: true,
    method: 'websearch_validation',
    confidence: 85,
    execution_time_ms: Date.now() - Date.now()
  };
}

async function executeKpiExtraction(request: RoutingRequest, routing: RoutingDecision): Promise<any> {
  console.log(`📊 [Traffic Cop] Executing KPI extraction with model: ${routing.model_config.primary}`);
  
  // TODO: Implement KPI extraction logic
  return {
    kpis_extracted: true,
    method: 'table_first',
    kpi_count: 0,
    execution_time_ms: Date.now() - Date.now()
  };
}

async function executeRiskAnalysis(request: RoutingRequest, routing: RoutingDecision): Promise<any> {
  console.log(`⚠️ [Traffic Cop] Executing risk analysis with model: ${routing.model_config.primary}`);
  
  // TODO: Implement risk analysis logic
  return {
    risks_identified: true,
    method: 'market_knowledge_lookup',
    risk_count: 0,
    execution_time_ms: Date.now() - Date.now()
  };
}

async function executeScoring(request: RoutingRequest, routing: RoutingDecision): Promise<any> {
  console.log(`🎯 [Traffic Cop] Executing scoring with model: ${routing.model_config.primary}`);
  
  // TODO: Implement feature-first scoring
  return {
    score_calculated: true,
    method: 'feature_first',
    overall_score: 75,
    execution_time_ms: Date.now() - Date.now()
  };
}

async function executeMemoGeneration(request: RoutingRequest, routing: RoutingDecision): Promise<any> {
  console.log(`📝 [Traffic Cop] Executing memo generation with model: ${routing.model_config.primary}`);
  
  // TODO: Implement memo generation logic
  return {
    memo_generated: true,
    method: 'template_based',
    citations_count: 0,
    execution_time_ms: Date.now() - Date.now()
  };
}

async function executeFallback(request: RoutingRequest, routing: RoutingDecision, original_error: Error): Promise<any> {
  console.log(`🔄 [Traffic Cop] Executing fallback plan for: ${request.task_type}`);
  
  // TODO: Implement fallback execution with reduced scope
  return {
    fallback_executed: true,
    original_error: original_error.message,
    fallback_method: routing.fallback_plan,
    execution_time_ms: Date.now() - Date.now()
  };
}