import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface HardGateCheck {
  check_name: string;
  pass: boolean;
  details?: any;
}

interface HardGateResponse {
  overall: "pass" | "fail";
  checks: HardGateCheck[];
  timestamp: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 Production Readiness Orchestrator: Running hard-gate checks...');
    
    const checks: HardGateCheck[] = [];
    let allPassed = true;

    // 1. Fund Memory Engine Check
    const fundMemoryCheck = await validateFundMemoryEngine();
    checks.push(fundMemoryCheck);
    if (!fundMemoryCheck.pass) allPassed = false;

    // 2. Rubric Loader Check
    const rubricCheck = await validateRubricLoader();
    checks.push(rubricCheck);
    if (!rubricCheck.pass) allPassed = false;

    // 3. Evidence Service Check
    const evidenceCheck = await validateEvidenceService();
    checks.push(evidenceCheck);
    if (!evidenceCheck.pass) allPassed = false;

    // 4. LLM Limiter Check
    const llmLimiterCheck = await validateLLMLimiter();
    checks.push(llmLimiterCheck);
    if (!llmLimiterCheck.pass) allPassed = false;

    // 5. Cost Guardrails Check
    const costGuardrailsCheck = await validateCostGuardrails();
    checks.push(costGuardrailsCheck);
    if (!costGuardrailsCheck.pass) allPassed = false;

    // 6. JSON Schemas Check
    const schemasCheck = await validateJSONSchemas();
    checks.push(schemasCheck);
    if (!schemasCheck.pass) allPassed = false;

    const response: HardGateResponse = {
      overall: allPassed ? "pass" : "fail",
      checks,
      timestamp: new Date().toISOString()
    };

