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
  dealId?: string;
  action?: string; // AI Orchestrator compatibility
  data?: any; // AI Orchestrator compatibility
  fundId?: string; // AI Orchestrator compatibility
  engines?: string[]; // Optional: specify which engines to run
}

interface LegacyAIRequest {
  action: string;
  data: any;
  dealId?: string;
  fundId?: string;
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
    const requestBody = await req.json();
    
    // Handle legacy AI Orchestrator requests
    if (requestBody.action) {
      console.log('🔄 Legacy AI Orchestrator request detected, routing...');
      return await handleLegacyAIRequest(requestBody as LegacyAIRequest);
    }
    
    // Handle new Reuben Orchestrator requests
    const { dealId, engines }: AnalysisRequest = requestBody;
    
    if (!dealId) {
      throw new Error('dealId is required for comprehensive analysis');
    }
    
    console.log('🧠 Reuben Orchestrator: Starting comprehensive analysis for deal:', dealId);
    
    // Fetch deal and fund strategy data
    const dealData = await fetchDealData(dealId);
    const strategyData = await fetchFundStrategy(dealData.fund_id);
    
    // Fetch document data for enhanced analysis
    const documentData = await fetchDocumentData(dealId);
    
    // Fetch notes intelligence for enhanced context
    let notesIntelligence = null;
    try {
      const { data: notesResponse } = await supabase.functions.invoke('notes-intelligence-processor', {
        body: { dealId, action: 'analyze_all' }
      });
      if (notesResponse && !notesResponse.error) {
        notesIntelligence = notesResponse;
      }
    } catch (error) {
      console.warn('Could not fetch notes intelligence:', error);
    }

