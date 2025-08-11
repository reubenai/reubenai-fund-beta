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
      
      // Unified rubric breakdown with 5 categories (20% weight each = 100%)
      rubric_breakdown: [
        {
          category: 'Market Attractiveness',
          score: engine_results.market_research_engine?.score || engine_results.market_intelligence_engine?.score || 50,
          confidence: 90,
          weight: 20, // 20% weight
          insights: Array.isArray(engine_results.market_research_engine?.analysis || engine_results.market_intelligence_engine?.analysis) 
            ? (engine_results.market_research_engine?.analysis || engine_results.market_intelligence_engine?.analysis)
            : [engine_results.market_research_engine?.analysis || engine_results.market_intelligence_engine?.analysis || 'Market analysis completed'],
          recommendations: ['See detailed market analysis'],
          strengths: ['Market analysis available'],
          concerns: ((engine_results.market_research_engine?.score || engine_results.market_intelligence_engine?.score) || 50) < 50 ? ['Market concerns identified'] : [],
          detailed_breakdown: engine_results.market_research_engine?.data || engine_results.market_intelligence_engine?.data || {}
        },
        {
          category: 'Product Strength & IP',
          score: engine_results.product_ip_engine?.score || 65,
          confidence: 85,
          weight: 20, // 20% weight
          insights: Array.isArray(engine_results.product_ip_engine?.analysis) 
            ? engine_results.product_ip_engine.analysis 
            : [engine_results.product_ip_engine?.analysis || 'Product analysis completed'],
          recommendations: ['See detailed product analysis'],
          strengths: ['Product analysis available'],
          concerns: (engine_results.product_ip_engine?.score || 65) < 50 ? ['Product concerns identified'] : [],
          detailed_breakdown: engine_results.product_ip_engine?.data || {}
        },
        {
          category: 'Founder Team Strength',
          score: engine_results.team_research_engine?.score || 65,
          confidence: 80,
          weight: 20, // 20% weight
          insights: Array.isArray(engine_results.team_research_engine?.analysis) 
            ? engine_results.team_research_engine.analysis 
            : [engine_results.team_research_engine?.analysis || 'Team analysis completed'],
          recommendations: ['See detailed team analysis'],
          strengths: ['Team analysis available'],
          concerns: (engine_results.team_research_engine?.score || 65) < 50 ? ['Team concerns identified'] : [],
          detailed_breakdown: engine_results.team_research_engine?.data || {}
        },
        {
          category: 'Financial Feasibility',
          score: engine_results.financial_engine?.score || 50,
          confidence: 85,
          weight: 20, // 20% weight
          insights: Array.isArray(engine_results.financial_engine?.analysis) 
            ? engine_results.financial_engine.analysis 
            : [engine_results.financial_engine?.analysis || 'Financial analysis completed'],
          recommendations: ['See detailed financial analysis'],
          strengths: ['Financial analysis available'],
          concerns: (engine_results.financial_engine?.score || 50) < 50 ? ['Financial concerns identified'] : [],
          detailed_breakdown: engine_results.financial_engine?.data || {}
        },
        {
          category: 'Strategic Timing',
          score: engine_results.thesis_alignment_engine?.score || 38,
          confidence: 85,
          weight: 20, // 20% weight
          insights: Array.isArray(engine_results.thesis_alignment_engine?.analysis) 
            ? engine_results.thesis_alignment_engine.analysis 
            : [engine_results.thesis_alignment_engine?.analysis || 'Strategic alignment completed'],
          recommendations: ['See detailed strategic analysis'],
          strengths: ['Strategic analysis available'],
          concerns: (engine_results.thesis_alignment_engine?.score || 38) < 50 ? ['Strategic concerns identified'] : [],
          detailed_breakdown: engine_results.thesis_alignment_engine?.data || {}
        }
      ],

      // Deep dive sections structure for CategoryDeepDiveSection components
      detailed_breakdown: {
        'market_attractiveness': engine_results.market_research_engine?.data || engine_results.market_intelligence_engine?.data || {
          tam_sam_som: {
            tam: '$1B+',
            sam: '$100M+',
            som: '$10M+'
          },
          growth_drivers: ['Market expansion opportunities'],
          market_risks: ['Competitive pressure'],
          competitive_positioning: ['Analysis in progress'],
          customer_validation: ['Customer research needed'],
          geographic_opportunities: ['Geographic expansion potential']
        },

        'product_technology': engine_results.product_ip_engine?.data || {
          ip_portfolio: ['Patent analysis pending'],
          competitive_moats: ['Technology differentiation'],
          technical_advantages: ['Technical analysis in progress'],
          development_roadmap: ['Roadmap analysis needed']
        },

        'team_leadership': engine_results.team_research_engine?.data || {
          founder_profiles: ['Founder research in progress'],
          team_gaps: ['Team assessment pending'],
          execution_track_record: ['Track record analysis needed'],
          advisory_board_strength: ['Advisory board evaluation']
        },

        'financial_traction': engine_results.financial_engine?.data || {
          revenue_stream_analysis: ['Revenue analysis pending'],
          unit_economics: { ltv_cac_ratio: 'TBD', gross_margin: 'TBD' },
          burn_rate_analysis: { monthly_burn: 'TBD', runway: 'TBD' },
          funding_scenarios: ['Funding scenario analysis needed']
        }
      },

      // Analysis engines status with proper naming
      analysis_engines: Object.entries(engine_results).reduce((acc, [engineName, result]) => {
        const cleanName = engineName.replace(/_engine$/, '').replace(/_/g, ' ');
        acc[engineName] = {
          name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
          status: 'completed',
          score: result.score || 0,
          last_updated: new Date().toISOString(),
          confidence: 85,
          analysis_data: result.data || {}
        };
        return acc;
      }, {} as any),

      // Notes intelligence (if available)
      notes_intelligence: orchestratorAnalysis.notes_intelligence || {
        sentiment_analysis: { overall_sentiment: 'positive', confidence: 75 },
        key_insights: ['Comprehensive AI analysis completed'],
        risk_flags: orchestratorAnalysis.risk_factors || [],
        investment_implications: { recommendation: orchestratorAnalysis.overall_recommendation }
      },

      // Fund type analysis
      fund_type_analysis: orchestratorAnalysis.fund_type_analysis || null,

      // Metadata
      analysis_metadata: {
        analysis_date: new Date().toISOString(),
        analysis_version: '2.0',
        data_sources: Object.keys(engine_results),
        confidence_score: Math.round(
          Object.values(engine_results).reduce((sum, r) => sum + (r.score || 0), 0) / 
          Object.keys(engine_results).length
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