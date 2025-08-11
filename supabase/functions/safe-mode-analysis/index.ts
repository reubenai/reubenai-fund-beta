import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dealId, queueId, triggerReason } = await req.json();
    const traceId = crypto.randomUUID();
    
    console.log(`🛡️ [${traceId}] Safe Mode Analysis starting for deal: ${dealId}, queue: ${queueId}`);

    // Get deal and fund data
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select(`
        *,
        funds:fund_id(
          id,
          name,
          fund_type,
          investment_strategies(*)
        )
      `)
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      throw new Error(`Deal not found: ${dealId}`);
    }

    const fund = deal.funds;
    const strategy = fund?.investment_strategies?.[0];

    console.log(`🛡️ [${traceId}] Processing ${fund?.fund_type} deal: ${deal.company_name}`);

    // Generate minimal deterministic analysis
    const safeAnalysis = generateSafeAnalysis(deal, fund, strategy);
    
    // Update deal_analyses table
    const { error: analysisError } = await supabase
      .from('deal_analyses')
      .upsert({
        deal_id: dealId,
        organization_id: deal.organization_id,
        overall_score: safeAnalysis.overallScore,
        leadership_score: safeAnalysis.leadershipScore,
        market_score: safeAnalysis.marketScore,
        product_score: safeAnalysis.productScore,
        financial_score: safeAnalysis.financialScore,
        traction_score: safeAnalysis.tractionScore,
        thesis_alignment_score: safeAnalysis.thesisScore,
        analyzed_at: new Date().toISOString(),
        analysis_version: 1,
        engine_results: {
          safe_mode: true,
          analysis_type: 'deterministic_minimal',
          trigger_reason: triggerReason,
          trace_id: traceId,
          fund_type: fund?.fund_type,
          message: "Analysis Beta: full insights processing offline."
        }
      });

    if (analysisError) {
      console.error(`❌ [${traceId}] Analysis insert failed:`, analysisError);
      throw analysisError;
    }

    // Update deal with enhanced analysis
    const { error: dealUpdateError } = await supabase
      .from('deals')
      .update({
        overall_score: safeAnalysis.overallScore,
        rag_status: safeAnalysis.ragStatus,
        score_level: safeAnalysis.scoreLevel,
        enhanced_analysis: {
          safe_mode: true,
          analysis_completeness: 60,
          last_comprehensive_analysis: new Date().toISOString(),
          rubric_breakdown: safeAnalysis.rubricBreakdown,
          fund_type_analysis: {
            fund_type: fund?.fund_type,
            alignment_score: safeAnalysis.thesisScore,
            focus_areas: ['Safe mode analysis - limited scope'],
            strengths: ['Basic thesis alignment checked'],
            concerns: ['Full analysis pending'],
            strategic_recommendations: ['Complete full analysis when available']
          },
          engines_completion_status: {
            safe_mode_complete: true,
            full_analysis_pending: true
          }
        },
        analysis_queue_status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', dealId);

    if (dealUpdateError) {
      console.error(`❌ [${traceId}] Deal update failed:`, dealUpdateError);
      throw dealUpdateError;
    }

    console.log(`✅ [${traceId}] Safe Mode analysis completed for deal: ${dealId}, score: ${safeAnalysis.overallScore}`);

    return new Response(JSON.stringify({
      success: true,
      safe_mode: true,
      analysis: safeAnalysis,
      trace_id: traceId,
      message: "Safe mode analysis completed successfully"
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Safe Mode Analysis error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Safe mode analysis failed',
      safe_mode: true
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateSafeAnalysis(deal: any, fund: any, strategy: any) {
  const fundType = fund?.fund_type || 'venture_capital';
  
  // Basic thesis alignment checks
  const industryMatch = checkIndustryAlignment(deal.industry, strategy?.industries || []);
  const sizeMatch = checkDealSizeAlignment(deal.deal_size, deal.valuation, fundType);
  const geoMatch = checkGeographyAlignment(deal.location, strategy?.geography || []);
  
  // Calculate deterministic scores based on available data
  const thesisScore = Math.round((industryMatch + sizeMatch + geoMatch) / 3);
  
  // Generate conservative scores for other categories
  const leadershipScore = deal.founder ? 65 : 50;
  const marketScore = deal.industry ? 60 : 45;
  const productScore = deal.description ? 55 : 40;
  const financialScore = deal.deal_size ? 60 : 45;
  const tractionScore = deal.employee_count ? Math.min(70, 40 + Math.log10(deal.employee_count || 1) * 10) : 45;
  
  // Calculate overall score with thesis alignment weighted heavily
  const overallScore = Math.round(
    (thesisScore * 0.3) +
    (leadershipScore * 0.2) +
    (marketScore * 0.15) +
    (productScore * 0.15) +
    (financialScore * 0.1) +
    (tractionScore * 0.1)
  );

  // Determine RAG status based on strategy thresholds
  let ragStatus = 'amber';
  let scoreLevel = 'needs_development';
  
  if (strategy) {
    if (overallScore >= (strategy.exciting_threshold || 85)) {
      ragStatus = 'green';
      scoreLevel = 'exciting';
    } else if (overallScore >= (strategy.promising_threshold || 70)) {
      ragStatus = 'amber'; 
      scoreLevel = 'promising';
    } else {
      ragStatus = 'red';
      scoreLevel = 'needs_development';
    }
  }

  const rubricBreakdown = [
    {
      category: 'Thesis Alignment',
      score: thesisScore,
      confidence: 85,
      weight: 30,
      insights: [`${fundType === 'venture_capital' ? 'VC' : 'PE'} thesis alignment checked`],
      strengths: industryMatch > 70 ? ['Industry alignment confirmed'] : [],
      concerns: industryMatch < 50 ? ['Industry alignment needs review'] : []
    },
    {
      category: 'Team & Leadership', 
      score: leadershipScore,
      confidence: 40,
      weight: 20,
      insights: ['Safe mode - limited team analysis'],
      strengths: [],
      concerns: ['Full team analysis pending']
    },
    {
      category: 'Market Opportunity',
      score: marketScore, 
      confidence: 35,
      weight: 15,
      insights: ['Safe mode - basic market check'],
      strengths: [],
      concerns: ['Market analysis pending']
    }
  ];

  return {
    overallScore,
    thesisScore,
    leadershipScore,
    marketScore,
    productScore,
    financialScore,
    tractionScore,
    ragStatus,
    scoreLevel,
    rubricBreakdown
  };
}

function checkIndustryAlignment(dealIndustry: string, fundIndustries: string[]): number {
  if (!dealIndustry || !fundIndustries?.length) return 50;
  
  const industry = dealIndustry.toLowerCase();
  const hasMatch = fundIndustries.some(fi => 
    industry.includes(fi.toLowerCase()) || fi.toLowerCase().includes(industry)
  );
  
  return hasMatch ? 85 : 35;
}

function checkDealSizeAlignment(dealSize: number, valuation: number, fundType: string): number {
  if (!dealSize && !valuation) return 50;
  
  const size = dealSize || valuation || 0;
  
  if (fundType === 'venture_capital') {
    // VC typically invests $100K - $50M
    if (size >= 100000 && size <= 50000000) return 80;
    if (size <= 100000000) return 60;
    return 40;
  } else {
    // PE typically invests $10M - $1B
    if (size >= 10000000 && size <= 1000000000) return 80;
    if (size >= 1000000) return 60;
    return 40;
  }
}

function checkGeographyAlignment(dealLocation: string, fundGeography: string[]): number {
  if (!dealLocation || !fundGeography?.length) return 60;
  
  const location = dealLocation.toLowerCase();
  const hasMatch = fundGeography.some(geo =>
    location.includes(geo.toLowerCase()) || geo.toLowerCase().includes(location)
  );
  
  return hasMatch ? 80 : 45;
}