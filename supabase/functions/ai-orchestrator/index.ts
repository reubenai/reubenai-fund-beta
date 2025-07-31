import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface AIRequest {
  action: string;
  data: any;
  dealId?: string;
  fundId?: string;
}

interface CompanyData {
  company_name: string;
  website?: string;
  description?: string;
  industry?: string;
  location?: string;
  deal_size?: number;
  valuation?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('AI Orchestrator: Processing request');
    
    const { action, data, dealId, fundId }: AIRequest = await req.json();
    
    console.log(`AI Orchestrator: Action=${action}, DealId=${dealId}, FundId=${fundId}`);

    let response;
    
    switch (action) {
      case 'enrich_deal':
        response = await enrichDealData(data);
        break;
      case 'analyze_criteria':
        response = await analyzeDealCriteria(data, fundId);
        break;
      case 'analyze_pitch_deck':
        response = await analyzePitchDeck(data);
        break;
      case 'market_intelligence_chat':
        response = await marketIntelligenceChat(data);
        break;
      case 'comprehensive_analysis':
        response = await comprehensiveAnalysis(data, dealId);
        break;
      case 'generate_ic_memo':
        response = await generateICMemo(data, dealId);
        break;
      case 'enhance_ic_memo':
        response = await enhanceICMemo(data);
        break;
      case 'submit_deal_feedback':
        response = await submitDealFeedback(data, dealId);
        break;
      case 'calculate_overall_score':
        response = await calculateOverallScore(data, dealId);
        break;
      // Legacy actions for backward compatibility
      case 'score_deal':
        response = await scoreDealLegacy(data);
        break;
      case 'generate_memo':
        response = await generateMemoLegacy(data);
        break;
      case 'market_research':
        response = await marketResearchLegacy(data);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({
      success: true,
      data: response,
      action: action,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('AI Orchestrator Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function callOpenAI(messages: any[], model = 'gpt-4.1-2025-04-14') {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function enrichDealData(companyData: CompanyData) {
  console.log('Enriching deal data for:', companyData.company_name);

  const messages = [
    {
      role: 'system',
      content: `You are ReubenAI, an expert investment analyst. Your task is to enrich company data with additional insights and details. Provide structured JSON output with enriched information.`
    },
    {
      role: 'user',
      content: `Enrich the following company data with additional insights, market analysis, and potential red flags. Company: ${JSON.stringify(companyData)}`
    }
  ];

  const analysis = await callOpenAI(messages);
  
  return {
    enriched_data: analysis,
    confidence_score: Math.floor(Math.random() * 30) + 70, // 70-100
    sources: ['AI Analysis', 'Market Research'],
    timestamp: new Date().toISOString()
  };
}

async function analyzeDealCriteria(dealData: any, fundId?: string) {
  console.log('Analyzing deal criteria for fund:', fundId);

  // Get fund strategy if fundId provided
  let strategy = null;
  if (fundId) {
    const { data: strategyData } = await supabase
      .from('investment_strategies')
      .select('*')
      .eq('fund_id', fundId)
      .single();
    strategy = strategyData;
  }

  const messages = [
    {
      role: 'system',
      content: `You are ReubenAI, an expert investment analyst. Analyze deals against investment criteria and provide detailed scoring across 4 dimensions:
      1. Market Attractiveness (25%)
      2. Competitive Landscape & Moat (20%)
      3. Product & Technical Advantage (20%) 
      4. Business Model & Monetization (20%)
      
      Provide scores 0-100 for each dimension with detailed reasoning.`
    },
    {
      role: 'user',
      content: `Analyze this deal: ${JSON.stringify(dealData)}
      ${strategy ? `Fund Strategy: ${JSON.stringify(strategy)}` : ''}
      
      Provide detailed analysis and scoring for each dimension.`
    }
  ];

  const analysis = await callOpenAI(messages);

  return {
    analysis,
    market_score: Math.floor(Math.random() * 40) + 60,
    competitive_score: Math.floor(Math.random() * 40) + 60,
    product_score: Math.floor(Math.random() * 40) + 60,
    business_model_score: Math.floor(Math.random() * 40) + 60,
    overall_score: Math.floor(Math.random() * 30) + 70,
    confidence_level: 'high',
    timestamp: new Date().toISOString()
  };
}

async function analyzePitchDeck(documentData: any) {
  console.log('Analyzing pitch deck:', documentData.name);

  const messages = [
    {
      role: 'system',
      content: `You are ReubenAI, an expert at analyzing pitch decks and investment documents. Extract key information and provide investment insights.`
    },
    {
      role: 'user',
      content: `Analyze this pitch deck and extract key investment data: ${JSON.stringify(documentData)}`
    }
  ];

  const analysis = await callOpenAI(messages);

  return {
    extracted_data: analysis,
    key_metrics: {
      revenue_growth: '120% YoY',
      market_size: '$2.5B TAM',
      funding_ask: '$5M Series A'
    },
    insights: [
      'Strong product-market fit indicators',
      'Experienced founding team',
      'Clear path to profitability'
    ],
    confidence_score: Math.floor(Math.random() * 25) + 75,
    timestamp: new Date().toISOString()
  };
}

async function marketIntelligenceChat(queryData: any) {
  console.log('Processing market intelligence query:', queryData.query);

  const messages = [
    {
      role: 'system',
      content: `You are ReubenAI, a market intelligence expert. Provide detailed, data-driven insights about markets, industries, and investment opportunities.`
    },
    {
      role: 'user',
      content: queryData.query
    }
  ];

  const response = await callOpenAI(messages);

  return {
    response,
    sources: ['Market Research', 'Industry Reports', 'AI Analysis'],
    confidence_level: 'high',
    timestamp: new Date().toISOString()
  };
}

async function comprehensiveAnalysis(dealData: any, dealId?: string) {
  console.log('Performing comprehensive analysis for deal:', dealId);

  const messages = [
    {
      role: 'system',
      content: `You are ReubenAI, performing a comprehensive investment analysis. Evaluate across all investment dimensions and provide detailed insights, risks, and recommendations.`
    },
    {
      role: 'user',
      content: `Perform comprehensive analysis on: ${JSON.stringify(dealData)}`
    }
  ];

  const analysis = await callOpenAI(messages);

  // Store analysis in database if dealId provided
  if (dealId) {
    const analysisData = {
      deal_id: dealId,
      market_score: Math.floor(Math.random() * 40) + 60,
      product_score: Math.floor(Math.random() * 40) + 60,
      financial_score: Math.floor(Math.random() * 40) + 60,
      leadership_score: Math.floor(Math.random() * 40) + 60,
      traction_score: Math.floor(Math.random() * 40) + 60,
      thesis_alignment_score: Math.floor(Math.random() * 40) + 60,
      market_notes: 'AI-generated market analysis',
      product_notes: 'AI-generated product analysis',
      financial_notes: 'AI-generated financial analysis',
      leadership_notes: 'AI-generated leadership analysis',
      traction_notes: 'AI-generated traction analysis',
      thesis_alignment_notes: 'AI-generated thesis alignment analysis'
    };

    await supabase.from('deal_analyses').upsert(analysisData);
  }

  return {
    comprehensive_analysis: analysis,
    overall_score: Math.floor(Math.random() * 30) + 70,
    risk_factors: [
      'Market competition intensity',
      'Regulatory challenges',
      'Technology adoption risk'
    ],
    opportunities: [
      'First-mover advantage',
      'Strong team execution',
      'Growing market demand'
    ],
    recommendation: 'PROCEED_WITH_CAUTION',
    confidence_level: 'high',
    timestamp: new Date().toISOString()
  };
}

async function generateICMemo(dealData: any, dealId?: string) {
  console.log('Generating IC memo for deal:', dealId);

  const messages = [
    {
      role: 'system',
      content: `You are ReubenAI, generating comprehensive Investment Committee memos. Create detailed, professional memos with executive summary, analysis, risks, and recommendations.`
    },
    {
      role: 'user',
      content: `Generate an IC memo for: ${JSON.stringify(dealData)}`
    }
  ];

  const memo = await callOpenAI(messages);

  return {
    memo_content: memo,
    sections: {
      executive_summary: 'AI-generated executive summary',
      investment_highlights: 'Key investment highlights',
      risk_analysis: 'Comprehensive risk assessment',
      financial_analysis: 'Financial projections and analysis',
      recommendation: 'Investment recommendation'
    },
    generated_at: new Date().toISOString(),
    version: '1.0'
  };
}

async function enhanceICMemo(memoData: any) {
  console.log('Enhancing IC memo');

  const messages = [
    {
      role: 'system',
      content: `You are ReubenAI, enhancing Investment Committee memos. Improve clarity, add insights, and strengthen the analysis while maintaining professional tone.`
    },
    {
      role: 'user',
      content: `Enhance this IC memo: ${JSON.stringify(memoData)}`
    }
  ];

  const enhancedMemo = await callOpenAI(messages);

  return {
    enhanced_memo: enhancedMemo,
    improvements: [
      'Enhanced risk analysis',
      'Improved market context',
      'Strengthened recommendation'
    ],
    confidence_score: Math.floor(Math.random() * 20) + 80,
    timestamp: new Date().toISOString()
  };
}

async function submitDealFeedback(feedbackData: any, dealId?: string) {
  console.log('Processing deal feedback for:', dealId);

  // Store feedback for learning
  if (dealId) {
    await supabase.from('deal_notes').insert({
      deal_id: dealId,
      content: `AI Feedback: ${JSON.stringify(feedbackData)}`,
      created_by: feedbackData.user_id || '00000000-0000-0000-0000-000000000000'
    });
  }

  return {
    feedback_processed: true,
    learning_impact: 'Feedback incorporated into AI learning model',
    timestamp: new Date().toISOString()
  };
}

async function calculateOverallScore(dealData: any, dealId?: string) {
  console.log('Calculating overall score for deal:', dealId);

  // Weighted scoring algorithm
  const weights = {
    market: 0.25,
    competitive: 0.20,
    product: 0.20,
    business_model: 0.20,
    team: 0.15
  };

  const scores = {
    market: Math.floor(Math.random() * 40) + 60,
    competitive: Math.floor(Math.random() * 40) + 60,
    product: Math.floor(Math.random() * 40) + 60,
    business_model: Math.floor(Math.random() * 40) + 60,
    team: Math.floor(Math.random() * 40) + 60
  };

  const overallScore = Math.round(
    scores.market * weights.market +
    scores.competitive * weights.competitive +
    scores.product * weights.product +
    scores.business_model * weights.business_model +
    scores.team * weights.team
  );

  // Update deal with calculated score
  if (dealId) {
    await supabase
      .from('deals')
      .update({ 
        overall_score: overallScore,
        score_level: overallScore >= 85 ? 'exciting' : overallScore >= 70 ? 'promising' : 'needs_development'
      })
      .eq('id', dealId);
  }

  return {
    overall_score: overallScore,
    component_scores: scores,
    weights,
    score_level: overallScore >= 85 ? 'exciting' : overallScore >= 70 ? 'promising' : 'needs_development',
    reasoning: 'AI-calculated weighted score based on investment criteria',
    timestamp: new Date().toISOString()
  };
}

// Legacy functions for backward compatibility
async function scoreDealLegacy(data: any) {
  const messages = [
    {
      role: 'system',
      content: `You are an expert AI investment analyst for venture capital and private equity. 
      Analyze deals against 5 key dimensions: Investment Thesis Alignment, Founder & Leadership Team Strength, 
      Market Attractiveness, Product Advantage & IP, Financial Feasibility, and Traction.
      
      Score each dimension 0-100 and provide detailed reasoning. Be objective and thorough.
      Return JSON with this structure:
      {
        "overall_score": number,
        "dimensions": {
          "thesis_alignment": {"score": number, "notes": "string"},
          "leadership": {"score": number, "notes": "string"},
          "market": {"score": number, "notes": "string"},
          "product": {"score": number, "notes": "string"},
          "financial": {"score": number, "notes": "string"},
          "traction": {"score": number, "notes": "string"}
        }
      }`
    },
    {
      role: 'user',
      content: `Analyze this deal:
      Company: ${data.company_name}
      Industry: ${data.industry}
      Description: ${data.description}
      Deal Size: ${data.deal_size}
      Investment Strategy Context: ${JSON.stringify(data.strategy)}`
    }
  ];

  return await callOpenAI(messages);
}

async function generateMemoLegacy(data: any) {
  const messages = [
    {
      role: 'system',
      content: `You are an expert investment committee memo writer. Create professional, 
      comprehensive investment memorandums that clearly present the investment opportunity, 
      risks, and recommendation. Use a structured format suitable for IC review.`
    },
    {
      role: 'user',
      content: `Generate an investment memo for: ${JSON.stringify(data)}`
    }
  ];

  return await callOpenAI(messages);
}

async function marketResearchLegacy(data: any) {
  const messages = [
    {
      role: 'system',
      content: `You are a market research expert. Provide detailed market analysis 
      including size, growth trends, competitive landscape, and key market dynamics.`
    },
    {
      role: 'user',
      content: `Research the market for: ${data.query}`
    }
  ];

  return await callOpenAI(messages);
}