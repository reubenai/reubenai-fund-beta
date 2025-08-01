import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface AnalysisRequest {
  dealId: string;
  engines?: string[]; // Optional: specify which engines to run
}

interface EngineResult {
  engine: string;
  score: number;
  analysis: string;
  confidence: number;
  sources: any[];
  data: any;
  validation_status: 'validated' | 'partial' | 'unvalidated';
}

interface ComprehensiveAnalysis {
  deal_id: string;
  executive_summary: string;
  overall_score: number;
  overall_recommendation: string;
  confidence_level: 'high' | 'medium' | 'low';
  engine_results: {
    investment_thesis_alignment: EngineResult;
    market_attractiveness: EngineResult;
    product_strength_ip: EngineResult;
    financial_feasibility: EngineResult;
    founder_team_strength: EngineResult;
  };
  risk_factors: string[];
  next_steps: string[];
  analysis_version: number;
  timestamp: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dealId, engines }: AnalysisRequest = await req.json();
    
    console.log('🧠 Reuben Orchestrator: Starting comprehensive analysis for deal:', dealId);
    
    // Fetch deal and fund strategy data
    const dealData = await fetchDealData(dealId);
    const strategyData = await fetchFundStrategy(dealData.fund_id);
    
    // Fetch document data for enhanced analysis
    const documentData = await fetchDocumentData(dealId);
    
    // Prepare enhanced engine context with fund-specific data
    const engineContext = {
      dealData,
      strategyData,
      documentData,
      fundType: strategyData?.fund_type || 'vc',
      investmentPhilosophy: strategyData?.investment_philosophy || '',
      enhancedCriteria: strategyData?.enhanced_criteria || null,
      geography: strategyData?.geography || [],
      keySignals: strategyData?.key_signals || [],
      thresholds: {
        exciting: strategyData?.exciting_threshold || 85,
        promising: strategyData?.promising_threshold || 70,
        needs_development: strategyData?.needs_development_threshold || 50
      }
    };

    // Run all 5 AI engines in parallel with enhanced context
    const enginePromises = [
      callEngine('thesis-alignment-engine', engineContext),
      callEngine('market-research-engine', engineContext),
      callEngine('product-ip-engine', engineContext),
      callEngine('financial-engine', engineContext),
      callEngine('team-research-engine', engineContext)
    ];
    
    console.log('🚀 Running 5 AI engines in parallel...');
    const engineResults = await Promise.allSettled(enginePromises);
    
    // Process and validate results
    const processedResults = processEngineResults(engineResults);
    
    // Generate comprehensive analysis
    const comprehensiveAnalysis = await generateComprehensiveAnalysis(
      dealData, 
      strategyData, 
      processedResults
    );
    
    // Store results in database
    await storeAnalysisResults(dealId, comprehensiveAnalysis);
    
    console.log('✅ Comprehensive analysis completed for deal:', dealId);
    
    return new Response(JSON.stringify({
      success: true,
      analysis: comprehensiveAnalysis,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Reuben Orchestrator Error:', error);
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

async function fetchDealData(dealId: string) {
  const { data: deal, error } = await supabase
    .from('deals')
    .select('*')
    .eq('id', dealId)
    .single();
    
  if (error || !deal) {
    throw new Error(`Deal not found: ${error?.message}`);
  }
  
  return deal;
}

async function fetchDocumentData(dealId: string) {
  const { data: documents, error } = await supabase
    .from('deal_documents')
    .select('*')
    .eq('deal_id', dealId)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.warn('Warning: Could not fetch documents:', error.message);
    return { documents: [], pitchDeck: null, extractedTexts: [], documentSummary: {} };
  }
  
  const pitchDeck = documents?.find(doc => 
    doc.document_category === 'pitch_deck' || 
    doc.name?.toLowerCase().includes('pitch') ||
    doc.name?.toLowerCase().includes('deck')
  ) || null;
  
  const extractedTexts = documents?.filter(doc => doc.extracted_text && doc.extracted_text.trim().length > 0)
    .map(doc => ({ 
      name: doc.name,
      category: doc.document_category,
      extracted_text: doc.extracted_text,
      parsing_status: doc.parsing_status 
    })) || [];
    
  const documentSummary = {
    total_documents: documents?.length || 0,
    pitch_deck_available: !!pitchDeck,
    documents_with_text: extractedTexts.length,
    categories: documents?.map(d => d.document_category).filter(Boolean) || []
  };
  
  return { 
    documents: documents || [], 
    pitchDeck, 
    extractedTexts, 
    documentSummary 
  };
}

async function fetchFundStrategy(fundId: string) {
  const { data: strategy, error } = await supabase
    .from('investment_strategies')
    .select('*')
    .eq('fund_id', fundId)
    .single();
    
  if (error) {
    console.warn('No fund strategy found, using default analysis criteria');
    return null;
  }
  
  return strategy;
}

async function callEngine(engineName: string, data: any): Promise<EngineResult> {
  try {
    console.log(`🔧 Calling ${engineName}...`);
    
    const { data: result, error } = await supabase.functions.invoke(engineName, {
      body: data
    });
    
    if (error) throw error;
    
    return {
      engine: engineName,
      ...result
    };
  } catch (error) {
    console.error(`❌ Engine ${engineName} failed:`, error);
    
    // Return fallback result with validation flag
    return {
      engine: engineName,
      score: 50,
      analysis: `Unable to complete ${engineName} analysis. Data insufficient or service unavailable.`,
      confidence: 30,
      sources: [],
      data: {},
      validation_status: 'unvalidated'
    };
  }
}

function processEngineResults(engineResults: PromiseSettledResult<EngineResult>[]): any {
  const processed = {
    investment_thesis_alignment: null,
    market_attractiveness: null,
    product_strength_ip: null,
    financial_feasibility: null,
    founder_team_strength: null
  };
  
  const engineNames = [
    'investment_thesis_alignment',
    'market_attractiveness', 
    'product_strength_ip',
    'financial_feasibility',
    'founder_team_strength'
  ];
  
  engineResults.forEach((result, index) => {
    const engineKey = engineNames[index];
    
    if (result.status === 'fulfilled') {
      processed[engineKey] = result.value;
    } else {
      console.error(`Engine ${engineKey} failed:`, result.reason);
      // Create fallback result
      processed[engineKey] = {
        engine: engineKey,
        score: 50,
        analysis: `Analysis failed: ${result.reason?.message || 'Unknown error'}`,
        confidence: 20,
        sources: [],
        data: {},
        validation_status: 'unvalidated'
      };
    }
  });
  
  return processed;
}

async function generateComprehensiveAnalysis(
  dealData: any, 
  strategyData: any, 
  engineResults: any
): Promise<ComprehensiveAnalysis> {
  
  // Calculate overall score using strategy-aware weighting
  const weights = calculateDynamicWeights(strategyData);
  const overallScore = calculateWeightedScore(engineResults, weights);
  
  // Generate executive summary based on all engine results
  const executiveSummary = await generateExecutiveSummary(dealData, engineResults, overallScore);
  
  // Determine overall recommendation
  const recommendation = determineRecommendation(overallScore, engineResults, strategyData);
  
  // Extract risk factors and next steps
  const riskFactors = extractRiskFactors(engineResults);
  const nextSteps = generateNextSteps(engineResults, overallScore);
  
  // Determine overall confidence level
  const confidenceLevel = calculateOverallConfidence(engineResults);
  
  return {
    deal_id: dealData.id,
    executive_summary: executiveSummary,
    overall_score: overallScore,
    overall_recommendation: recommendation,
    confidence_level: confidenceLevel,
    engine_results: engineResults,
    risk_factors: riskFactors,
    next_steps: nextSteps,
    analysis_version: 1,
    timestamp: new Date().toISOString()
  };
}

function calculateDynamicWeights(strategyData: any) {
  // Default weights if no strategy data
  const defaultWeights = {
    investment_thesis_alignment: 0.25,
    market_attractiveness: 0.20,
    product_strength_ip: 0.20,
    financial_feasibility: 0.20,
    founder_team_strength: 0.15
  };
  
  if (!strategyData || !strategyData.enhanced_criteria) return defaultWeights;
  
  // Extract weights from enhanced criteria configuration
  const enhancedCriteria = strategyData.enhanced_criteria;
  if (enhancedCriteria.categories && Array.isArray(enhancedCriteria.categories)) {
    const totalWeight = enhancedCriteria.categories.reduce((sum: number, cat: any) => sum + (cat.weight || 0), 0);
    
    if (totalWeight > 0) {
      const adjustedWeights = { ...defaultWeights };
      
      // Map enhanced criteria categories to engine weights
      enhancedCriteria.categories.forEach((category: any) => {
        const normalizedWeight = category.weight / totalWeight;
        
        switch (category.name.toLowerCase()) {
          case 'strategic fit':
          case 'investment thesis alignment':
            adjustedWeights.investment_thesis_alignment = normalizedWeight;
            break;
          case 'market opportunity':
          case 'market attractiveness':
            adjustedWeights.market_attractiveness = normalizedWeight;
            break;
          case 'product & technology':
          case 'product strength':
            adjustedWeights.product_strength_ip = normalizedWeight;
            break;
          case 'financial health':
          case 'financial feasibility':
            adjustedWeights.financial_feasibility = normalizedWeight;
            break;
          case 'team & leadership':
          case 'founder team':
            adjustedWeights.founder_team_strength = normalizedWeight;
            break;
        }
      });
      
      return adjustedWeights;
    }
  }
  
  return defaultWeights;
}

function calculateWeightedScore(engineResults: any, weights: any): number {
  let totalScore = 0;
  let totalWeight = 0;
  
  Object.keys(weights).forEach(engine => {
    const result = engineResults[engine];
    if (result && result.score !== undefined) {
      totalScore += result.score * weights[engine];
      totalWeight += weights[engine];
    }
  });
  
  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 50;
}

async function generateExecutiveSummary(dealData: any, engineResults: any, overallScore: number, strategyData: any = null): Promise<string> {
  const investmentPhilosophy = strategyData?.investment_philosophy 
    ? `Investment Philosophy: ${strategyData.investment_philosophy}\n`
    : '';
  
  const prompt = `Generate a concise executive summary (2-3 sentences) for this investment opportunity:

Company: ${dealData.company_name}
Industry: ${dealData.industry || 'N/A'}
Overall Score: ${overallScore}/100

${investmentPhilosophy}Engine Analysis Results:
- Investment Thesis Alignment: ${engineResults.investment_thesis_alignment?.score || 'N/A'}/100
- Market Attractiveness: ${engineResults.market_attractiveness?.score || 'N/A'}/100  
- Product & IP Strength: ${engineResults.product_strength_ip?.score || 'N/A'}/100
- Financial Feasibility: ${engineResults.financial_feasibility?.score || 'N/A'}/100
- Founder & Team Strength: ${engineResults.founder_team_strength?.score || 'N/A'}/100

Focus on the key investment thesis and overall attractiveness. Be concise and actionable. ${investmentPhilosophy ? 'Consider the fund\'s investment philosophy in your assessment.' : ''}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: 'You are a concise investment analyst. Generate executive summaries that highlight key investment decisions factors in 2-3 sentences.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 200
      }),
    });

    if (!response.ok) throw new Error('OpenAI API error');
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating executive summary:', error);
    return `${dealData.company_name} scores ${overallScore}/100 across key investment criteria. Analysis shows ${overallScore >= 70 ? 'strong potential' : overallScore >= 50 ? 'moderate potential' : 'limited potential'} as an investment opportunity based on available data.`;
  }
}

function determineRecommendation(overallScore: number, engineResults: any, strategyData: any): string {
  const thresholds = strategyData ? {
    exciting: strategyData.exciting_threshold || 85,
    promising: strategyData.promising_threshold || 70,
    needs_development: strategyData.needs_development_threshold || 50
  } : { exciting: 85, promising: 70, needs_development: 50 };
  
  if (overallScore >= thresholds.exciting) {
    return "STRONG RECOMMEND - Proceed to IC presentation";
  } else if (overallScore >= thresholds.promising) {
    return "QUALIFIED RECOMMEND - Conduct deeper due diligence";
  } else if (overallScore >= thresholds.needs_development) {
    return "MONITOR - Revisit when more data available";
  } else {
    return "PASS - Does not meet investment criteria";
  }
}

function extractRiskFactors(engineResults: any): string[] {
  const riskFactors: string[] = [];
  
  Object.values(engineResults).forEach((result: any) => {
    if (result && result.score < 60) {
      riskFactors.push(`${result.engine}: ${result.analysis.substring(0, 100)}...`);
    }
  });
  
  return riskFactors.length > 0 ? riskFactors : ["No major risk factors identified in current analysis"];
}

function generateNextSteps(engineResults: any, overallScore: number): string[] {
  if (overallScore >= 70) {
    return [
      "Schedule IC presentation",
      "Conduct financial deep dive",
      "Reference checks on founding team",
      "Competitive landscape analysis"
    ];
  } else if (overallScore >= 50) {
    return [
      "Gather additional financial documentation",
      "Conduct market validation studies", 
      "Request updated business plan",
      "Schedule follow-up call with founders"
    ];
  } else {
    return [
      "Monitor for significant developments",
      "Request major product updates",
      "Re-evaluate if funding round progresses"
    ];
  }
}

function calculateOverallConfidence(engineResults: any): 'high' | 'medium' | 'low' {
  const confidenceScores = Object.values(engineResults)
    .map((result: any) => result?.confidence || 0)
    .filter(score => score > 0);
    
  if (confidenceScores.length === 0) return 'low';
  
  const avgConfidence = confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length;
  
  if (avgConfidence >= 80) return 'high';
  if (avgConfidence >= 60) return 'medium';
  return 'low';
}

async function storeAnalysisResults(dealId: string, analysis: ComprehensiveAnalysis) {
  try {
    // Store in deal_analyses table
    const { error: analysisError } = await supabase
      .from('deal_analyses')
      .upsert({
        deal_id: dealId,
        engine_results: analysis.engine_results,
        analysis_version: analysis.analysis_version,
        confidence_scores: {
          investment_thesis_alignment: analysis.engine_results.investment_thesis_alignment?.confidence,
          market_attractiveness: analysis.engine_results.market_attractiveness?.confidence,
          product_strength_ip: analysis.engine_results.product_strength_ip?.confidence,
          financial_feasibility: analysis.engine_results.financial_feasibility?.confidence,
          founder_team_strength: analysis.engine_results.founder_team_strength?.confidence,
          overall: analysis.confidence_level
        },
        data_sources: extractDataSources(analysis.engine_results),
        validation_flags: extractValidationFlags(analysis.engine_results),
        
        // Legacy fields for backward compatibility
        thesis_alignment_score: analysis.engine_results.investment_thesis_alignment?.score,
        thesis_alignment_notes: analysis.engine_results.investment_thesis_alignment?.analysis,
        market_score: analysis.engine_results.market_attractiveness?.score,
        market_notes: analysis.engine_results.market_attractiveness?.analysis,
        product_score: analysis.engine_results.product_strength_ip?.score,
        product_notes: analysis.engine_results.product_strength_ip?.analysis,
        financial_score: analysis.engine_results.financial_feasibility?.score,
        financial_notes: analysis.engine_results.financial_feasibility?.analysis,
        leadership_score: analysis.engine_results.founder_team_strength?.score,
        leadership_notes: analysis.engine_results.founder_team_strength?.analysis,
        analyzed_at: new Date().toISOString()
      });
      
    if (analysisError) {
      console.error('Error storing analysis:', analysisError);
    }
    
    // Update deal with overall score
    const { error: dealError } = await supabase
      .from('deals')
      .update({
        overall_score: analysis.overall_score,
        score_level: analysis.overall_score >= 85 ? 'exciting' : 
                    analysis.overall_score >= 70 ? 'promising' : 'needs_development'
      })
      .eq('id', dealId);
      
    if (dealError) {
      console.error('Error updating deal score:', dealError);
    }
    
  } catch (error) {
    console.error('Error storing analysis results:', error);
  }
}

function extractDataSources(engineResults: any): any {
  const sources: any = {};
  
  Object.entries(engineResults).forEach(([engine, result]: [string, any]) => {
    if (result?.sources) {
      sources[engine] = result.sources;
    }
  });
  
  return sources;
}

function extractValidationFlags(engineResults: any): any {
  const flags: any = {};
  
  Object.entries(engineResults).forEach(([engine, result]: [string, any]) => {
    if (result?.validation_status) {
      flags[engine] = result.validation_status;
    }
  });
  
  return flags;
}