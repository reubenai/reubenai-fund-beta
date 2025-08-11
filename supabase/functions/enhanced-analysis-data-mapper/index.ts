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

    if (!orchestratorAnalysis?.engine_results) {
      throw new Error('No engine results found in orchestrator analysis');
    }

    const { engine_results } = orchestratorAnalysis;

    // Map orchestrator results to enhanced_analysis structure
    const enhancedAnalysis = {
      // Executive summary
      executive_summary: orchestratorAnalysis.executive_summary || 'Comprehensive AI analysis completed',
      
      // Overall metrics
      overall_score: orchestratorAnalysis.overall_score || 0,
      overall_recommendation: orchestratorAnalysis.overall_recommendation || 'See detailed analysis',
      
      // CORRECTED: Complete 6-Category VC Rubric (each ~16.67% weight)
      rubric_breakdown: [
        {
          category: 'Market Opportunity',
          score: engine_results.market_research_engine?.score || engine_results.market_intelligence_engine?.score || 50,
          confidence: (engine_results.market_research_engine?.data || engine_results.market_intelligence_engine?.data) ? 90 : 50,
          weight: 16.67, // 6 categories for complete VC analysis
          insights: Array.isArray(engine_results.market_research_engine?.analysis || engine_results.market_intelligence_engine?.analysis) 
            ? (engine_results.market_research_engine?.analysis || engine_results.market_intelligence_engine?.analysis)
            : [engine_results.market_research_engine?.analysis || engine_results.market_intelligence_engine?.analysis || 'Market analysis pending'],
          recommendations: ['Market timing assessment', 'Deal dynamics evaluation', 'Competitive landscape review', 'Customer validation'],
          strengths: (engine_results.market_research_engine?.data || engine_results.market_intelligence_engine?.data) ? ['Market intelligence available', 'Data-driven analysis'] : ['Analysis scheduled'],
          concerns: ((engine_results.market_research_engine?.score || engine_results.market_intelligence_engine?.score) || 50) < 50 ? ['Market concerns identified'] : [],
          detailed_breakdown: engine_results.market_research_engine?.data || engine_results.market_intelligence_engine?.data || {}
        },
        {
          category: 'Product & Technology',
          score: engine_results.product_ip_engine?.score || 65,
          confidence: engine_results.product_ip_engine?.data ? 85 : 50,
          weight: 16.67,
          insights: Array.isArray(engine_results.product_ip_engine?.analysis) 
            ? engine_results.product_ip_engine.analysis 
            : [engine_results.product_ip_engine?.analysis || 'Product analysis pending'],
          recommendations: ['IP strategy review', 'Technical execution assessment', 'Innovation differentiation'],
          strengths: engine_results.product_ip_engine?.data ? ['Product analysis available', 'Technical assessment'] : ['Analysis scheduled'],
          concerns: (engine_results.product_ip_engine?.score || 65) < 50 ? ['Product concerns identified'] : [],
          detailed_breakdown: engine_results.product_ip_engine?.data || {}
        },
        {
          category: 'Team & Leadership',
          score: engine_results.team_research_engine?.score || 65,
          confidence: engine_results.team_research_engine?.data ? 80 : 50,
          weight: 16.67,
          insights: Array.isArray(engine_results.team_research_engine?.analysis) 
            ? engine_results.team_research_engine.analysis 
            : [engine_results.team_research_engine?.analysis || 'Team analysis pending'],
          recommendations: ['Founder quality assessment', 'Team composition review', 'Execution capability evaluation'],
          strengths: engine_results.team_research_engine?.data ? ['Team analysis available', 'Leadership assessment'] : ['Analysis scheduled'],
          concerns: (engine_results.team_research_engine?.score || 65) < 50 ? ['Team concerns identified'] : [],
          detailed_breakdown: engine_results.team_research_engine?.data || {}
        },
        {
          category: 'Financial & Traction',
          score: engine_results.financial_engine?.score || 50,
          confidence: engine_results.financial_engine?.data ? 85 : 50,
          weight: 16.67,
          insights: Array.isArray(engine_results.financial_engine?.analysis) 
            ? engine_results.financial_engine.analysis 
            : [engine_results.financial_engine?.analysis || 'Financial analysis pending'],
          recommendations: ['Unit economics review', 'Revenue growth assessment', 'Funding requirements evaluation'],
          strengths: engine_results.financial_engine?.data ? ['Financial analysis available', 'Traction metrics'] : ['Analysis scheduled'],
          concerns: (engine_results.financial_engine?.score || 50) < 50 ? ['Financial concerns identified'] : [],
          detailed_breakdown: engine_results.financial_engine?.data || {}
        },
        {
          category: 'Trust & Transparency',
          score: engine_results.thesis_alignment_engine?.score || 70,
          confidence: engine_results.thesis_alignment_engine?.data ? 85 : 50,
          weight: 16.67,
          insights: Array.isArray(engine_results.thesis_alignment_engine?.analysis) 
            ? engine_results.thesis_alignment_engine.analysis 
            : [engine_results.thesis_alignment_engine?.analysis || 'Thesis alignment analysis pending'],
          recommendations: ['Governance assessment', 'Transparency review', 'Compliance evaluation'],
          strengths: engine_results.thesis_alignment_engine?.data ? ['Thesis alignment available', 'Strategic assessment'] : ['Analysis scheduled'],
          concerns: (engine_results.thesis_alignment_engine?.score || 70) < 50 ? ['Alignment concerns identified'] : [],
          detailed_breakdown: engine_results.thesis_alignment_engine?.data || {}
        },
        {
          category: 'Strategic Timing',
          score: Math.round((
            (engine_results.market_research_engine?.score || 50) * 0.4 +
            (engine_results.financial_engine?.score || 50) * 0.3 +
            (engine_results.thesis_alignment_engine?.score || 70) * 0.3
          )),
          confidence: Object.keys(engine_results).length > 2 ? 75 : 50,
          weight: 16.66, // Slight adjustment for 100% total
          insights: ['Strategic timing assessment based on market, financial, and alignment factors'],
          recommendations: ['Market timing optimization', 'Investment timing strategy', 'Exit planning consideration'],
          strengths: Object.keys(engine_results).length > 2 ? ['Multi-factor timing analysis'] : ['Basic timing assessment'],
          concerns: Object.keys(engine_results).length < 3 ? ['Limited timing data'] : [],
          detailed_breakdown: {
            market_timing_score: engine_results.market_research_engine?.score || 50,
            financial_timing_score: engine_results.financial_engine?.score || 50,
            strategic_alignment_score: engine_results.thesis_alignment_engine?.score || 70,
            timing_recommendation: 'Based on comprehensive analysis'
          }
        }
      ],

      // CORRECTED: Deep dive sections with proper VC category names
      detailed_breakdown: {
        'market_opportunity': engine_results.market_research_engine?.data || engine_results.market_intelligence_engine?.data || {
          tam_sam_som: {
            tam: '$1B+',
            sam: '$100M+', 
            som: '$10M+'
          },
          growth_drivers: ['Market expansion opportunities'],
          market_risks: ['Competitive pressure'],
          competitive_positioning: ['Analysis in progress'],
          customer_validation: ['Customer research needed'],
          geographic_opportunities: ['Geographic expansion potential'],
          deal_dynamics: ['Market timing considerations', 'Competitive dynamics'],
          trust_transparency: ['Governance assessment', 'Compliance review']
        },

        'product_technology': engine_results.product_ip_engine?.data || {
          ip_portfolio: ['Patent analysis pending'],
          competitive_moats: ['Technology differentiation'],
          technical_advantages: ['Technical analysis in progress'],
          development_roadmap: ['Roadmap analysis needed'],
          innovation_score: 'TBD'
        },

        'team_leadership': engine_results.team_research_engine?.data || {
          founder_profiles: ['Founder research in progress'],
          team_gaps: ['Team assessment pending'],
          execution_track_record: ['Track record analysis needed'],
          advisory_board_strength: ['Advisory board evaluation'],
          founder_quality: 'TBD'
        },

        'financial_traction': engine_results.financial_engine?.data || {
          revenue_stream_analysis: ['Revenue analysis pending'],
          unit_economics: { ltv_cac_ratio: 'TBD', gross_margin: 'TBD' },
          burn_rate_analysis: { monthly_burn: 'TBD', runway: 'TBD' },
          funding_scenarios: ['Funding scenario analysis needed'],
          customer_metrics: 'TBD'
        },

        'trust_transparency': engine_results.thesis_alignment_engine?.data || {
          governance_structure: ['Governance assessment pending'],
          transparency_practices: ['Transparency review needed'],
          compliance_status: ['Compliance evaluation required'],
          stakeholder_management: ['Stakeholder analysis pending']
        },

        'strategic_timing': {
          market_timing_factors: ['Market timing analysis based on current conditions'],
          investment_timing_rationale: ['Investment timing assessment'],
          exit_timing_considerations: ['Exit strategy timing evaluation'],
          overall_timing_score: Math.round((
            (engine_results.market_research_engine?.score || 50) * 0.4 +
            (engine_results.financial_engine?.score || 50) * 0.3 +
            (engine_results.thesis_alignment_engine?.score || 70) * 0.3
          ))
        }
      },

      // CORRECTED: Analysis engines status with data-based confidence and validation
      analysis_engines: Object.entries(engine_results).reduce((acc, [engineName, result]) => {
        const cleanName = engineName.replace(/_engine$/, '').replace(/_/g, ' ');
        const hasRealData = result.data && Object.keys(result.data).length > 0;
        acc[engineName] = {
          name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
          status: hasRealData ? 'complete' : 'partial',
          score: result.score || 0,
          last_updated: new Date().toISOString(),
          confidence: hasRealData ? 90 : 50, // Data-based confidence
          validation_status: hasRealData ? 'validated' : 'partial',
          analysis_data: result.data || {},
          analysis: result.analysis || 'Analysis pending'
        };
        return acc;
      }, {} as any),

      // CORRECTED: Notes intelligence with proper structure
      notes_intelligence: orchestratorAnalysis.notes_intelligence || {
        sentiment: 'pending',
        key_insights: orchestratorAnalysis.engine_results ? ['AI analysis engines completed', 'Comprehensive analysis available'] : ['Analysis engines pending'],
        risk_flags: orchestratorAnalysis.risk_factors || [],
        trend_indicators: ['Analysis trend data pending'],
        confidence_level: Object.keys(orchestratorAnalysis.engine_results || {}).length > 0 ? 75 : 50,
        last_analyzed: new Date().toISOString()
      },

      // Fund type analysis
      fund_type_analysis: orchestratorAnalysis.fund_type_analysis || null,

      // CORRECTED: Analysis completeness and metadata
      analysis_completeness: (() => {
        const engineDataCount = Object.values(engine_results).filter(result => result?.data && Object.keys(result.data).length > 0).length;
        const totalEngines = Object.keys(engine_results).length;
        return totalEngines > 0 ? Math.round((engineDataCount / totalEngines) * 100) : 0;
      })(),
      
      last_comprehensive_analysis: new Date().toISOString(),
      
      // Metadata
      analysis_metadata: {
        analysis_date: new Date().toISOString(),
        analysis_version: '2.0',
        data_sources: Object.keys(engine_results),
        confidence_score: Math.round(
          Object.values(engine_results).reduce((sum, r) => sum + (r.score || 0), 0) / 
          Math.max(Object.keys(engine_results).length, 1)
        )
      }
    };

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
        thesis_alignment_score: engine_results.thesis_alignment_engine?.score || null,
        market_score: engine_results.market_research_engine?.score || null,
        product_score: engine_results.product_ip_engine?.score || null,
        financial_score: engine_results.financial_engine?.score || null,
        leadership_score: engine_results.team_research_engine?.score || null,
        traction_score: engine_results.market_intelligence_engine?.score || null,
        thesis_alignment_notes: engine_results.thesis_alignment_engine?.analysis || null,
        market_notes: engine_results.market_research_engine?.analysis || null,
        product_notes: engine_results.product_ip_engine?.analysis || null,
        financial_notes: engine_results.financial_engine?.analysis || null,
        leadership_notes: engine_results.team_research_engine?.analysis || null,
        traction_notes: engine_results.market_intelligence_engine?.analysis || null,
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