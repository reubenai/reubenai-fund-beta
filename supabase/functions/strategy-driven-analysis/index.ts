import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StrategyThresholds {
  exciting: number;
  promising: number;
  needs_development: number;
}

interface EnhancedCriteria {
  fundType: string;
  categories: {
    [key: string]: {
      weight: number;
      enabled: boolean;
      subcategories: {
        [key: string]: {
          weight: number;
          enabled: boolean;
          requirements?: string;
        };
      };
    };
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { dealId, fundId } = await req.json();

    if (!dealId || !fundId) {
      return new Response(
        JSON.stringify({ error: 'Deal ID and Fund ID are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('=== STRATEGY-DRIVEN ANALYSIS ===');
    console.log('Deal ID:', dealId);
    console.log('Fund ID:', fundId);

    // 1. Get the fund's investment strategy
    const { data: strategy, error: strategyError } = await supabase
      .from('investment_strategies')
      .select('*')
      .eq('fund_id', fundId)
      .single();

    if (strategyError || !strategy) {
      console.log('No strategy found, using defaults');
      return new Response(
        JSON.stringify({ 
          error: 'Investment strategy not configured for this fund',
          suggestion: 'Please configure your investment strategy first'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Strategy found:', strategy);

    // 2. Get deal data
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select('*')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      return new Response(
        JSON.stringify({ error: 'Deal not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Deal found:', deal);

    // 3. Calculate strategy-weighted score
    const enhancedCriteria = strategy.enhanced_criteria as EnhancedCriteria;
    const thresholds: StrategyThresholds = {
      exciting: strategy.exciting_threshold || 85,
      promising: strategy.promising_threshold || 70,
      needs_development: strategy.needs_development_threshold || 50
    };

    console.log('Using thresholds:', thresholds);
    console.log('Enhanced criteria:', enhancedCriteria);

    // 4. Calculate weighted scores based on strategy configuration
    let totalScore = 0;
    let maxPossibleScore = 0;
    const categoryScores: Record<string, number> = {};

    if (enhancedCriteria?.categories) {
      for (const [categoryName, categoryConfig] of Object.entries(enhancedCriteria.categories)) {
        if (!categoryConfig.enabled) continue;

        // Mock scoring logic - in real implementation, this would use AI analysis
        // For now, generate scores based on deal characteristics and strategy alignment
        let categoryScore = 0;
        
        switch (categoryName) {
          case 'Team & Leadership':
            categoryScore = calculateTeamScore(deal, categoryConfig);
            break;
          case 'Market Opportunity':
            categoryScore = calculateMarketScore(deal, categoryConfig, strategy);
            break;
          case 'Product & Technology':
            categoryScore = calculateProductScore(deal, categoryConfig);
            break;
          case 'Business Traction':
            categoryScore = calculateTractionScore(deal, categoryConfig);
            break;
          case 'Financial Health':
            categoryScore = calculateFinancialScore(deal, categoryConfig);
            break;
          case 'Strategic Fit':
            categoryScore = calculateStrategicFitScore(deal, categoryConfig, strategy);
            break;
          default:
            categoryScore = 70; // Default score
        }

        categoryScores[categoryName] = categoryScore;
        totalScore += categoryScore * (categoryConfig.weight / 100);
        maxPossibleScore += 100 * (categoryConfig.weight / 100);
      }
    }

    // Normalize score to 0-100 range
    const finalScore = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;

    // 5. Determine RAG status based on fund-specific thresholds
    let ragStatus = 'not_aligned';
    if (finalScore >= thresholds.exciting) {
      ragStatus = 'exciting';
    } else if (finalScore >= thresholds.promising) {
      ragStatus = 'promising';
    } else if (finalScore >= thresholds.needs_development) {
      ragStatus = 'needs_development';
    }

    // 6. Generate contextual reasoning
    const reasoning = generateStrategicReasoning(deal, strategy, categoryScores, ragStatus);

    // 7. Update deal with new scores
    const { error: updateError } = await supabase
      .from('deals')
      .update({
        overall_score: finalScore,
        score_level: ragStatus,
        rag_reasoning: reasoning,
        rag_confidence: 85, // High confidence for strategy-based scoring
        updated_at: new Date().toISOString()
      })
      .eq('id', dealId);

    if (updateError) {
      console.error('Error updating deal:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update deal scores' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Deal updated with strategy-driven analysis');

    return new Response(
      JSON.stringify({
        success: true,
        dealId,
        fundId,
        analysis: {
          finalScore,
          ragStatus,
          categoryScores,
          reasoning,
          thresholds,
          strategyCriteria: Object.keys(enhancedCriteria?.categories || {}).filter(
            key => enhancedCriteria.categories[key].enabled
          )
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in strategy-driven-analysis:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper functions for scoring different categories
function calculateTeamScore(deal: any, categoryConfig: any): number {
  // Base score influenced by founder info, company validation status
  let score = 65;
  
  if (deal.founder) score += 15;
  if (deal.company_validation_status === 'validated') score += 10;
  if (deal.linkedin_url) score += 5;
  if (deal.employee_count && deal.employee_count > 10) score += 5;
  
  return Math.min(100, score);
}

function calculateMarketScore(deal: any, categoryConfig: any, strategy: any): number {
  let score = 60;
  
  // Industry alignment
  if (strategy.industries && deal.industry) {
    const isTargetIndustry = strategy.industries.some((ind: string) => 
      deal.industry.toLowerCase().includes(ind.toLowerCase())
    );
    if (isTargetIndustry) score += 20;
  }
  
  // Geography alignment
  if (strategy.geography && deal.location) {
    const isTargetGeo = strategy.geography.some((geo: string) => 
      deal.location.toLowerCase().includes(geo.toLowerCase())
    );
    if (isTargetGeo) score += 15;
  }
  
  if (deal.website) score += 5;
  
  return Math.min(100, score);
}

function calculateProductScore(deal: any, categoryConfig: any): number {
  let score = 65;
  
  if (deal.website) score += 10;
  if (deal.description && deal.description.length > 100) score += 10;
  if (deal.crunchbase_url) score += 10;
  if (deal.web_presence_confidence && deal.web_presence_confidence > 70) score += 5;
  
  return Math.min(100, score);
}

function calculateTractionScore(deal: any, categoryConfig: any): number {
  let score = 60;
  
  if (deal.deal_size && deal.deal_size > 1000000) score += 15;
  if (deal.valuation && deal.valuation > 10000000) score += 10;
  if (deal.employee_count && deal.employee_count > 20) score += 10;
  if (deal.website) score += 5;
  
  return Math.min(100, score);
}

function calculateFinancialScore(deal: any, categoryConfig: any): number {
  let score = 65;
  
  if (deal.deal_size) {
    if (deal.deal_size > 5000000) score += 15;
    else if (deal.deal_size > 1000000) score += 10;
    else score += 5;
  }
  
  if (deal.valuation) score += 10;
  if (deal.currency === 'USD') score += 5;
  
  return Math.min(100, score);
}

function calculateStrategicFitScore(deal: any, categoryConfig: any, strategy: any): number {
  let score = 70;
  
  // Check size alignment
  if (strategy.min_investment_amount && strategy.max_investment_amount && deal.deal_size) {
    if (deal.deal_size >= strategy.min_investment_amount && 
        deal.deal_size <= strategy.max_investment_amount) {
      score += 20;
    }
  }
  
  // Key signals alignment
  if (strategy.key_signals && strategy.key_signals.length > 0) {
    const dealText = `${deal.company_name} ${deal.industry} ${deal.description}`.toLowerCase();
    const signalMatches = strategy.key_signals.filter((signal: string) => 
      dealText.includes(signal.toLowerCase())
    );
    score += Math.min(10, signalMatches.length * 2);
  }
  
  return Math.min(100, score);
}

function generateStrategicReasoning(deal: any, strategy: any, categoryScores: Record<string, number>, ragStatus: string): any {
  const topCategories = Object.entries(categoryScores)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);
  
  const reasoning = {
    ragStatus,
    topStrengths: topCategories.map(([category, score]) => ({ category, score })),
    strategyAlignment: {
      industryMatch: strategy.industries?.some((ind: string) => 
        deal.industry?.toLowerCase().includes(ind.toLowerCase())
      ) || false,
      geographyMatch: strategy.geography?.some((geo: string) => 
        deal.location?.toLowerCase().includes(geo.toLowerCase())
      ) || false,
      sizeAlignment: strategy.min_investment_amount && strategy.max_investment_amount && deal.deal_size ?
        (deal.deal_size >= strategy.min_investment_amount && deal.deal_size <= strategy.max_investment_amount) : false
    },
    keyInsights: [
      `Deal categorized as "${ragStatus}" based on your fund's scoring thresholds`,
      `Top performing criteria: ${topCategories.map(([cat]) => cat).join(', ')}`,
      strategy.industries?.includes(deal.industry) ? 
        `Strong industry alignment with your ${deal.industry} focus` : 
        `Industry alignment opportunity in ${deal.industry}`
    ]
  };
  
  return reasoning;
}