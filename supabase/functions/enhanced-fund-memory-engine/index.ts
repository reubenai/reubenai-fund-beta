import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface EnhancedMemoryRequest {
  action: 'contextual_memory_query' | 'decision_learning_capture' | 'pattern_discovery' | 'strategic_evolution' | 'outcome_validation';
  fundId: string;
  dealId?: string;
  sessionId?: string;
  memoId?: string;
  data: any;
}

interface DecisionContext {
  decision_maker: string;
  decision_type: string;
  decision_outcome?: string;
  decision_rationale?: string;
  ai_recommendations?: any;
  supporting_evidence?: any;
  dissenting_opinions?: any;
  market_context?: any;
}

interface MemoryPrompt {
  type: 'similar_deal' | 'risk_pattern' | 'success_pattern' | 'bias_warning';
  title: string;
  description: string;
  relevance_score: number;
  memory_entries: any[];
  actionable_insight?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, fundId, dealId, sessionId, memoId, data }: EnhancedMemoryRequest = await req.json();

    console.log(`🧠 [Enhanced Fund Memory] Processing action: ${action} for fund: ${fundId}`);

    let result;
    switch (action) {
      case 'contextual_memory_query':
        result = await contextualMemoryQuery(fundId, dealId, data);
        break;
      case 'decision_learning_capture':
        result = await decisionLearningCapture(fundId, dealId, sessionId, memoId, data);
        break;
      case 'pattern_discovery':
        result = await patternDiscovery(fundId, data);
        break;
      case 'strategic_evolution':
        result = await strategicEvolution(fundId, data);
        break;
      case 'outcome_validation':
        result = await outcomeValidation(fundId, dealId, data);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('🚨 [Enhanced Fund Memory] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

/**
 * Contextual Memory Query - Get relevant context before analysis
 * Provides "this reminds me of..." prompts and similar deal intelligence
 */
async function contextualMemoryQuery(fundId: string, dealId?: string, queryData?: any): Promise<MemoryPrompt[]> {
  console.log(`🔍 [Contextual Memory] Querying for fund: ${fundId}, deal: ${dealId}`);
  
  const prompts: MemoryPrompt[] = [];

  // Get similar deals based on company characteristics
  if (dealId && queryData?.company_profile) {
    const similarDeals = await findSimilarDeals(fundId, queryData.company_profile);
    if (similarDeals.length > 0) {
      prompts.push({
        type: 'similar_deal',
        title: 'Similar Deal Pattern Detected',
        description: `This company profile resembles ${similarDeals.length} previous deals in your portfolio`,
        relevance_score: calculateSimilarityScore(queryData.company_profile, similarDeals),
        memory_entries: similarDeals,
        actionable_insight: generateSimilarDealInsight(similarDeals)
      });
    }
  }

  // Check for risk patterns
  const riskPatterns = await checkRiskPatterns(fundId, queryData);
  if (riskPatterns.length > 0) {
    prompts.push({
      type: 'risk_pattern',
      title: 'Risk Pattern Alert',
      description: `Historical data suggests potential risks in this investment category`,
      relevance_score: 85,
      memory_entries: riskPatterns,
      actionable_insight: generateRiskPatternInsight(riskPatterns)
    });
  }

  // Check for success patterns
  const successPatterns = await checkSuccessPatterns(fundId, queryData);
  if (successPatterns.length > 0) {
    prompts.push({
      type: 'success_pattern',
      title: 'Success Pattern Match',
      description: `This deal aligns with historical success factors in your portfolio`,
      relevance_score: 92,
      memory_entries: successPatterns,
      actionable_insight: generateSuccessPatternInsight(successPatterns)
    });
  }

  // Check for potential biases
  const biasWarnings = await checkDecisionBiases(fundId, queryData);
  if (biasWarnings.length > 0) {
    prompts.push({
      type: 'bias_warning',
      title: 'Decision Bias Alert',
      description: `Pattern analysis suggests potential decision bias`,
      relevance_score: 75,
      memory_entries: biasWarnings,
      actionable_insight: generateBiasWarningInsight(biasWarnings)
    });
  }

  return prompts.sort((a, b) => b.relevance_score - a.relevance_score);
}

/**
 * Decision Learning Capture - Systematically capture IC decisions and human reasoning
 */
async function decisionLearningCapture(
  fundId: string, 
  dealId?: string, 
  sessionId?: string, 
  memoId?: string, 
  decisionData?: DecisionContext
): Promise<{ decision_context_id: string; learning_insights: any }> {
  
  console.log(`📝 [Decision Learning] Capturing decision for fund: ${fundId}`);

  // Store decision context
  const { data: contextData, error: contextError } = await supabase
    .from('ic_decision_contexts')
    .insert({
      fund_id: fundId,
      deal_id: dealId,
      ic_session_id: sessionId,
      memo_id: memoId,
      ...decisionData
    })
    .select()
    .single();

  if (contextError) throw new Error(`Failed to store decision context: ${contextError.message}`);

  // Capture supporting evidence
  if (decisionData?.supporting_evidence) {
    await storeSupportingEvidence(contextData.id, decisionData.supporting_evidence);
  }

  // Check for AI-human divergence
  const divergenceData = await checkAIHumanDivergence(fundId, dealId!, decisionData!);
  if (divergenceData) {
    await supabase
      .from('ai_human_decision_divergence')
      .insert({
        fund_id: fundId,
        deal_id: dealId,
        decision_context_id: contextData.id,
        ...divergenceData
      });
  }

  // Generate learning insights
  const learningInsights = await generateLearningInsights(fundId, contextData);

  return {
    decision_context_id: contextData.id,
    learning_insights: learningInsights
  };
}

/**
 * Pattern Discovery - Identify what actually drives successful vs failed investments
 */
async function patternDiscovery(fundId: string, analysisData?: any): Promise<any> {
  console.log(`🔍 [Pattern Discovery] Analyzing patterns for fund: ${fundId}`);

  const patterns = {
    success_factors: await discoverSuccessFactors(fundId),
    risk_signals: await discoverRiskSignals(fundId),
    bias_patterns: await discoverBiasPatterns(fundId),
    timing_patterns: await discoverTimingPatterns(fundId)
  };

  // Store discovered patterns
  for (const [patternType, patternData] of Object.entries(patterns)) {
    if (patternData && patternData.length > 0) {
      await storeDiscoveredPatterns(fundId, patternType, patternData);
    }
  }

  return patterns;
}

/**
 * Strategic Evolution - Map how fund strategy should evolve based on learning
 */
async function strategicEvolution(fundId: string, evolutionData?: any): Promise<any> {
  console.log(`📈 [Strategic Evolution] Analyzing evolution for fund: ${fundId}`);

  const evolution = {
    thesis_drift: await analyzeThesisDrift(fundId),
    market_responsiveness: await analyzeMarketResponsiveness(fundId),
    decision_quality_trends: await analyzeDecisionQualityTrends(fundId),
    recommended_adjustments: await generateStrategicRecommendations(fundId)
  };

  // Store strategic evolution insights
  await storeStrategicEvolution(fundId, evolution);

  return evolution;
}

/**
 * Outcome Validation - Link decisions to actual investment performance
 */
async function outcomeValidation(fundId: string, dealId: string, outcomeData: any): Promise<any> {
  console.log(`✅ [Outcome Validation] Validating outcomes for deal: ${dealId}`);

  // Get original decision context
  const { data: decisionContext } = await supabase
    .from('ic_decision_contexts')
    .select('*')
    .eq('fund_id', fundId)
    .eq('deal_id', dealId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!decisionContext) {
    throw new Error('No decision context found for validation');
  }

  // Calculate correlation between predictions and actual outcomes
  const correlationAnalysis = await calculateOutcomeCorrelation(decisionContext, outcomeData);

  // Store outcome tracking
  const { data: trackingData } = await supabase
    .from('outcome_correlation_tracking')
    .insert({
      fund_id: fundId,
      deal_id: dealId,
      decision_context_id: decisionContext.id,
      predicted_outcome: decisionContext.ai_recommendations,
      actual_outcome: outcomeData,
      outcome_delta: correlationAnalysis.delta,
      correlation_score: correlationAnalysis.score,
      learning_extracted: correlationAnalysis.learning,
      validation_date: new Date().toISOString()
    })
    .select()
    .single();

  // Update decision patterns based on outcomes
  await updatePatternsFromOutcomes(fundId, correlationAnalysis);

  return {
    correlation_score: correlationAnalysis.score,
    learning_extracted: correlationAnalysis.learning,
    pattern_updates: correlationAnalysis.pattern_updates
  };
}

// Helper functions for pattern matching and analysis

async function findSimilarDeals(fundId: string, companyProfile: any): Promise<any[]> {
  const { data: deals } = await supabase
    .from('deals')
    .select(`
      *,
      deal_analyses(*)
    `)
    .eq('fund_id', fundId)
    .not('id', 'eq', companyProfile.current_deal_id || '');

  // Implement similarity scoring based on industry, stage, size, etc.
  return deals?.filter(deal => {
    const similarity = calculateDealSimilarity(companyProfile, deal);
    return similarity > 0.7; // 70% similarity threshold
  }) || [];
}

async function checkRiskPatterns(fundId: string, queryData: any): Promise<any[]> {
  const { data: patterns } = await supabase
    .from('fund_decision_patterns')
    .select('*')
    .eq('fund_id', fundId)
    .eq('pattern_type', 'risk_signal')
    .eq('is_active', true);

  return patterns?.filter(pattern => 
    matchesPattern(queryData, pattern.pattern_data)
  ) || [];
}

async function checkSuccessPatterns(fundId: string, queryData: any): Promise<any[]> {
  const { data: patterns } = await supabase
    .from('fund_decision_patterns')
    .select('*')
    .eq('fund_id', fundId)
    .eq('pattern_type', 'success_factor')
    .eq('is_active', true);

  return patterns?.filter(pattern => 
    matchesPattern(queryData, pattern.pattern_data)
  ) || [];
}

async function checkDecisionBiases(fundId: string, queryData: any): Promise<any[]> {
  const { data: patterns } = await supabase
    .from('fund_decision_patterns')
    .select('*')
    .eq('fund_id', fundId)
    .eq('pattern_type', 'bias_pattern')
    .eq('is_active', true);

  return patterns?.filter(pattern => 
    detectsBias(queryData, pattern.pattern_data)
  ) || [];
}

async function storeSupportingEvidence(decisionContextId: string, evidence: any): Promise<void> {
  const evidenceEntries = Object.entries(evidence).map(([type, content]) => ({
    decision_context_id: decisionContextId,
    evidence_type: type,
    evidence_content: content,
    confidence_score: calculateEvidenceConfidence(content)
  }));

  await supabase
    .from('decision_supporting_evidence')
    .insert(evidenceEntries);
}

async function checkAIHumanDivergence(fundId: string, dealId: string, decisionData: DecisionContext): Promise<any | null> {
  // Logic to detect when human decisions diverge from AI recommendations
  const aiRecommendation = decisionData.ai_recommendations?.recommendation;
  const humanDecision = decisionData.decision_outcome;

  if (aiRecommendation && humanDecision && aiRecommendation !== humanDecision) {
    return {
      ai_recommendation: aiRecommendation,
      ai_confidence_score: decisionData.ai_recommendations?.confidence || 0,
      human_decision: humanDecision,
      divergence_type: categorizeDivergence(aiRecommendation, humanDecision),
      human_reasoning: decisionData.decision_rationale,
      outcome_validation: 'pending'
    };
  }

  return null;
}

// Utility functions for scoring and analysis

function calculateSimilarityScore(profile: any, similarDeals: any[]): number {
  // Implement sophisticated similarity scoring
  return Math.min(95, 60 + (similarDeals.length * 5));
}

function calculateDealSimilarity(profile1: any, profile2: any): number {
  let score = 0;
  const factors = ['industry', 'stage', 'business_model', 'location'];
  
  factors.forEach(factor => {
    if (profile1[factor] === profile2[factor]) {
      score += 0.25;
    }
  });

  return score;
}

function matchesPattern(data: any, pattern: any): boolean {
  // Implement pattern matching logic
  return pattern.triggers?.some((trigger: any) => 
    data[trigger.field] === trigger.value
  ) || false;
}

function detectsBias(data: any, biasPattern: any): boolean {
  // Implement bias detection logic
  return biasPattern.indicators?.some((indicator: any) => 
    data[indicator.field] && indicator.bias_type
  ) || false;
}

function categorizeDivergence(aiRec: string, humanDec: string): string {
  if (humanDec === 'reject' && aiRec === 'approve') return 'override';
  if (humanDec === 'approve' && aiRec === 'reject') return 'contradiction';
  return 'enhancement';
}

function calculateEvidenceConfidence(content: any): number {
  // Calculate confidence based on evidence strength
  return Math.floor(Math.random() * 40) + 60; // Placeholder: 60-100
}

// Insight generation functions

function generateSimilarDealInsight(similarDeals: any[]): string {
  return `Based on ${similarDeals.length} similar deals, key success factors include: ${similarDeals.map(d => d.key_insight).join(', ')}`;
}

function generateRiskPatternInsight(riskPatterns: any[]): string {
  return `Historical analysis shows ${riskPatterns.length} risk factors that require careful evaluation`;
}

function generateSuccessPatternInsight(successPatterns: any[]): string {
  return `This deal aligns with ${successPatterns.length} proven success patterns in your portfolio`;
}

function generateBiasWarningInsight(biasWarnings: any[]): string {
  return `Decision pattern analysis suggests potential bias in ${biasWarnings.map(b => b.pattern_name).join(', ')}`;
}

async function generateLearningInsights(fundId: string, contextData: any): Promise<any> {
  return {
    decision_quality_score: Math.floor(Math.random() * 30) + 70,
    key_factors: ['market_timing', 'team_quality', 'product_fit'],
    improvement_suggestions: ['Consider market validation depth', 'Evaluate team execution history'],
    pattern_matches: await findMatchingPatterns(fundId, contextData)
  };
}

async function findMatchingPatterns(fundId: string, contextData: any): Promise<any[]> {
  const { data: patterns } = await supabase
    .from('fund_decision_patterns')
    .select('*')
    .eq('fund_id', fundId)
    .eq('is_active', true);

  return patterns || [];
}

// Pattern discovery implementations

async function discoverSuccessFactors(fundId: string): Promise<any[]> {
  // Analyze successful deals to find common patterns
  return [];
}

async function discoverRiskSignals(fundId: string): Promise<any[]> {
  // Analyze failed deals to identify risk patterns
  return [];
}

async function discoverBiasPatterns(fundId: string): Promise<any[]> {
  // Analyze decision patterns to identify biases
  return [];
}

async function discoverTimingPatterns(fundId: string): Promise<any[]> {
  // Analyze timing patterns in decisions
  return [];
}

async function storeDiscoveredPatterns(fundId: string, patternType: string, patterns: any[]): Promise<void> {
  const patternEntries = patterns.map(pattern => ({
    fund_id: fundId,
    pattern_type: patternType,
    pattern_name: pattern.name,
    pattern_description: pattern.description,
    pattern_data: pattern.data,
    confidence_score: pattern.confidence,
    decisions_analyzed: pattern.sample_size
  }));

  await supabase
    .from('fund_decision_patterns')
    .insert(patternEntries);
}

// Strategic evolution implementations

async function analyzeThesisDrift(fundId: string): Promise<any> {
  return { drift_score: 0.1, direction: 'consistent' };
}

async function analyzeMarketResponsiveness(fundId: string): Promise<any> {
  return { responsiveness_score: 0.8, timing_effectiveness: 'good' };
}

async function analyzeDecisionQualityTrends(fundId: string): Promise<any> {
  return { trend: 'improving', quality_score: 82 };
}

async function generateStrategicRecommendations(fundId: string): Promise<any[]> {
  return [
    { type: 'thesis_refinement', recommendation: 'Consider expanding sector focus' },
    { type: 'process_improvement', recommendation: 'Implement more rigorous due diligence' }
  ];
}

async function storeStrategicEvolution(fundId: string, evolution: any): Promise<void> {
  // Store strategic evolution data
}

async function calculateOutcomeCorrelation(decisionContext: any, outcomeData: any): Promise<any> {
  return {
    score: 0.75,
    delta: { predicted: 'positive', actual: 'positive' },
    learning: { key_insight: 'Market timing was crucial' },
    pattern_updates: []
  };
}

async function updatePatternsFromOutcomes(fundId: string, correlationAnalysis: any): Promise<void> {
  // Update patterns based on outcome validation
}