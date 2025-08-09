import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface CITestResult {
  test_name: string;
  passed: boolean;
  details: any;
  execution_time_ms: number;
}

interface CITestSuite {
  overall_pass: boolean;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  test_results: CITestResult[];
  assertions: {
    schema_pass_100_percent: boolean;
    no_dangling_source_ids: boolean;
    min_3_dimensions_coverage: boolean;
    costs_under_caps: boolean;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🧪 Running CI Test Suite on Golden Fixtures...');
    
    // Load golden fixtures
    const fixtures = await loadGoldenFixtures();
    
    const testResults: CITestResult[] = [];
    let totalTests = 0;
    let passedTests = 0;
    
    // Run tests for each fixture
    for (const fixture of fixtures.test_deals) {
      totalTests++;
      const startTime = Date.now();
      
      const testResult = await runFixtureTest(fixture);
      testResult.execution_time_ms = Date.now() - startTime;
      
      if (testResult.passed) {
        passedTests++;
      }
      
      testResults.push(testResult);
    }
    
    // Run assertion checks
    const assertions = await runAssertionChecks(testResults);
    
    const ciSuite: CITestSuite = {
      overall_pass: passedTests === totalTests && Object.values(assertions).every(Boolean),
      total_tests: totalTests,
      passed_tests: passedTests,
      failed_tests: totalTests - passedTests,
      test_results: testResults,
      assertions
    };
    
    console.log(`✅ CI Test Suite completed: ${ciSuite.overall_pass ? 'PASS' : 'FAIL'}`);
    console.log(`📊 Results: ${passedTests}/${totalTests} tests passed`);
    
    return new Response(JSON.stringify(ciSuite), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ CI Test Suite Error:', error);
    return new Response(JSON.stringify({
      overall_pass: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function loadGoldenFixtures(): Promise<any> {
  // In a real CI environment, this would load from the file system
  // For this implementation, we'll return the fixture data directly
  return {
    test_deals: [
      {
        scenario: "high_scoring_vc_deal",
        deal_data: {
          company_name: "NeuralFlow AI",
          industry: "Artificial Intelligence",
          description: "Advanced neural network optimization platform",
          fund_type: "vc"
        },
        expected_scores: {
          overall_score: 85,
          thesis_alignment_score: 90
        }
      },
      {
        scenario: "schema_fail_missing_analysis",
        deal_data: {
          company_name: "Incomplete Startup",
          industry: "Technology"
        },
        expected_result: "schema_error"
      },
      {
        scenario: "evidence_block_insufficient_domains",
        deal_data: {
          company_name: "Single Source Corp",
          industry: "Software"
        },
        expected_result: "evidence_block"
      }
    ]
  };
}

async function runFixtureTest(fixture: any): Promise<CITestResult> {
  const testName = fixture.scenario;
  
  try {
    console.log(`🔬 Testing fixture: ${testName}`);
    
    // Create test deal
    const { data: dealData, error: dealError } = await supabase
      .from('deals')
      .insert({
        ...fixture.deal_data,
        fund_id: '00000000-0000-0000-0000-000000000000', // Test fund ID
        created_by: '00000000-0000-0000-0000-000000000000' // Test user ID
      })
      .select()
      .single();

    if (dealError) {
      throw new Error(`Failed to create test deal: ${dealError.message}`);
    }

    // Run the pipeline on the test deal
    const pipelineResult = await runTestPipeline(dealData.id, fixture);
    
    // Validate results against expectations
    const validationResult = validateTestResult(pipelineResult, fixture);
    
    // Cleanup test deal
    await supabase.from('deals').delete().eq('id', dealData.id);
    
    return {
      test_name: testName,
      passed: validationResult.passed,
      details: {
        pipeline_result: pipelineResult,
        validation: validationResult,
        fixture_expectations: fixture.expected_result || fixture.expected_scores
      },
      execution_time_ms: 0 // Will be set by caller
    };

  } catch (error) {
    return {
      test_name: testName,
      passed: false,
      details: { error: error.message },
      execution_time_ms: 0
    };
  }
}

async function runTestPipeline(dealId: string, fixture: any): Promise<any> {
  const results: any = {
    schema_validation: null,
    evidence_integrity: null,
    cost_tracking: null,
    analysis_output: null
  };

  try {
    // 1. Test Schema Validation
    const { data: schemaResult } = await supabase.functions.invoke('queue-schema-validator', {
      body: {
        engine_name: 'enhanced-deal-analysis',
        engine_version: 'v1.0',
        payload: fixture.expected_result === 'schema_error' ? {} : generateValidAnalysisPayload(),
        deal_id: dealId,
        fund_id: '00000000-0000-0000-0000-000000000000'
      }
    });
    results.schema_validation = schemaResult;

    // 2. Test Evidence Integrity (if schema passed)
    if (schemaResult?.valid) {
      const { data: evidenceResult } = await supabase.functions.invoke('evidence-integrity-gate', {
        body: {
          deal_id: dealId,
          fund_id: '00000000-0000-0000-0000-000000000000',
          evidence_data: fixture.evidence_sources || []
        }
      });
      results.evidence_integrity = evidenceResult;
    }

    // 3. Test Cost Tracking
    const { data: costResult } = await supabase.functions.invoke('llm-control-plane', {
      body: {
        model_id: 'gpt-4o-mini',
        model_version: 'v1.0',
        temperature: 0.7,
        top_p: 0.9,
        prompt: 'Test prompt',
        content: 'Test content',
        deal_id: dealId,
        fund_id: '00000000-0000-0000-0000-000000000000',
        agent_name: 'test-agent',
        execution_id: `test-${Date.now()}`
      }
    });
    results.cost_tracking = costResult;

  } catch (error) {
    results.error = error.message;
  }

  return results;
}

function generateValidAnalysisPayload(): any {
  return {
    executive_summary: "Test executive summary with sufficient length to meet validation requirements for the schema validation process.",
    investment_thesis_alignment: {
      score: 85,
      analysis: "Strong alignment with investment thesis based on comprehensive analysis of market position and strategic fit.",
      key_points: ["Strong market position", "Experienced team", "Scalable technology"]
    },
    market_attractiveness: {
      score: 80,
      analysis: "Large addressable market with strong growth potential and favorable competitive dynamics."
    },
    product_strength_ip: {
      score: 75,
      analysis: "Solid product offering with competitive differentiation and intellectual property protection."
    },
    financial_feasibility: {
      score: 70,
      analysis: "Reasonable financial projections with clear path to profitability and sustainable unit economics."
    },
    team_leadership: {
      score: 85,
      analysis: "Experienced leadership team with relevant industry background and successful track record."
    },
    business_traction: {
      score: 78,
      analysis: "Strong early traction indicators with growing customer base and positive market feedback."
    }
  };
}

function validateTestResult(pipelineResult: any, fixture: any): { passed: boolean; details: any } {
  const validations: any = {
    schema_check: false,
    evidence_check: false,
    cost_check: false,
    expectation_match: false
  };

  try {
    // Validate schema handling
    if (fixture.expected_result === 'schema_error') {
      validations.schema_check = !pipelineResult.schema_validation?.valid;
    } else {
      validations.schema_check = pipelineResult.schema_validation?.valid === true;
    }

    // Validate evidence handling
    if (fixture.expected_result === 'evidence_block') {
      validations.evidence_check = pipelineResult.evidence_integrity?.integrity_check === 'fail';
    } else if (pipelineResult.evidence_integrity) {
      validations.evidence_check = pipelineResult.evidence_integrity?.integrity_check === 'pass';
    } else {
      validations.evidence_check = true; // No evidence check needed
    }

    // Validate cost handling
    if (fixture.expected_result === 'degradation_mode') {
      validations.cost_check = pipelineResult.cost_tracking?.degradation_mode === true;
    } else {
      validations.cost_check = !pipelineResult.cost_tracking?.degradation_mode;
    }

    // Overall expectation match
    validations.expectation_match = validations.schema_check && validations.evidence_check && validations.cost_check;

  } catch (error) {
    validations.error = error.message;
  }

  return {
    passed: validations.expectation_match === true,
    details: validations
  };
}

async function runAssertionChecks(testResults: CITestResult[]): Promise<any> {
  const assertions = {
    schema_pass_100_percent: false,
    no_dangling_source_ids: false,
    min_3_dimensions_coverage: false,
    costs_under_caps: false
  };

  try {
    // 1. Assert Schema pass = 100% (for valid fixtures)
    const validFixtures = testResults.filter(r => !r.test_name.includes('schema_fail'));
    const schemaPassRate = validFixtures.every(r => 
      r.details?.pipeline_result?.schema_validation?.valid === true
    );
    assertions.schema_pass_100_percent = schemaPassRate;

    // 2. Assert no dangling source_ids
    const { data: danglingIds } = await supabase
      .from('deal_analysis_sources')
      .select('id')
      .not('deal_id', 'in', `(SELECT id FROM deals)`);
    assertions.no_dangling_source_ids = !danglingIds || danglingIds.length === 0;

    // 3. Assert ≥3 dimensions have coverage >0
    const dimensionsCovered = testResults.filter(r => {
      const analysis = r.details?.pipeline_result?.analysis_output;
      if (!analysis) return false;
      
      const dimensions = [
        analysis.investment_thesis_alignment?.score || 0,
        analysis.market_attractiveness?.score || 0,
        analysis.product_strength_ip?.score || 0,
        analysis.financial_feasibility?.score || 0,
        analysis.team_leadership?.score || 0,
        analysis.business_traction?.score || 0
      ];
      
      return dimensions.filter(score => score > 0).length >= 3;
    });
    assertions.min_3_dimensions_coverage = dimensionsCovered.length >= 3;

    // 4. Assert costs < caps
    const costsUnderCaps = testResults.every(r => {
      const cost = r.details?.pipeline_result?.cost_tracking?.cost_info?.current_cost || 0;
      return cost < 25.00; // $25 per deal cap
    });
    assertions.costs_under_caps = costsUnderCaps;

  } catch (error) {
    console.error('Assertion check error:', error);
  }

  return assertions;
}