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
      
      // Rubric breakdown from engine results
      rubric_breakdown: Object.entries(engine_results).map(([engineName, result]) => ({
        category: engineName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        score: result.score || 0,
        confidence: 85, // Default confidence
        weight: 0.2, // Equal weighting
        insights: result.analysis || 'Analysis completed',
        recommendations: ['See detailed engine analysis'],
        detailed_breakdown: result.data || {}
      })),

      // Deep dive sections based on engine results
      market_deep_dive: engine_results.market_research_engine?.data ? {
        market_size: {
          size: engine_results.market_research_engine.data.market_size || 'TBD',
          growth_rate: engine_results.market_research_engine.data.growth_rate || 'TBD',
          addressable_market: engine_results.market_research_engine.data.addressable_market || 'TBD'
        },
        competitive_landscape: {
          competitors: engine_results.market_research_engine.data.competitors || [],
          competitive_advantages: engine_results.market_research_engine.data.competitive_advantages || [],
          market_position: engine_results.market_research_engine.data.market_position || 'TBD'
        },
        market_trends: engine_results.market_research_engine.data.trends || []
      } : null,

      team_deep_dive: engine_results.team_research_engine?.data ? {
        founder_profiles: engine_results.team_research_engine.data.founders || [],
        team_gaps: engine_results.team_research_engine.data.team_gaps || [],
        execution_track_record: engine_results.team_research_engine.data.track_record || [],
        advisory_board: engine_results.team_research_engine.data.advisors || []
      } : null,

      product_deep_dive: engine_results.product_ip_engine?.data ? {
        ip_portfolio: engine_results.product_ip_engine.data.ip_assets || [],
        competitive_moats: engine_results.product_ip_engine.data.competitive_moats || [],
        technical_advantages: engine_results.product_ip_engine.data.technical_advantages || [],
        development_roadmap: engine_results.product_ip_engine.data.roadmap || []
      } : null,

      financial_deep_dive: engine_results.financial_engine?.data ? {
        revenue_streams: engine_results.financial_engine.data.revenue_streams || [],
        financial_metrics: engine_results.financial_engine.data.metrics || {},
        burn_rate_analysis: engine_results.financial_engine.data.burn_analysis || {},
        funding_history: engine_results.financial_engine.data.funding_history || []
      } : null,

      traction_deep_dive: engine_results.market_intelligence_engine?.data ? {
        customer_metrics: engine_results.market_intelligence_engine.data.customer_metrics || [],
        partnerships: engine_results.market_intelligence_engine.data.partnerships || [],
        market_penetration: engine_results.market_intelligence_engine.data.market_penetration || {},
        growth_trajectory: engine_results.market_intelligence_engine.data.growth_trajectory || {}
      } : null,

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