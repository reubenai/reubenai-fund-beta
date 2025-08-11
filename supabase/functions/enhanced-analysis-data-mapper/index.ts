import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface EngineResult {
  score: number;
  analysis: string;
  data?: any;
}

interface OrchestratorAnalysis {
  executive_summary: string;
  overall_score: number;
  overall_recommendation: string;
  risk_factors: string[];
  next_steps: string[];
  engine_results: {
    [engineName: string]: EngineResult;
  };
  rubric_analysis?: any;
  fund_type_analysis?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dealId, orchestratorAnalysis }: { 
      dealId: string; 
      orchestratorAnalysis: OrchestratorAnalysis 
    } = await req.json();

    console.log('🔄 Enhanced Analysis Data Mapper: Processing deal:', dealId);
    console.log('📊 Engine results received:', Object.keys(orchestratorAnalysis?.engine_results || {}));

    if (!orchestratorAnalysis?.engine_results) {
      throw new Error('No engine results found in orchestrator analysis');
    }

    const { engine_results } = orchestratorAnalysis;

    // CRITICAL FIX: Extract real scores with fallbacks based on actual engine data
    const getEngineScore = (engineName: string, fallback: number = 0) => {
      const engine = engine_results[engineName];
      return engine?.score || fallback;
    };

    const getEngineData = (engineName: string) => {
      const engine = engine_results[engineName];
      return engine?.data && Object.keys(engine.data).length > 0 ? engine.data : null;
    };

    const getEngineAnalysis = (engineName: string, fallback: string) => {
      const engine = engine_results[engineName];
      return engine?.analysis || fallback;
    };

    // Map orchestrator results to enhanced_analysis structure
    const enhancedAnalysis = {
      // Executive summary
      executive_summary: orchestratorAnalysis.executive_summary || 'Comprehensive AI analysis completed',
      
      // Overall metrics
      overall_score: orchestratorAnalysis.overall_score || 0,
      overall_recommendation: orchestratorAnalysis.overall_recommendation || 'See detailed analysis',
      
      // FIXED: Complete 6-Category VC Rubric with REAL scores from engines
      rubric_breakdown: [
        {
          category: 'Market Opportunity',
          score: getEngineScore('market-research-engine') || getEngineScore('market-intelligence-engine') || 50,
          confidence: getEngineData('market-research-engine') || getEngineData('market-intelligence-engine') ? 90 : 50,
          weight: 16.67,
          insights: [getEngineAnalysis('market-research-engine', 'Market research analysis pending')],
          recommendations: ['Market timing assessment', 'Deal dynamics evaluation', 'Competitive landscape review'],
          strengths: getEngineData('market-research-engine') || getEngineData('market-intelligence-engine') 
            ? ['Market intelligence available', 'Data-driven analysis'] 
            : ['Market analysis in progress'],
          concerns: (getEngineScore('market-research-engine') || getEngineScore('market-intelligence-engine') || 50) < 50 
            ? ['Poor market alignment - requires attention'] : [],
          detailed_breakdown: getEngineData('market-research-engine') || getEngineData('market-intelligence-engine') || {}
        },
        {
          category: 'Product & Technology',
          score: getEngineScore('product-ip-engine', 65),
          confidence: getEngineData('product-ip-engine') ? 85 : 50,
          weight: 16.67,
          insights: [getEngineAnalysis('product-ip-engine', 'Product analysis pending')],
          recommendations: ['IP strategy review', 'Technical execution assessment', 'Innovation differentiation'],
          strengths: getEngineData('product-ip-engine') 
            ? ['Product analysis available', 'Technical assessment'] 
            : ['Product analysis in progress'],
          concerns: getEngineScore('product-ip-engine', 65) < 50 ? ['Product concerns identified'] : [],
          detailed_breakdown: getEngineData('product-ip-engine') || {}
        },
        {
          category: 'Team & Leadership',
          score: getEngineScore('team-research-engine', 65),
          confidence: getEngineData('team-research-engine') ? 80 : 50,
          weight: 16.67,
          insights: [getEngineAnalysis('team-research-engine', 'Team analysis pending')],
          recommendations: ['Founder quality assessment', 'Team composition review', 'Execution capability evaluation'],
          strengths: getEngineData('team-research-engine') 
            ? ['Team analysis available', 'Leadership assessment'] 
            : ['Team analysis in progress'],
          concerns: getEngineScore('team-research-engine', 65) < 50 ? ['Team concerns identified'] : [],
          detailed_breakdown: getEngineData('team-research-engine') || {}
        },
        {
          category: 'Financial & Traction',
          score: getEngineScore('financial-engine', 50),
          confidence: getEngineData('financial-engine') ? 85 : 50,
          weight: 16.67,
          insights: [getEngineAnalysis('financial-engine', 'Financial analysis pending')],
          recommendations: ['Unit economics review', 'Revenue growth assessment', 'Funding requirements evaluation'],
          strengths: getEngineData('financial-engine') 
            ? ['Financial analysis available', 'Traction metrics'] 
            : ['Financial analysis in progress'],
          concerns: getEngineScore('financial-engine', 50) < 50 ? ['Financial concerns identified'] : [],
          detailed_breakdown: getEngineData('financial-engine') || {}
        },
        {
          category: 'Trust & Transparency',
          score: getEngineScore('thesis-alignment-engine', 70),
          confidence: getEngineData('thesis-alignment-engine') ? 85 : 50,
          weight: 16.67,
          insights: [getEngineAnalysis('thesis-alignment-engine', 'Thesis alignment analysis pending')],
          recommendations: ['Governance assessment', 'Transparency review', 'Compliance evaluation'],
          strengths: getEngineData('thesis-alignment-engine') 
            ? ['Thesis alignment available', 'Strategic assessment'] 
            : ['Thesis analysis in progress'],
          concerns: getEngineScore('thesis-alignment-engine', 70) < 50 ? ['Alignment concerns identified'] : [],
          detailed_breakdown: getEngineData('thesis-alignment-engine') || {}
        },
        {
          category: 'Strategic Timing',
          score: Math.round((
            (getEngineScore('market-research-engine', 50)) * 0.4 +
            (getEngineScore('financial-engine', 50)) * 0.3 +
            (getEngineScore('thesis-alignment-engine', 70)) * 0.3
          )),
          confidence: Object.keys(engine_results).length > 2 ? 75 : 50,
          weight: 16.66,
          insights: ['Strategic timing assessment based on market, financial, and alignment factors'],
          recommendations: ['Market timing optimization', 'Investment timing strategy'],
          strengths: Object.keys(engine_results).length > 2 ? ['Multi-factor timing analysis'] : ['Basic timing assessment'],
          concerns: Object.keys(engine_results).length < 3 ? ['Limited timing data'] : [],
          detailed_breakdown: {
            market_timing_score: getEngineScore('market-research-engine', 50),
            financial_timing_score: getEngineScore('financial-engine', 50),
            strategic_alignment_score: getEngineScore('thesis-alignment-engine', 70)
          }
        }
      ],

      // FIXED: Deep dive sections with proper VC category names and real data
      detailed_breakdown: {
        'market_opportunity': getEngineData('market-research-engine') || getEngineData('market-intelligence-engine') || {
          tam_sam_som: { tam: 'Analysis pending', sam: 'Analysis pending', som: 'Analysis pending' },
          growth_drivers: ['Market expansion analysis pending'],
          market_risks: ['Competitive analysis pending'],
          competitive_positioning: ['Analysis in progress'],
          customer_validation: ['Customer research needed']
        },

        'product_technology': getEngineData('product-ip-engine') || {
          ip_portfolio: ['Patent analysis pending'],
          competitive_moats: ['Technology differentiation analysis pending'],
          technical_advantages: ['Technical analysis in progress'],
          development_roadmap: ['Roadmap analysis needed']
        },

        'team_leadership': getEngineData('team-research-engine') || {
          founder_profiles: ['Founder research in progress'],
          team_gaps: ['Team assessment pending'],
          execution_track_record: ['Track record analysis needed'],
          advisory_board_strength: ['Advisory board evaluation pending']
        },

        'financial_traction': getEngineData('financial-engine') || {
          revenue_stream_analysis: ['Revenue analysis pending'],
          unit_economics: { ltv_cac_ratio: 'Analysis pending', gross_margin: 'Analysis pending' },
          burn_rate_analysis: { monthly_burn: 'Analysis pending', runway: 'Analysis pending' },
          funding_scenarios: ['Funding scenario analysis needed']
        },

        'trust_transparency': getEngineData('thesis-alignment-engine') || {
          governance_structure: ['Governance assessment pending'],
          transparency_practices: ['Transparency review needed'],
          compliance_status: ['Compliance evaluation required']
        },

        'strategic_timing': {
          market_timing_factors: ['Market timing analysis based on current conditions'],
          investment_timing_rationale: ['Investment timing assessment'],
          exit_timing_considerations: ['Exit strategy timing evaluation']
        }
      },

      // FIXED: Analysis engines status with data-based confidence
      analysis_engines: Object.entries(engine_results).reduce((acc, [engineName, result]) => {
        const cleanName = engineName.replace(/-engine$/, '').replace(/-/g, ' ');
        const hasRealData = result.data && Object.keys(result.data).length > 0;
        acc[engineName] = {
          name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
          status: hasRealData ? 'complete' : 'partial',
          score: result.score || 0,
          last_updated: new Date().toISOString(),
          confidence: hasRealData ? 90 : 50,
          validation_status: hasRealData ? 'validated' : 'partial',
          analysis_data: result.data || {},
          analysis: result.analysis || 'Analysis pending'
        };
        return acc;
      }, {} as any),

      // FIXED: Notes intelligence
      notes_intelligence: orchestratorAnalysis.notes_intelligence || {
        sentiment: 'pending',
        key_insights: Object.keys(orchestratorAnalysis.engine_results || {}).length > 0 
          ? ['AI analysis engines completed', 'Comprehensive analysis available'] 
          : ['Analysis engines pending'],
        risk_flags: orchestratorAnalysis.risk_factors || [],
        trend_indicators: ['Analysis trend data pending'],
        confidence_level: Object.keys(orchestratorAnalysis.engine_results || {}).length > 0 ? 75 : 50,
        last_analyzed: new Date().toISOString()
      },

      // Fund type analysis
      fund_type_analysis: orchestratorAnalysis.fund_type_analysis || null,

      // FIXED: Analysis completeness
      analysis_completeness: (() => {
        const engineDataCount = Object.values(engine_results).filter(result => 
          result?.data && Object.keys(result.data).length > 0
        ).length;
        const totalEngines = Object.keys(engine_results).length;
        return totalEngines > 0 ? Math.round((engineDataCount / totalEngines) * 100) : 0;
      })(),
      
      last_comprehensive_analysis: new Date().toISOString(),
      
      // Metadata
      analysis_metadata: {
        analysis_date: new Date().toISOString(),
        analysis_version: '2.1',
        data_sources: Object.keys(engine_results),
        confidence_score: Math.round(
          Object.values(engine_results).reduce((sum, r) => sum + (r.score || 0), 0) / 
          Math.max(Object.keys(engine_results).length, 1)
        )
      }
    };

    console.log('📈 Final enhanced analysis summary:', {
      rubric_categories: enhancedAnalysis.rubric_breakdown.length,
      overall_score: enhancedAnalysis.overall_score,
      completeness: enhancedAnalysis.analysis_completeness,
      engines_processed: Object.keys(enhancedAnalysis.analysis_engines).length
    });

    // Store enhanced analysis in deals table and populate deal_analyses
    const { error: updateError } = await supabase
      .from('deals')
      .update({ 
        enhanced_analysis: enhancedAnalysis,
        overall_score: orchestratorAnalysis.overall_score,
        first_analysis_completed: true
      })
      .eq('id', dealId);

    // Also populate deal_analyses table with structured scores
    const { error: analysisError } = await supabase
      .from('deal_analyses')
      .upsert({
        deal_id: dealId,
        overall_score: orchestratorAnalysis.overall_score,
        thesis_alignment_score: getEngineScore('thesis-alignment-engine'),
        market_score: getEngineScore('market-research-engine') || getEngineScore('market-intelligence-engine'),
        product_score: getEngineScore('product-ip-engine'),
        financial_score: getEngineScore('financial-engine'),
        leadership_score: getEngineScore('team-research-engine'),
        traction_score: getEngineScore('market-intelligence-engine'),
        thesis_alignment_notes: getEngineAnalysis('thesis-alignment-engine', null),
        market_notes: getEngineAnalysis('market-research-engine', null) || getEngineAnalysis('market-intelligence-engine', null),
        product_notes: getEngineAnalysis('product-ip-engine', null),
        financial_notes: getEngineAnalysis('financial-engine', null),
        leadership_notes: getEngineAnalysis('team-research-engine', null),
        traction_notes: getEngineAnalysis('market-intelligence-engine', null),
        engine_results: engine_results,
        analyzed_at: new Date().toISOString()
      }, { 
        onConflict: 'deal_id' 
      });

    if (updateError) {
      console.error('❌ Failed to store enhanced analysis:', updateError);
      throw updateError;
    }

    if (analysisError) {
      console.error('❌ Failed to store deal analysis:', analysisError);
      // Don't throw - enhanced_analysis is more important
    }

    console.log('✅ Enhanced analysis mapped and stored for deal:', dealId);

    return new Response(JSON.stringify({
      success: true,
      dealId,
      enhancedAnalysis
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Enhanced Analysis Data Mapper error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});