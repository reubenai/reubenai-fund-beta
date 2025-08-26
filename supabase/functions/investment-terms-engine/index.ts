import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // 🚫 HARD CODED KILL SWITCH - ENGINE PERMANENTLY DISABLED
  console.log('🚫 Investment Terms Engine: PERMANENTLY DISABLED');
  return new Response(JSON.stringify({ 
    success: false, 
    error: 'Investment terms engine permanently disabled',
    message: 'This engine has been shut down permanently'
  }), {
    status: 503,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { dealId, dealData, dealAnalysis, documents } = await req.json();
    
    console.log(`💰 Investment Terms Engine: Analyzing investment terms for: ${dealData?.company_name || dealId}`);

    // Fetch deal documents for term extraction
    const { data: dealDocuments } = await supabase
      .from('deal_documents')
      .select('*')
      .eq('deal_id', dealId)
      .eq('document_type', 'legal')
      .order('created_at', { ascending: false });

    // Extract key investment data
    const investmentSize = dealData?.deal_size || dealData?.investment_amount || 0;
    const valuation = dealData?.valuation || dealData?.pre_money_valuation || 0;
    const businessModel = dealData?.business_model || 'Not specified';
    const fundingStage = dealData?.stage || 'Not specified';

    // Analyze investment terms structure
    const investmentTerms = await analyzeInvestmentTerms({
      dealData,
      investmentSize,
      valuation,
      businessModel,
      fundingStage,
      documents: dealDocuments || [],
      dealAnalysis
    });

    console.log(`✅ Investment Terms Engine: Analysis completed for ${dealData?.company_name}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: investmentTerms,
        engineName: 'investment-terms-engine',
        dealId,
        confidence: investmentTerms.confidence,
        analysis_type: 'investment_terms'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Investment Terms Engine error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        engineName: 'investment-terms-engine'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function analyzeInvestmentTerms({
  dealData,
  investmentSize,
  valuation,
  businessModel,
  fundingStage,
  documents,
  dealAnalysis
}) {
  const analysis = {
    investment_structure: {
      type: determineInvestmentType(fundingStage, businessModel),
      amount: investmentSize,
      valuation: valuation,
      implied_post_money: valuation + investmentSize,
      ownership_percentage: investmentSize / (valuation + investmentSize) * 100
    },
    deal_terms: {
      security_type: determinSecurityType(fundingStage),
      liquidation_preference: "1x non-participating preferred",
      anti_dilution: "Weighted average broad-based",
      board_composition: determineBoardComposition(investmentSize),
      voting_rights: "Standard protective provisions",
      drag_along: "Yes",
      tag_along: "Yes"
    },
    financial_metrics: {
      price_per_share: valuation > 0 ? (valuation / 10000000).toFixed(4) : "TBD", // Assuming 10M shares
      enterprise_value: valuation,
      revenue_multiple: calculateRevenueMultiple(valuation, dealAnalysis),
      funding_use: analyzeFundingUse(investmentSize, dealData)
    },
    investor_rights: {
      information_rights: "Standard monthly/quarterly reporting",
      inspection_rights: "Reasonable access to books and records",
      preemptive_rights: "Pro rata participation rights",
      registration_rights: "Standard piggyback and demand rights"
    },
    key_provisions: extractKeyProvisions(documents, dealData),
    risk_factors: identifyInvestmentRisks(dealData, dealAnalysis),
    recommendations: generateTermsRecommendations(investmentSize, valuation, fundingStage),
    confidence: calculateTermsConfidence(documents, dealData)
  };

  return analysis;
}

function determineInvestmentType(stage, businessModel) {
  if (stage.toLowerCase().includes('seed')) return 'Seed Investment';
  if (stage.toLowerCase().includes('series a')) return 'Series A Investment';
  if (stage.toLowerCase().includes('series b')) return 'Series B Investment';
  if (stage.toLowerCase().includes('growth')) return 'Growth Investment';
  return 'Equity Investment';
}

function determinSecurityType(stage) {
  if (stage.toLowerCase().includes('seed')) return 'Convertible Preferred Stock or SAFE';
  return 'Preferred Stock';
}

function determineBoardComposition(investmentSize) {
  if (investmentSize < 1000000) return "Founder majority with investor observer";
  if (investmentSize < 5000000) return "Equal representation (2-2-1 independent)";
  return "Investor-friendly majority";
}

function calculateRevenueMultiple(valuation, dealAnalysis) {
  const revenue = dealAnalysis?.financial_metrics?.revenue || 0;
  if (revenue > 0) return (valuation / revenue).toFixed(1);
  return "N/A";
}

function analyzeFundingUse(investmentSize, dealData) {
  const uses = [];
  if (investmentSize > 0) {
    uses.push(`Product development (40%): $${(investmentSize * 0.4).toLocaleString()}`);
    uses.push(`Sales & Marketing (35%): $${(investmentSize * 0.35).toLocaleString()}`);
    uses.push(`Team expansion (20%): $${(investmentSize * 0.2).toLocaleString()}`);
    uses.push(`Working capital (5%): $${(investmentSize * 0.05).toLocaleString()}`);
  }
  return uses;
}

function extractKeyProvisions(documents, dealData) {
  // In a real implementation, this would parse documents for key terms
  return [
    "Standard liquidation preference provisions",
    "Anti-dilution protection with weighted average adjustment",
    "Standard protective provisions for major decisions",
    "Founder vesting with standard acceleration triggers",
    "Option pool sizing appropriate for growth stage"
  ];
}

function identifyInvestmentRisks(dealData, dealAnalysis) {
  const risks = [
    "Valuation risk based on current market conditions",
    "Execution risk in achieving projected milestones",
    "Market competition and timing risks",
    "Team retention and key person dependency"
  ];

  if (dealAnalysis?.financial_metrics?.burn_rate > 0) {
    risks.push("Capital efficiency and runway management");
  }

  return risks;
}

function generateTermsRecommendations(investmentSize, valuation, stage) {
  const recommendations = [];
  
  if (valuation > investmentSize * 20) {
    recommendations.push("Consider valuation relative to comparable transactions");
  }
  
  recommendations.push("Implement standard investor protection provisions");
  recommendations.push("Ensure adequate option pool for future hires");
  recommendations.push("Structure board composition for effective governance");
  
  if (stage.toLowerCase().includes('seed')) {
    recommendations.push("Consider SAFE or convertible structure for efficiency");
  }
  
  return recommendations;
}

function calculateTermsConfidence(documents, dealData) {
  let confidence = 50; // Base confidence
  
  if (dealData?.deal_size > 0) confidence += 20;
  if (dealData?.valuation > 0) confidence += 20;
  if (documents && documents.length > 0) confidence += 10;
  
  return Math.min(confidence, 95);
}