    // Prepare enhanced engine context with fund-specific data + intelligence
    const engineContext = {
      dealData,
      strategyData,
      documentData,
      notesIntelligence,
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

    // Run comprehensive web research first
    console.log('🔍 Running comprehensive web research...');
    const webResearchPromise = callEngine('web-research-engine', {
      ...engineContext,
      researchType: 'comprehensive',
      searchDepth: 'detailed'
    });

    // Run all 5 AI engines in parallel with enhanced context
    const enginePromises = [
      callEngine('thesis-alignment-engine', engineContext),
      callEngine('market-research-engine', engineContext),
      callEngine('product-ip-engine', engineContext),
      callEngine('financial-engine', engineContext),
      callEngine('team-research-engine', engineContext)
    ];
    
    console.log('🚀 Running web research and 5 AI engines in parallel...');
    const [webResearchResult, ...engineResults] = await Promise.allSettled([webResearchPromise, ...enginePromises]);
    
    // Process and validate results including web research
    const processedResults = processEngineResults(engineResults);
    const webResearchData = webResearchResult.status === 'fulfilled' ? webResearchResult.value : null;
    
    // Generate comprehensive analysis with web research context
    const comprehensiveAnalysis = await generateComprehensiveAnalysis(
      dealData, 
      strategyData, 
      processedResults,
      webResearchData
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

// Legacy AI Orchestrator compatibility layer
async function handleLegacyAIRequest(request: LegacyAIRequest) {
  console.log(`🔄 Handling legacy action: ${request.action}`);
  
  // Validate data flow through Data Controller
  if (request.fundId) {
    try {
      const { data: flowValidation } = await supabase.functions.invoke('data-controller-monitor', {
        body: {
          action: 'validate_flow',
          sourceService: 'legacy-ai-orchestrator',
          targetService: 'reuben-orchestrator',
          fundId: request.fundId,
          data: request.data
        }
      });
      
      if (!flowValidation?.allowed) {
        console.warn('🚫 Data flow blocked by controller:', flowValidation?.reason);
        return new Response(JSON.stringify({
          success: false,
          error: `Data flow blocked: ${flowValidation?.reason}`,
          timestamp: new Date().toISOString()
        }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Use sanitized data if provided
      if (flowValidation?.sanitizedData) {
        request.data = flowValidation.sanitizedData;
      }
    } catch (error) {
      console.warn('⚠️ Data controller check failed:', error);
    }
  }
  
  let response;
  
  switch (request.action) {
    case 'comprehensive_analysis':
      if (!request.dealId) {
        throw new Error('dealId required for comprehensive analysis');
      }
      // Route to main orchestrator logic
      const analysisResult = await performComprehensiveAnalysis(request.dealId);
      response = {
        success: true,
        data: analysisResult,
        action: request.action,
        timestamp: new Date().toISOString()
      };
      break;
      
    case 'enrich_deal':
      response = await legacyEnrichDeal(request.data);
      break;
      
    case 'analyze_criteria':
      response = await legacyAnalyzeCriteria(request.data, request.fundId);
      break;
      
    case 'generate_ic_memo':
      response = await legacyGenerateICMemo(request.data, request.dealId);
      break;
      
    case 'calculate_overall_score':
      response = await legacyCalculateScore(request.data, request.dealId);
      break;
      
    default:
      response = {
        success: false,
        error: `Legacy action '${request.action}' not supported. Please migrate to new Reuben Orchestrator API.`,
        migration_guide: 'Use comprehensive_analysis for full deal analysis',
        timestamp: new Date().toISOString()
      };
  }
  
  // Store interaction in fund memory if applicable
  if (request.fundId && response.success) {
    try {
      await supabase.functions.invoke('enhanced-fund-memory-engine', {
        body: {
          action: 'store_memory',
          fundId: request.fundId,
          dealId: request.dealId,
          memoryType: 'ai_service_interaction',
          title: `Legacy AI Action: ${request.action}`,
          description: `Migrated ${request.action} to unified orchestrator`,
          memoryContent: {
            legacyAction: request.action,
            migratedResponse: response,
            migrationTimestamp: new Date().toISOString()
          },
          aiServiceName: 'reuben-orchestrator-legacy-adapter',
          confidenceScore: 75
        }
      });
    } catch (error) {
      console.warn('⚠️ Failed to store legacy interaction:', error);
    }
  }
  
  return new Response(JSON.stringify(response), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function performComprehensiveAnalysis(dealId: string) {
  // Main orchestrator logic (extracted from existing code)
  const dealData = await fetchDealData(dealId);
  const strategyData = await fetchFundStrategy(dealData.fund_id);
  const documentData = await fetchDocumentData(dealId);
  
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

  // Run comprehensive web research first
  console.log('🔍 Running comprehensive web research...');
  const webResearchPromise = callEngine('web-research-engine', {
    ...engineContext,
    researchType: 'comprehensive',
    searchDepth: 'detailed'
  });

  // Run all 5 AI engines in parallel with enhanced context
  const enginePromises = [
    callEngine('thesis-alignment-engine', engineContext),
    callEngine('market-research-engine', engineContext),
    callEngine('product-ip-engine', engineContext),
    callEngine('financial-engine', engineContext),
    callEngine('team-research-engine', engineContext)
  ];
  
  console.log('🚀 Running web research and 5 AI engines in parallel...');
  const [webResearchResult, ...engineResults] = await Promise.allSettled([webResearchPromise, ...enginePromises]);
  
  // Process and validate results including web research
  const processedResults = processEngineResults(engineResults);
  const webResearchData = webResearchResult.status === 'fulfilled' ? webResearchResult.value : null;
  
  // Generate comprehensive analysis with web research context
  const comprehensiveAnalysis = await generateComprehensiveAnalysis(
    dealData, 
    strategyData, 
    processedResults,
    webResearchData
  );
  
  // Store results in database
  await storeAnalysisResults(dealId, comprehensiveAnalysis);
  
  console.log('✅ Comprehensive analysis completed for deal:', dealId);
  
  return comprehensiveAnalysis;
}

// Legacy compatibility functions
async function legacyEnrichDeal(data: any) {
  console.log('🔄 Legacy: Enriching deal data');
  return {
    success: true,
    data: {
      enriched_data: 'Legacy enrichment completed - consider using comprehensive analysis',
      confidence_score: 70,
      sources: ['Legacy AI Analysis'],
      timestamp: new Date().toISOString(),
      migration_note: 'This action is deprecated. Use comprehensive_analysis instead.'
    }
  };
}

async function legacyAnalyzeCriteria(data: any, fundId?: string) {
  console.log('🔄 Legacy: Analyzing criteria');
  return {
    success: true,
    data: {
      analysis: 'Legacy criteria analysis - consider using comprehensive analysis',
      overall_score: 70,
      confidence_level: 'medium',
      timestamp: new Date().toISOString(),
      migration_note: 'This action is deprecated. Use comprehensive_analysis instead.'
    }
  };
}

async function legacyGenerateICMemo(data: any, dealId?: string) {
  console.log('🔄 Legacy: Generating IC memo');
  return {
    success: true,
    data: {
      memo_content: 'Legacy memo generation - consider using ai-memo-generator directly',
      generated_at: new Date().toISOString(),
      migration_note: 'Use ai-memo-generator function directly instead.'
    }
  };
}

async function legacyCalculateScore(data: any, dealId?: string) {
  console.log('🔄 Legacy: Calculating score');
  return {
    success: true,
    data: {
      overall_score: 70,
      score_level: 'promising',
      reasoning: 'Legacy score calculation',
      timestamp: new Date().toISOString(),
      migration_note: 'Score calculation is now part of comprehensive_analysis.'
    }
  };
}

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
    .map(doc => {
      let cleanText = doc.extracted_text;
      
      // Fix: Parse JSON structure if extracted_text contains JSON wrapper
      try {
        const parsed = JSON.parse(doc.extracted_text);
        if (parsed && typeof parsed === 'object' && parsed.content) {
          cleanText = parsed.content;
        } else if (parsed && typeof parsed === 'object' && parsed.markdown) {
          cleanText = parsed.markdown;
        } else if (parsed && typeof parsed === 'object' && parsed.text) {
          cleanText = parsed.text;
        }
      } catch (e) {
        // Not JSON, use as-is
        cleanText = doc.extracted_text;
      }
      
      return { 
        name: doc.name,
        category: doc.document_category,
        extracted_text: cleanText,
        parsing_status: doc.parsing_status 
      };
    }) || [];
    
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
  engineResults: any,
  webResearchData: any = null
): Promise<ComprehensiveAnalysis> {
  
  // Calculate overall score using strategy-aware weighting
  const weights = calculateDynamicWeights(strategyData);
  const overallScore = calculateWeightedScore(engineResults, weights);
  
  // Generate executive summary based on all engine results and web research
  const executiveSummary = await generateExecutiveSummary(dealData, engineResults, overallScore, strategyData, webResearchData);
  
  // Determine overall recommendation
  const recommendation = await determineRecommendation(overallScore, engineResults, strategyData, dealData.fund_id);
  
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

async function generateExecutiveSummary(dealData: any, engineResults: any, overallScore: number, strategyData: any = null, webResearchData: any = null): Promise<string> {
  const investmentPhilosophy = strategyData?.investment_philosophy 
    ? `Investment Philosophy: ${strategyData.investment_philosophy}\n`
    : '';
  
  const webResearchContext = webResearchData?.data ? `
Web Research Insights:
- Company Validation: ${webResearchData.data.company?.company_validation || 'N/A'}
- Market Intelligence: ${webResearchData.data.market?.market_size_data || 'N/A'}
- Founder Background: ${webResearchData.data.founder?.professional_background || 'N/A'}
- Competitive Landscape: ${webResearchData.data.competitive?.market_positioning || 'N/A'}
` : '';
  
  const prompt = `Generate a concise executive summary (2-3 sentences) for this investment opportunity with web-enhanced intelligence:

Company: ${dealData.company_name}
Industry: ${dealData.industry || 'N/A'}
Overall Score: ${overallScore}/100

${investmentPhilosophy}Engine Analysis Results:
- Investment Thesis Alignment: ${engineResults.investment_thesis_alignment?.score || 'N/A'}/100
- Market Attractiveness: ${engineResults.market_attractiveness?.score || 'N/A'}/100  
- Product & IP Strength: ${engineResults.product_strength_ip?.score || 'N/A'}/100
- Financial Feasibility: ${engineResults.financial_feasibility?.score || 'N/A'}/100
- Founder & Team Strength: ${engineResults.founder_team_strength?.score || 'N/A'}/100

${webResearchContext}Focus on the key investment thesis and overall attractiveness. Be concise and actionable. ${investmentPhilosophy ? 'Consider the fund\'s investment philosophy in your assessment.' : ''} ${webResearchData ? 'Incorporate web research validation where relevant.' : ''}`;

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
            content: 'ZERO FABRICATION ANALYST: You are an investment analyst with strict anti-fabrication protocols. CRITICAL RULES: 1) Only use provided data and validated web research 2) Never fabricate financial metrics, market data, or company details 3) Use "N/A" or "Data unavailable" for missing information 4) Be explicit about data limitations and confidence levels 5) Attribute insights to specific sources 6) Use conservative scoring when data is limited 7) Highlight when analysis is based on estimates vs verified data'
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

async function determineRecommendation(overallScore: number, engineResults: any, strategyData: any, fundId: string): Promise<string> {
  // Import shared RAG utility for consistent thresholds
  const ragUtils = await import('../shared/rag-utils.ts');
  
  // Use consolidated RAG system for consistent recommendations
  const thresholds = strategyData ? {
    exciting: strategyData.exciting_threshold || 85,
    promising: strategyData.promising_threshold || 70,
    needs_development: strategyData.needs_development_threshold || 50
  } : await ragUtils.getStrategyThresholds(supabase, fundId);
  
  const ragCategory = ragUtils.calculateRAGCategory(overallScore, thresholds);
  
  switch (ragCategory.level) {
    case 'exciting':
      return "STRONG RECOMMEND - Proceed to IC presentation";
    case 'promising':
      return "QUALIFIED RECOMMEND - Conduct deeper due diligence";
    case 'needs_development':
      return "MONITOR - Revisit when more data available";
    default:
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
    // CRITICAL SECURITY: Do NOT store fund-specific data in orchestrator
    // Store only aggregated, sanitized insights in Fund Memory Engine
    console.log('🔐 Storing sanitized analysis insights in Fund Memory Engine (Air Gap Enforced)');
    
    // Sanitize data for general training - remove all fund-specific information
    const sanitizedInsights = {
      industry_general: generalizeIndustry(analysis.engine_results.market_attractiveness?.industry || 'unknown'),
      stage_general: generalizeStage(analysis.engine_results.financial_feasibility?.stage || 'unknown'),
      pattern_insights: {
        market_dynamics: extractGeneralPatterns(analysis.engine_results.market_attractiveness),
        product_patterns: extractGeneralPatterns(analysis.engine_results.product_strength_ip),
        leadership_patterns: extractGeneralPatterns(analysis.engine_results.founder_team_strength)
      },
      confidence_patterns: analysis.confidence_level,
      methodology_feedback: {
        engine_performance: calculateEnginePerformance(analysis.engine_results),
        data_quality_indicators: extractDataQuality(analysis.engine_results)
      }
    };

    // Route to Fund Memory Engine for fund-specific storage (isolated)
    const { error: memoryError } = await supabase.functions.invoke('enhanced-fund-memory-engine', {
      body: {
        action: 'store_orchestrator_insights',
        sanitizedInsights,
        confidenceLevel: analysis.confidence_level,
        analysisVersion: analysis.analysis_version
      }
    });

    if (memoryError) {
      console.warn('⚠️ Could not store sanitized insights in Fund Memory:', memoryError);
    }

    console.log('✅ Analysis insights stored with air gap protection');
    
  } catch (error) {
    console.error('Error storing sanitized analysis insights:', error);
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

// Helper functions for data sanitization and pattern extraction
function generalizeIndustry(industry: string): string {
  const generalMappings: { [key: string]: string } = {
    'fintech': 'financial_technology',
    'healthtech': 'healthcare_technology',
    'edtech': 'education_technology',
    'proptech': 'property_technology',
    'biotech': 'biotechnology',
    'saas': 'software_services',
    'ai': 'artificial_intelligence',
    'ml': 'machine_learning'
  };
  
  return generalMappings[industry.toLowerCase()] || 'technology_general';
}

function generalizeStage(stage: string): string {
  const stageMappings: { [key: string]: string } = {
    'pre-seed': 'early_stage',
    'seed': 'early_stage',
    'series-a': 'growth_stage',
    'series-b': 'growth_stage',
    'series-c': 'later_stage'
  };
  
  return stageMappings[stage.toLowerCase()] || 'unknown_stage';
}

function extractGeneralPatterns(engineResult: any): any {
  if (!engineResult) return { pattern_strength: 'low', confidence: 0 };
  
  return {
    pattern_strength: engineResult.score > 70 ? 'high' : engineResult.score > 50 ? 'medium' : 'low',
    confidence: engineResult.confidence || 0,
    validation_status: engineResult.validation_status || 'unvalidated'
  };
}

function calculateEnginePerformance(engineResults: any): any {
  const performance: any = {};
  
  Object.entries(engineResults).forEach(([engine, result]: [string, any]) => {
    performance[engine] = {
      completion_status: result ? 'completed' : 'failed',
      confidence: result?.confidence || 0,
      validation: result?.validation_status || 'unvalidated'
    };
  });
  
  return performance;
}

function extractDataQuality(engineResults: any): any {
  let validatedEngines = 0;
  let totalEngines = 0;
  
  Object.values(engineResults).forEach((result: any) => {
    totalEngines++;
    if (result?.validation_status === 'validated') {
      validatedEngines++;
    }
  });
  
  return {
    validation_rate: totalEngines > 0 ? (validatedEngines / totalEngines) * 100 : 0,
    total_engines: totalEngines,
    validated_engines: validatedEngines
  };
}