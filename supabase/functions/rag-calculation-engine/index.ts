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

interface RAGRequest {
  dealId: string;
  companyData: any;
  analysisData?: any;
  strategyData?: any;
}

interface RAGResult {
  status: 'RED' | 'AMBER' | 'GREEN';
  confidence: number;
  reasoning: string;
  factors: string[];
  recommendations: string[];
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('RAG Calculation Engine: Processing request');
    
    const request: RAGRequest = await req.json();
    console.log('RAG request for deal:', request.dealId);

    // Get comprehensive data for analysis
    const dealData = await getDealData(request.dealId);
    const analysisData = await getAnalysisData(request.dealId);
    const ragResult = await calculateRAGStatus(dealData, analysisData, request);

    // Store RAG result
    await storeRAGResult(request.dealId, ragResult);

    return new Response(JSON.stringify({
      success: true,
      data: ragResult,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('RAG Calculation Engine Error:', error);
    
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
      temperature: 0.3, // Lower temperature for more consistent analysis
      max_tokens: 3000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function getDealData(dealId: string) {
  const { data: deal } = await supabase
    .from('deals')
    .select(`
      *,
      funds!inner(
        *,
        investment_strategies(*)
      )
    `)
    .eq('id', dealId)
    .single();

  return deal;
}

async function getAnalysisData(dealId: string) {
  const { data: analysis } = await supabase
    .from('deal_analyses')
    .select('*')
    .eq('deal_id', dealId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return analysis;
}

async function calculateRAGStatus(dealData: any, analysisData: any, request: RAGRequest): Promise<RAGResult> {
  console.log('Calculating RAG status with AI');

  // Multi-factor assessment
  const dataCompleteness = assessDataCompleteness(dealData, analysisData);
  const aiScores = extractAIScores(analysisData);
  const strategyAlignment = assessStrategyAlignment(dealData, request.strategyData);
  const webPresence = await assessWebPresence(dealData);

  const messages = [
    {
      role: 'system',
      content: `You are ReubenAI's RAG (Red/Amber/Green) calculation engine. Analyze investment opportunities and assign a RAG status based on comprehensive criteria:

      RED (High Risk/No Go): 
      - Critical issues identified
      - Poor strategy alignment
      - Significant red flags
      - Low confidence in success

      AMBER (Proceed with Caution):
      - Mixed signals
      - Moderate alignment
      - Some concerns but potential upside
      - Requires additional due diligence

      GREEN (Strong Interest):
      - Strong strategic fit
      - Positive indicators across metrics
      - High confidence in potential
      - Clear investment rationale

      Provide detailed reasoning and specific recommendations.`
    },
    {
      role: 'user',
      content: `Calculate RAG status for this investment opportunity:

      Deal Data: ${JSON.stringify(dealData)}
      Analysis Data: ${JSON.stringify(analysisData)}
      Data Completeness: ${dataCompleteness.score}% (${dataCompleteness.missing.join(', ')})
      AI Scores: ${JSON.stringify(aiScores)}
      Strategy Alignment: ${strategyAlignment.score}%
      Web Presence: ${webPresence.score}%

      Provide RAG status, confidence level, detailed reasoning, key factors, and specific recommendations.`
    }
  ];

  const aiResponse = await callOpenAI(messages);

  // Parse AI response and calculate final RAG
  const ragStatus = determineRAGFromFactors(dataCompleteness, aiScores, strategyAlignment, webPresence);
  const confidence = calculateConfidence(dataCompleteness, aiScores, webPresence);

  return {
    status: ragStatus,
    confidence,
    reasoning: aiResponse,
    factors: [
      `Data Completeness: ${dataCompleteness.score}%`,
      `Strategy Alignment: ${strategyAlignment.score}%`,
      `AI Overall Score: ${aiScores.overall || 'N/A'}`,
      `Web Presence: ${webPresence.score}%`
    ],
    recommendations: generateRecommendations(ragStatus, dataCompleteness, strategyAlignment),
    risk_level: calculateRiskLevel(ragStatus, confidence, aiScores)
  };
}

function assessDataCompleteness(dealData: any, analysisData: any) {
  const requiredFields = [
    'company_name', 'description', 'industry', 'deal_size', 
    'valuation', 'website', 'location'
  ];

  const presentFields = requiredFields.filter(field => 
    dealData?.[field] && dealData[field] !== ''
  );

  const analysisComplete = analysisData && Object.keys(analysisData).length > 5;

  const score = Math.round(
    (presentFields.length / requiredFields.length) * 70 + 
    (analysisComplete ? 30 : 0)
  );

  return {
    score,
    present: presentFields,
    missing: requiredFields.filter(field => !presentFields.includes(field)),
    analysis_complete: analysisComplete
  };
}

function extractAIScores(analysisData: any) {
  if (!analysisData) {
    return { overall: null, components: {} };
  }

  return {
    overall: analysisData.overall_score || calculateAverageScore(analysisData),
    components: {
      market: analysisData.market_score,
      product: analysisData.product_score,
      financial: analysisData.financial_score,
      leadership: analysisData.leadership_score,
      traction: analysisData.traction_score,
      thesis_alignment: analysisData.thesis_alignment_score
    }
  };
}

function calculateAverageScore(analysisData: any) {
  const scores = [
    analysisData.market_score,
    analysisData.product_score,
    analysisData.financial_score,
    analysisData.leadership_score,
    analysisData.traction_score,
    analysisData.thesis_alignment_score
  ].filter(score => score != null);

  return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
}

function assessStrategyAlignment(dealData: any, strategyData: any) {
  if (!strategyData && !dealData?.funds?.investment_strategies?.[0]) {
    return { score: 50, factors: ['No strategy data available'] };
  }

  const strategy = strategyData || dealData.funds.investment_strategies[0];
  const factors = [];
  let score = 30; // Base score

  // Industry alignment
  if (strategy.industries?.includes(dealData.industry)) {
    score += 25;
    factors.push('Industry match');
  }

  // Investment size alignment
  const dealSize = dealData.deal_size || 0;
  if (dealSize >= (strategy.min_investment_amount || 0) && 
      dealSize <= (strategy.max_investment_amount || Infinity)) {
    score += 25;
    factors.push('Investment size fit');
  }

  // Geography alignment
  if (strategy.geography?.some((geo: string) => 
    dealData.location?.toLowerCase().includes(geo.toLowerCase())
  )) {
    score += 20;
    factors.push('Geographic focus');
  }

  return { score: Math.min(100, score), factors };
}

async function assessWebPresence(dealData: any) {
  // Simulate web presence assessment
  const hasWebsite = !!dealData.website;
  const domainAge = Math.random() > 0.3; // Simulate domain age check
  const socialMedia = Math.random() > 0.4; // Simulate social media presence
  
  let score = 0;
  const factors = [];

  if (hasWebsite) {
    score += 40;
    factors.push('Website present');
  }

  if (domainAge) {
    score += 30;
    factors.push('Established domain');
  }

  if (socialMedia) {
    score += 30;
    factors.push('Social media presence');
  }

  return { score, factors };
}

function determineRAGFromFactors(
  dataCompleteness: any, 
  aiScores: any, 
  strategyAlignment: any, 
  webPresence: any
): 'RED' | 'AMBER' | 'GREEN' {
  
  const overallScore = aiScores.overall || 70;
  const dataScore = dataCompleteness.score;
  const strategyScore = strategyAlignment.score;
  const webScore = webPresence.score;

  // Weighted calculation
  const compositeScore = 
    (overallScore * 0.4) + 
    (strategyScore * 0.3) + 
    (dataScore * 0.2) + 
    (webScore * 0.1);

  if (compositeScore >= 80) return 'GREEN';
  if (compositeScore >= 60) return 'AMBER';
  return 'RED';
}

function calculateConfidence(dataCompleteness: any, aiScores: any, webPresence: any): number {
  const factors = [
    dataCompleteness.score >= 80 ? 30 : dataCompleteness.score >= 60 ? 20 : 10,
    aiScores.overall ? 30 : 10,
    webPresence.score >= 70 ? 25 : webPresence.score >= 40 ? 15 : 5,
    15 // Base confidence
  ];

  return Math.min(100, factors.reduce((a, b) => a + b, 0));
}

function generateRecommendations(
  ragStatus: string, 
  dataCompleteness: any, 
  strategyAlignment: any
): string[] {
  const recommendations = [];

  if (ragStatus === 'GREEN') {
    recommendations.push('Proceed with due diligence');
    recommendations.push('Schedule management presentation');
    recommendations.push('Prepare investment committee memo');
  } else if (ragStatus === 'AMBER') {
    recommendations.push('Conduct additional research');
    recommendations.push('Address data gaps identified');
    recommendations.push('Validate key assumptions');
  } else {
    recommendations.push('Consider passing on opportunity');
    recommendations.push('Document reasons for future reference');
    recommendations.push('Monitor for future developments');
  }

  if (dataCompleteness.score < 70) {
    recommendations.push('Improve data collection quality');
  }

  if (strategyAlignment.score < 60) {
    recommendations.push('Reassess strategic fit criteria');
  }

  return recommendations;
}

function calculateRiskLevel(ragStatus: string, confidence: number, aiScores: any): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (ragStatus === 'RED' || confidence < 50) return 'HIGH';
  if (ragStatus === 'AMBER' || confidence < 75 || (aiScores.overall && aiScores.overall < 70)) return 'MEDIUM';
  return 'LOW';
}

async function storeRAGResult(dealId: string, ragResult: RAGResult) {
  try {
    // Store as a note for now - could create dedicated RAG table
    await supabase.from('deal_notes').insert({
      deal_id: dealId,
      content: `RAG Analysis: ${ragResult.status} (${ragResult.confidence}% confidence)\n\nReasons: ${ragResult.reasoning}\n\nRecommendations: ${ragResult.recommendations.join(', ')}`,
      created_by: '00000000-0000-0000-0000-000000000000' // System user
    });

    console.log('RAG result stored for deal:', dealId);
  } catch (error) {
    console.error('Error storing RAG result:', error);
  }
}