    console.log(`✅ Hard-gate check completed: ${response.overall}`);
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Hard-gate check failed:', error);
    return new Response(JSON.stringify({
      overall: "fail",
      checks: [{
        check_name: "system_error",
        pass: false,
        details: { error: error.message }
      }],
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function validateFundMemoryEngine(): Promise<HardGateCheck> {
  try {
    console.log('🧠 Checking Fund Memory Engine...');
    
    const { data, error } = await supabase.functions.invoke('enhanced-fund-memory-engine', {
      body: { 
        test: true,
        fund_id: '00000000-0000-0000-0000-000000000000' // Test UUID
      }
    });

    if (error) {
      return {
        check_name: "fund_memory_engine",
        pass: false,
        details: { error: error.message }
      };
    }

    // Check if returns valid JSON object with required keys
    const requiredKeys = ['insights', 'patterns', 'recommendations'];
    const hasRequiredKeys = requiredKeys.every(key => 
      data && typeof data === 'object' && key in data
    );

    return {
      check_name: "fund_memory_engine",
      pass: hasRequiredKeys,
      details: { 
        returned_keys: data ? Object.keys(data) : [],
        required_keys: requiredKeys
      }
    };

  } catch (error) {
    return {
      check_name: "fund_memory_engine",
      pass: false,
      details: { error: error.message }
    };
  }
}

async function validateRubricLoader(): Promise<HardGateCheck> {
  try {
    console.log('📊 Checking Rubric Loader...');
    
    // Check for both VC and PE rubrics in investment strategies
    const { data: vcRubrics, error: vcError } = await supabase
      .from('investment_strategies')
      .select('enhanced_criteria')
      .eq('fund_type', 'vc')
      .limit(1);

    const { data: peRubrics, error: peError } = await supabase
      .from('investment_strategies')
      .select('enhanced_criteria')
      .eq('fund_type', 'pe')
      .limit(1);

    if (vcError || peError) {
      return {
        check_name: "rubric_loader",
        pass: false,
        details: { 
          vc_error: vcError?.message,
          pe_error: peError?.message
        }
      };
    }

    // Check category weights sum to exactly 100
    let totalVcWeights = 0;
    let totalPeWeights = 0;

    if (vcRubrics?.[0]?.enhanced_criteria?.categories) {
      totalVcWeights = vcRubrics[0].enhanced_criteria.categories
        .reduce((sum: number, cat: any) => sum + (cat.weight || 0), 0);
    }

    if (peRubrics?.[0]?.enhanced_criteria?.categories) {
      totalPeWeights = peRubrics[0].enhanced_criteria.categories
        .reduce((sum: number, cat: any) => sum + (cat.weight || 0), 0);
    }

    const weightsValid = totalVcWeights === 100 && totalPeWeights === 100;

    return {
      check_name: "rubric_loader",
      pass: weightsValid && vcRubrics?.length > 0 && peRubrics?.length > 0,
      details: {
        vc_weight_sum: totalVcWeights,
        pe_weight_sum: totalPeWeights,
        vc_rubrics_found: vcRubrics?.length || 0,
        pe_rubrics_found: peRubrics?.length || 0
      }
    };

  } catch (error) {
    return {
      check_name: "rubric_loader",
      pass: false,
      details: { error: error.message }
    };
  }
}

async function validateEvidenceService(): Promise<HardGateCheck> {
  try {
    console.log('📋 Checking Evidence Service...');
    
    // Check deal_analysis_sources table for unique source_ids
    const { data: sources, error } = await supabase
      .from('deal_analysis_sources')
      .select('source_url, id')
      .limit(10);

    if (error) {
      return {
        check_name: "evidence_service",
        pass: false,
        details: { error: error.message }
      };
    }

    // Check for unique source_id values and no nulls
    const sourceIds = sources?.map(s => s.id) || [];
    const uniqueSourceIds = new Set(sourceIds);
    const hasNulls = sourceIds.some(id => id === null || id === undefined);

    return {
      check_name: "evidence_service",
      pass: !hasNulls && sourceIds.length === uniqueSourceIds.size,
      details: {
        total_sources: sourceIds.length,
        unique_sources: uniqueSourceIds.size,
        has_nulls: hasNulls
      }
    };

  } catch (error) {
    return {
      check_name: "evidence_service",
      pass: false,
      details: { error: error.message }
    };
  }
}

async function validateLLMLimiter(): Promise<HardGateCheck> {
  try {
    console.log('🤖 Checking LLM Limiter...');
    
    const { data, error } = await supabase.functions.invoke('cost-guard', {
      body: {
        agent_name: 'enhanced-deal-analysis',
        execution_id: '00000000-0000-0000-0000-000000000000',
        test: true
      }
    });

    if (error) {
      return {
        check_name: "llm_limiter",
        pass: false,
        details: { error: error.message }
      };
    }

    // Check if returns budget details
    const hasBudgetDetails = data && 
      typeof data === 'object' && 
      ('limits' in data || 'usage' in data || 'allowed' in data);

    return {
      check_name: "llm_limiter",
      pass: hasBudgetDetails,
      details: { 
        returned_fields: data ? Object.keys(data) : [],
        has_budget_info: hasBudgetDetails
      }
    };

  } catch (error) {
    return {
      check_name: "llm_limiter",
      pass: false,
      details: { error: error.message }
    };
  }
}

async function validateCostGuardrails(): Promise<HardGateCheck> {
  try {
    console.log('💰 Checking Cost Guardrails...');
    
    // Check ops_control_switches for cost limits
    const { data: switches, error } = await supabase
      .from('ops_control_switches')
      .select('config')
      .eq('enabled', true)
      .limit(5);

    if (error) {
      return {
        check_name: "cost_guardrails",
        pass: false,
        details: { error: error.message }
      };
    }

    // Check if cost limits are configured and > 0
    let hasValidCostLimits = false;
    if (switches && switches.length > 0) {
      hasValidCostLimits = switches.some(s => {
        const config = s.config;
        return config && 
          config.max_cost_per_deal > 0 && 
          config.max_cost_per_minute > 0;
      });
    }

    return {
      check_name: "cost_guardrails",
      pass: hasValidCostLimits,
      details: {
        switches_found: switches?.length || 0,
        valid_cost_limits: hasValidCostLimits
      }
    };

  } catch (error) {
    return {
      check_name: "cost_guardrails",
      pass: false,
      details: { error: error.message }
    };
  }
}

async function validateJSONSchemas(): Promise<HardGateCheck> {
  try {
    console.log('📄 Checking JSON Schemas...');
    
    // Define required schemas for engine outputs
    const requiredSchemas = [
      'enhanced-deal-analysis',
      'market-intelligence-engine',
      'financial-engine',
      'team-research-engine',
      'thesis-alignment-engine'
    ];

    const schemaChecks = await Promise.all(
      requiredSchemas.map(async (schema) => {
        try {
          // Check if engine functions exist and respond
          const { data, error } = await supabase.functions.invoke(schema, {
            body: { test: true, schema_check: true }
          });
          
          return {
            schema: schema,
            present: !error,
            version_pinned: data && data.version ? true : false
          };
        } catch {
          return {
            schema: schema,
            present: false,
            version_pinned: false
          };
        }
      })
    );

    const allSchemasPresent = schemaChecks.every(check => check.present);

    return {
      check_name: "json_schemas",
      pass: allSchemasPresent,
      details: {
        required_schemas: requiredSchemas,
        schema_checks: schemaChecks
      }
    };

  } catch (error) {
    return {
      check_name: "json_schemas",
      pass: false,
      details: { error: error.message }
    };
  }
}