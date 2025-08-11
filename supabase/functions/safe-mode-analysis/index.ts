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

    // SAFE MODE: Generate ONLY thesis alignment + basic rubric scoring
    const safeAnalysis = generateMinimalThesisAnalysis(deal, fund, strategy);
    
    // Update deal_analyses table with MINIMAL data only
    const { error: analysisError } = await supabase
      .from('deal_analyses')
      .upsert({
        deal_id: dealId,
        organization_id: deal.organization_id,
        overall_score: safeAnalysis.overallScore,
        thesis_alignment_score: safeAnalysis.thesisScore,
        analyzed_at: new Date().toISOString(),
        analysis_version: 1,
        engine_results: {
          safe_mode: true,
          analysis_type: 'thesis_alignment_only',
          fund_type: fund?.fund_type,
          thesis_status: safeAnalysis.thesisStatus,
          rationale: safeAnalysis.rationale,
          trace_id: traceId
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

function generateMinimalThesisAnalysis(deal: any, fund: any, strategy: any) {
  const fundType = fund?.fund_type || 'venture_capital';
  
  // THESIS ALIGNMENT ONLY - no speculation
  const sectorMatch = checkSectorAlignment(deal.industry, strategy?.industries || []);
  const sizeMatch = checkSizeAlignment(deal.deal_size, deal.valuation, fundType);
  const geoMatch = checkGeographyAlignment(deal.location, strategy?.geography || []);
  
  // Calculate thesis alignment score
  const thesisScore = Math.round((sectorMatch + sizeMatch + geoMatch) / 3);
  
  // Determine alignment status
  let thesisStatus = 'Misaligned';
  let rationale = '';
  
  if (thesisScore >= 75) {
    thesisStatus = 'Aligned';
    rationale = `Strong thesis alignment: sector fit ${sectorMatch}%, size fit ${sizeMatch}%, geography fit ${geoMatch}%`;
  } else if (thesisScore >= 50) {
    thesisStatus = 'Partially Aligned';
    rationale = `Partial thesis alignment: sector fit ${sectorMatch}%, size fit ${sizeMatch}%, geography fit ${geoMatch}%`;
  } else {
    thesisStatus = 'Misaligned';
    rationale = `Limited thesis alignment: sector fit ${sectorMatch}%, size fit ${sizeMatch}%, geography fit ${geoMatch}%`;
  }

  // Basic rubric score based on fund type
  const overallScore = fundType === 'venture_capital' ? 
    Math.max(30, Math.min(85, thesisScore + 10)) :  // VC: thesis + growth potential
    Math.max(25, Math.min(80, thesisScore + 5));    // PE: thesis + operational fit

  return {
    overallScore,
    thesisScore,
    thesisStatus,
    rationale,
    fundType
  };
}

function checkSectorAlignment(dealIndustry: string, fundIndustries: string[]): number {
  if (!dealIndustry || !fundIndustries?.length) return 40;
  
  const industry = dealIndustry.toLowerCase();
  const hasExactMatch = fundIndustries.some(fi => 
    industry === fi.toLowerCase() || fi.toLowerCase() === industry
  );
  const hasPartialMatch = fundIndustries.some(fi => 
    industry.includes(fi.toLowerCase()) || fi.toLowerCase().includes(industry)
  );
  
  if (hasExactMatch) return 90;
  if (hasPartialMatch) return 70;
  return 30;
}

function checkSizeAlignment(dealSize: number, valuation: number, fundType: string): number {
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