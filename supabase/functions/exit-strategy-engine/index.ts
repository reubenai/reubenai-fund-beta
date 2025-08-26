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
  console.log('🚫 Exit Strategy Engine: PERMANENTLY DISABLED');
  return new Response(JSON.stringify({ 
    success: false, 
    error: 'Exit strategy engine permanently disabled',
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

    const { dealId, dealData, dealAnalysis, marketResearch, webResearch } = await req.json();
    
    console.log(`🚪 Exit Strategy Engine: Analyzing exit opportunities for: ${dealData?.company_name || dealId}`);

    // Analyze exit strategy based on industry, stage, and market data
    const exitStrategy = await analyzeExitStrategy({
      dealData,
      dealAnalysis,
      marketResearch,
      webResearch,
      supabase
    });

    console.log(`✅ Exit Strategy Engine: Analysis completed for ${dealData?.company_name}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: exitStrategy,
        engineName: 'exit-strategy-engine',
        dealId,
        confidence: exitStrategy.confidence,
        analysis_type: 'exit_strategy'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Exit Strategy Engine error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        engineName: 'exit-strategy-engine'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function analyzeExitStrategy({
  dealData,
  dealAnalysis,
  marketResearch,
  webResearch,
  supabase
}) {
  const industry = dealData?.industry || 'Technology';
  const stage = dealData?.stage || 'Growth';
  const valuation = dealData?.valuation || 0;
  const revenueSize = dealAnalysis?.financial_metrics?.revenue || 0;

  // Determine most likely exit scenarios
  const exitScenarios = await identifyExitScenarios(industry, stage, valuation, revenueSize);
  
  // Analyze market comparables
  const marketComparables = await findMarketComparables(industry, valuation, supabase);
  
  // Calculate exit timeline and multiples
  const exitTimeline = calculateExitTimeline(stage, industry);
  const exitMultiples = calculateExitMultiples(industry, marketResearch);

  const strategy = {
    primary_exit_strategy: exitScenarios[0],
    exit_scenarios: exitScenarios,
    timeline_analysis: exitTimeline,
    market_multiples: exitMultiples,
    strategic_acquirers: identifyStrategicAcquirers(industry, dealData),
    financial_buyers: identifyFinancialBuyers(valuation, revenueSize),
    ipo_readiness: assessIPOReadiness(dealData, dealAnalysis),
    value_creation_plan: generateValueCreationPlan(dealData, dealAnalysis),
    exit_preparation: generateExitPreparation(stage, valuation),
    market_conditions: assessMarketConditions(industry, marketResearch),
    comparable_transactions: marketComparables,
    risk_factors: identifyExitRisks(dealData, industry),
    recommendations: generateExitRecommendations(exitScenarios, stage, valuation),
    confidence: calculateExitConfidence(dealData, marketResearch)
  };

  return strategy;
}

async function identifyExitScenarios(industry, stage, valuation, revenue) {
  const scenarios = [];

  // Strategic acquisition (most common)
  scenarios.push({
    type: 'Strategic Acquisition',
    probability: calculateStrategicAcquisitionProbability(industry, stage),
    timeline: '3-5 years',
    expected_multiple: '3-8x revenue',
    description: `Acquisition by industry leader seeking ${getStrategicRationale(industry)}`,
    key_buyers: getIndustryLeaders(industry)
  });

  // Financial buyer acquisition
  if (valuation > 10000000 && revenue > 5000000) {
    scenarios.push({
      type: 'Private Equity Acquisition',
      probability: 25,
      timeline: '4-6 years',
      expected_multiple: '2-4x revenue',
      description: 'Buyout by private equity firm focused on growth and operational improvement',
      key_buyers: ['Growth equity firms', 'Mid-market PE firms']
    });
  }

  // IPO scenario
  if (valuation > 100000000 || revenue > 50000000) {
    scenarios.push({
      type: 'Initial Public Offering',
      probability: calculateIPOProbability(valuation, revenue, industry),
      timeline: '5-7 years',
      expected_multiple: '5-15x revenue',
      description: 'Public offering for companies with significant scale and growth',
      key_requirements: ['$100M+ revenue', 'Strong growth metrics', 'Market leadership']
    });
  }

  // Secondary sale
  if (stage.toLowerCase().includes('growth')) {
    scenarios.push({
      type: 'Secondary Sale',
      probability: 15,
      timeline: '2-4 years',
      expected_multiple: '1-3x revenue',
      description: 'Sale to another private investor or growth fund',
      key_buyers: ['Growth equity funds', 'Strategic investors']
    });
  }

  return scenarios.sort((a, b) => b.probability - a.probability);
}

function calculateStrategicAcquisitionProbability(industry, stage) {
  let probability = 60; // Base probability
  
  if (industry.toLowerCase().includes('technology')) probability += 15;
  if (industry.toLowerCase().includes('healthcare')) probability += 10;
  if (industry.toLowerCase().includes('fintech')) probability += 10;
  
  if (stage.toLowerCase().includes('growth')) probability += 10;
  if (stage.toLowerCase().includes('expansion')) probability += 5;
  
  return Math.min(probability, 85);
}

function getStrategicRationale(industry) {
  const rationales = {
    'Technology': 'technological capabilities and talent acquisition',
    'Healthcare': 'product portfolio expansion and market access',
    'Financial Services': 'digital transformation and customer acquisition',
    'E-commerce': 'market expansion and technology integration',
    'SaaS': 'platform enhancement and customer base expansion'
  };
  
  return rationales[industry] || 'market expansion and strategic capabilities';
}

function getIndustryLeaders(industry) {
  const leaders = {
    'Technology': ['Microsoft', 'Google', 'Amazon', 'Meta', 'Apple'],
    'Healthcare': ['Johnson & Johnson', 'Pfizer', 'Roche', 'Novartis', 'Merck'],
    'Financial Services': ['JPMorgan', 'Goldman Sachs', 'Morgan Stanley', 'Wells Fargo'],
    'E-commerce': ['Amazon', 'Shopify', 'eBay', 'Alibaba'],
    'SaaS': ['Salesforce', 'Microsoft', 'Oracle', 'ServiceNow', 'Workday']
  };
  
  return leaders[industry] || ['Industry consolidators', 'Large corporations', 'Strategic players'];
}

function calculateExitTimeline(stage, industry) {
  const baseTimeline = {
    'Seed': { min: 5, max: 8, optimal: 6 },
    'Series A': { min: 4, max: 7, optimal: 5 },
    'Series B': { min: 3, max: 6, optimal: 4 },
    'Growth': { min: 2, max: 5, optimal: 3 }
  };

  const timeline = baseTimeline[stage] || { min: 3, max: 6, optimal: 4 };
  
  return {
    minimum_timeline: `${timeline.min} years`,
    optimal_timeline: `${timeline.optimal} years`,
    maximum_timeline: `${timeline.max} years`,
    key_milestones: generateKeyMilestones(stage, timeline.optimal)
  };
}

function generateKeyMilestones(stage, optimalYears) {
  const milestones = [];
  const yearlyMilestones = Math.floor(optimalYears);
  
  for (let i = 1; i <= yearlyMilestones; i++) {
    if (i === 1) milestones.push('Achieve product-market fit and initial traction');
    if (i === 2) milestones.push('Scale operations and expand market presence');
    if (i === 3) milestones.push('Establish market leadership and profitability path');
    if (i >= 4) milestones.push('Optimize for exit readiness and strategic value');
  }
  
  return milestones;
}

function calculateExitMultiples(industry, marketResearch) {
  const multiples = {
    'Technology': { revenue: '4-8x', ebitda: '15-25x' },
    'SaaS': { revenue: '6-12x', ebitda: '20-35x' },
    'Healthcare': { revenue: '3-6x', ebitda: '12-20x' },
    'Financial Services': { revenue: '2-4x', ebitda: '10-15x' },
    'E-commerce': { revenue: '1-3x', ebitda: '8-15x' }
  };

  return multiples[industry] || { revenue: '2-5x', ebitda: '10-18x' };
}

async function findMarketComparables(industry, valuation, supabase) {
  // In a real implementation, this would query a database of recent transactions
  return [
    {
      company: 'Recent Industry Acquisition',
      valuation: `$${(valuation * 1.2).toLocaleString()}`,
      multiple: '5.2x revenue',
      acquirer: 'Strategic Buyer',
      date: '2024'
    },
    {
      company: 'Comparable Transaction',
      valuation: `$${(valuation * 0.8).toLocaleString()}`,
      multiple: '3.8x revenue',
      acquirer: 'Financial Buyer',
      date: '2024'
    }
  ];
}

function identifyStrategicAcquirers(industry, dealData) {
  const acquirers = getIndustryLeaders(industry);
  return acquirers.slice(0, 5).map(buyer => ({
    name: buyer,
    rationale: `Strategic fit for ${getStrategicRationale(industry)}`,
    acquisition_history: 'Active acquirer in space',
    probability: 'Medium-High'
  }));
}

function identifyFinancialBuyers(valuation, revenue) {
  if (valuation < 10000000) return [];
  
  return [
    {
      type: 'Growth Equity Firms',
      focus: 'High-growth companies with proven business models',
      typical_check: '$10M-$100M',
      probability: 'Medium'
    },
    {
      type: 'Private Equity',
      focus: 'Profitable companies with expansion opportunities',
      typical_check: '$25M-$500M',
      probability: revenue > 10000000 ? 'Medium' : 'Low'
    }
  ];
}

function assessIPOReadiness(dealData, dealAnalysis) {
  const revenue = dealAnalysis?.financial_metrics?.revenue || 0;
  const growth = dealAnalysis?.financial_metrics?.growth_rate || 0;
  
  const readiness = {
    current_readiness: 'Not Ready',
    key_requirements: [
      'Achieve $100M+ annual revenue',
      'Demonstrate consistent growth >30%',
      'Establish market leadership position',
      'Build scalable operations and governance'
    ],
    timeline_to_readiness: '4-6 years',
    probability: revenue > 50000000 ? 'Possible' : 'Unlikely'
  };

  if (revenue > 100000000 && growth > 30) {
    readiness.current_readiness = 'Potentially Ready';
    readiness.timeline_to_readiness = '1-2 years';
    readiness.probability = 'High';
  }

  return readiness;
}

function generateValueCreationPlan(dealData, dealAnalysis) {
  return [
    'Accelerate revenue growth through market expansion',
    'Improve operational efficiency and margins',
    'Strengthen competitive positioning and moats',
    'Build strategic partnerships and distribution channels',
    'Develop additional products and revenue streams',
    'Enhance management team and board composition'
  ];
}

function generateExitPreparation(stage, valuation) {
  const preparations = [
    'Maintain clean cap table and corporate governance',
    'Develop comprehensive data room and documentation',
    'Build relationships with potential acquirers and investors',
    'Optimize financial reporting and business metrics'
  ];

  if (valuation > 50000000) {
    preparations.push('Engage investment banking advisors');
    preparations.push('Conduct management presentations and roadshows');
  }

  return preparations;
}

function assessMarketConditions(industry, marketResearch) {
  return {
    current_environment: 'Moderately favorable for strategic acquisitions',
    m_a_activity: 'Active consolidation in industry',
    valuation_trends: 'Stable to improving multiples',
    key_factors: [
      'Interest rate environment affecting buyer financing',
      'Industry consolidation driving strategic activity',
      'Technology disruption creating acquisition opportunities'
    ]
  };
}

function identifyExitRisks(dealData, industry) {
  return [
    'Market timing and economic conditions',
    'Competitive pressure affecting valuation',
    'Execution risk in achieving growth milestones',
    'Key person dependency and team retention',
    'Regulatory changes affecting industry dynamics'
  ];
}

function generateExitRecommendations(exitScenarios, stage, valuation) {
  const recommendations = [
    `Focus on ${exitScenarios[0]?.type.toLowerCase()} as primary exit strategy`,
    'Build strategic relationships early in the investment period',
    'Maintain optionality across multiple exit scenarios',
    'Invest in scalable operations and management systems'
  ];

  if (valuation > 25000000) {
    recommendations.push('Engage financial advisors 12-18 months before planned exit');
  }

  return recommendations;
}

function calculateIPOProbability(valuation, revenue, industry) {
  if (revenue < 25000000) return 5;
  if (revenue < 50000000) return 15;
  if (revenue < 100000000) return 25;
  return 40;
}

function calculateExitConfidence(dealData, marketResearch) {
  let confidence = 60; // Base confidence
  
  if (dealData?.industry) confidence += 10;
  if (dealData?.valuation > 0) confidence += 10;
  if (marketResearch?.market_size > 0) confidence += 10;
  if (dealData?.stage) confidence += 10;
  
  return Math.min(confidence, 90);
}