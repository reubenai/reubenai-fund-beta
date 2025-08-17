import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openaiKey = Deno.env.get('OPENAI_API_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface ScoringRequest {
  org_id: string;
  fund_id: string;
  deal_id: string;
  rubric_version?: string;
  features?: any[];
  context_chunks?: any[];
}

interface CategoryScore {
  category: string;
  raw_score: number;
  weighted_score: number;
  confidence_level: number;
  driver_contributions: any;
  evidence_refs: any[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: ScoringRequest = await req.json();
    
    console.log(`🎯 [Feature-First Scoring] Starting scoring for deal: ${request.deal_id}`);

    // Step 1: Get fund investment strategy and rubric
    const rubric = await getFundRubric(request.fund_id);
    
    // Step 2: Load extracted features
    const features = await loadDealFeatures(request.org_id, request.fund_id, request.deal_id);
    
    // Step 3: Get strategy thresholds
    const thresholds = await getStrategyThresholds(request.fund_id);
    
    // Step 4: Score each category using feature-first approach
    const category_scores = await scoreAllCategories(features, rubric, request);
    
    // Step 5: Calculate overall score
    const overall_score = calculateOverallScore(category_scores, rubric);
    
    // Step 6: Persist scores
    await persistScores(request, category_scores, overall_score, rubric.version);

    console.log(`✅ [Feature-First Scoring] Scoring completed. Overall: ${overall_score.toFixed(1)}`);

    return new Response(JSON.stringify({
      success: true,
      deal_id: request.deal_id,
      overall_score: overall_score,
      category_scores: category_scores,
      rubric_version: rubric.version,
      scoring_method: 'feature_first_v2',
      thresholds: thresholds,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ [Feature-First Scoring] Failed:', error);
    
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

async function getFundRubric(fund_id: string): Promise<any> {
  console.log('📋 [Scoring] Loading fund rubric...');
  
  const { data: strategy, error } = await supabase
    .from('investment_strategies')
    .select('enhanced_criteria, fund_type')
    .eq('fund_id', fund_id)
    .single();

  if (error || !strategy) {
    throw new Error('Fund strategy not found');
  }

  return {
    version: 'v2_feature_first',
    fund_type: strategy.fund_type,
    categories: strategy.enhanced_criteria?.categories || []
  };
}

async function loadDealFeatures(org_id: string, fund_id: string, deal_id: string): Promise<any[]> {
  console.log('🔬 [Scoring] Loading extracted features...');
  
  const { data: features, error } = await supabase
    .from('deal_features')
    .select('*')
    .eq('org_id', org_id)
    .eq('fund_id', fund_id)
    .eq('deal_id', deal_id);

  if (error) {
    console.error('Failed to load features:', error);
    return [];
  }

  return features || [];
}

async function getStrategyThresholds(fund_id: string): Promise<any> {
  const { data: strategy } = await supabase
    .from('investment_strategies')
    .select('exciting_threshold, promising_threshold, needs_development_threshold')
    .eq('fund_id', fund_id)
    .single();

  return strategy || {
    exciting_threshold: 85,
    promising_threshold: 70,
    needs_development_threshold: 50
  };
}

async function scoreAllCategories(
  features: any[], 
  rubric: any, 
  request: ScoringRequest
): Promise<CategoryScore[]> {
  
  console.log(`📊 [Scoring] Scoring ${rubric.categories.length} categories...`);
  
  const category_scores: CategoryScore[] = [];
  
  for (const category of rubric.categories) {
    if (!category.enabled) continue;
    
    console.log(`🎯 [Scoring] Scoring category: ${category.name}`);
    
    const category_score = await scoreCategory(category, features, request);
    category_scores.push(category_score);
  }
  
  return category_scores;
}

async function scoreCategory(
  category: any, 
  features: any[], 
  request: ScoringRequest
): Promise<CategoryScore> {
  
  // Step 1: Rules-based scoring (guardrails)
  const rules_score = applyRulesBasedScoring(category, features);
  
  // Step 2: Feature-based scoring
  const feature_score = calculateFeatureBasedScore(category, features);
  
  // Step 3: Model-based scoring (with limited context)
  const model_score = await calculateModelBasedScore(category, features, request);
  
  // Step 4: Weighted combination
  const weights = {
    rules: 0.3,
    features: 0.4,
    model: 0.3
  };
  
  const raw_score = (
    rules_score * weights.rules + 
    feature_score * weights.features + 
    model_score * weights.model
  );
  
  const weighted_score = raw_score * (category.weight / 100);
  
  return {
    category: category.name,
    raw_score: Math.round(raw_score * 10) / 10,
    weighted_score: Math.round(weighted_score * 10) / 10,
    confidence_level: calculateConfidence(rules_score, feature_score, model_score, features),
    driver_contributions: {
      rules_based: rules_score,
      feature_based: feature_score,
      model_based: model_score,
      weights_applied: weights
    },
    evidence_refs: extractEvidenceRefs(category, features)
  };
}

function applyRulesBasedScoring(category: any, features: any[]): number {
  console.log(`⚖️ [Scoring] Applying rules for: ${category.name}`);
  
  let score = 50; // Base score
  
  // Apply category-specific rules
  switch (category.name.toLowerCase()) {
    case 'market opportunity':
      score = scoreMarketOpportunity(features);
      break;
    case 'financial performance':
      score = scoreFinancialPerformance(features);
      break;
    case 'team & leadership':
      score = scoreTeamLeadership(features);
      break;
    case 'product & technology':
      score = scoreProductTechnology(features);
      break;
    default:
      score = 50;
  }
  
  return Math.max(0, Math.min(100, score));
}

function scoreMarketOpportunity(features: any[]): number {
  let score = 50;
  
  // Look for market size indicators
  const market_kpis = features.filter(f => 
    f.feature_type === 'kpi' && 
    f.feature_name.toLowerCase().includes('market')
  );
  
  if (market_kpis.length > 0) {
    score += 20;
  }
  
  // Check for growth indicators
  const growth_kpis = features.filter(f =>
    f.feature_type === 'kpi' && 
    (f.feature_name.toLowerCase().includes('growth') || 
     f.feature_name.toLowerCase().includes('revenue'))
  );
  
  if (growth_kpis.length > 0) {
    score += 15;
  }
  
  return score;
}

function scoreFinancialPerformance(features: any[]): number {
  let score = 50;
  
  // Look for revenue metrics
  const revenue_kpis = features.filter(f =>
    f.feature_type === 'kpi' && 
    f.feature_name.toLowerCase().includes('revenue')
  );
  
  if (revenue_kpis.length > 0) {
    score += 25;
  }
  
  // Check for profitability indicators
  const profit_kpis = features.filter(f =>
    f.feature_type === 'kpi' && 
    (f.feature_name.toLowerCase().includes('profit') ||
     f.feature_name.toLowerCase().includes('margin'))
  );
  
  if (profit_kpis.length > 0) {
    score += 15;
  }
  
  return score;
}

function scoreTeamLeadership(features: any[]): number {
  let score = 50;
  
  // Look for founder/team entities
  const team_entities = features.filter(f =>
    f.feature_type === 'entity' && 
    (f.feature_name.includes('founder') || f.feature_name.includes('team'))
  );
  
  if (team_entities.length > 0) {
    score += 20;
  }
  
  return score;
}

function scoreProductTechnology(features: any[]): number {
  let score = 50;
  
  // Look for technology/IP indicators
  const tech_features = features.filter(f =>
    f.feature_name.toLowerCase().includes('technology') ||
    f.feature_name.toLowerCase().includes('ip') ||
    f.feature_name.toLowerCase().includes('patent')
  );
  
  if (tech_features.length > 0) {
    score += 20;
  }
  
  return score;
}

function calculateFeatureBasedScore(category: any, features: any[]): number {
  console.log(`🔬 [Scoring] Feature-based scoring for: ${category.name}`);
  
  // Filter features relevant to this category
  const relevant_features = features.filter(f => 
    isFeatureRelevantToCategory(f, category)
  );
  
  if (relevant_features.length === 0) {
    return 50; // Neutral score when no features
  }
  
  // Calculate score based on feature quality and quantity
  const feature_scores = relevant_features.map(f => f.confidence_score || 75);
  const average_confidence = feature_scores.reduce((a, b) => a + b, 0) / feature_scores.length;
  
  // Boost score based on feature quantity (more features = higher confidence)
  const quantity_boost = Math.min(20, relevant_features.length * 5);
  
  return Math.min(100, average_confidence + quantity_boost);
}

function isFeatureRelevantToCategory(feature: any, category: any): boolean {
  const category_name = category.name.toLowerCase();
  const feature_name = feature.feature_name.toLowerCase();
  
  const relevance_map: Record<string, string[]> = {
    'market opportunity': ['market', 'tam', 'sam', 'competition', 'growth'],
    'financial performance': ['revenue', 'profit', 'margin', 'cash', 'funding'],
    'team & leadership': ['founder', 'team', 'ceo', 'management', 'leadership'],
    'product & technology': ['product', 'technology', 'ip', 'patent', 'development']
  };
  
  const keywords = relevance_map[category_name] || [];
  return keywords.some(keyword => feature_name.includes(keyword));
}

async function calculateModelBasedScore(
  category: any, 
  features: any[], 
  request: ScoringRequest
): Promise<number> {
  
  console.log(`🤖 [Scoring] Model-based scoring for: ${category.name}`);
  
  // Limit context to ≤3 supporting chunks as per spec
  const limited_context = (request.context_chunks || [])
    .slice(0, 3)
    .map(chunk => chunk.content)
    .join('\n\n')
    .slice(0, 2000);

  if (!limited_context.trim() || features.length === 0) {
    return 50;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: `You are scoring the "${category.name}" category for an investment decision. 
            
            Score 0-100 based on:
            - Extracted features (primary)
            - Supporting context (secondary)
            
            Return only a JSON object with:
            - score: number 0-100
            - reasoning: brief explanation
            - key_factors: array of 2-3 key factors`
          },
          {
            role: 'user',
            content: `Category: ${category.name}
            
Extracted Features:
${features.map(f => `- ${f.feature_name}: ${JSON.stringify(f.feature_value)}`).join('\n')}

Supporting Context:
${limited_context}

Score this category:`
          }
        ],
        max_completion_tokens: 300,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content || '{"score": 50}');
    
    return Math.max(0, Math.min(100, result.score || 50));

  } catch (error) {
    console.error('Model-based scoring failed:', error);
    return 50;
  }
}

function calculateConfidence(
  rules_score: number, 
  feature_score: number, 
  model_score: number, 
  features: any[]
): number {
  
  // Base confidence on feature availability and score convergence
  const feature_count_factor = Math.min(100, features.length * 10);
  const score_variance = Math.abs(rules_score - feature_score) + Math.abs(feature_score - model_score);
  const convergence_factor = Math.max(0, 100 - score_variance);
  
  return Math.round((feature_count_factor + convergence_factor) / 2);
}

function extractEvidenceRefs(category: any, features: any[]): any[] {
  return features
    .filter(f => isFeatureRelevantToCategory(f, category))
    .map(f => ({
      feature_name: f.feature_name,
      source_references: f.source_references,
      confidence: f.confidence_score
    }))
    .slice(0, 5); // Limit evidence refs
}

function calculateOverallScore(category_scores: CategoryScore[], rubric: any): number {
  if (category_scores.length === 0) return 0;
  
  const total_weighted = category_scores.reduce((sum, score) => sum + score.weighted_score, 0);
  const total_weight = rubric.categories
    .filter((c: any) => c.enabled)
    .reduce((sum: number, c: any) => sum + c.weight, 0);
  
  return total_weight > 0 ? (total_weighted / total_weight) * 100 : 0;
}

async function persistScores(
  request: ScoringRequest,
  category_scores: CategoryScore[],
  overall_score: number,
  rubric_version: string
): Promise<void> {
  
  console.log('💾 [Scoring] Persisting scores...');
  
  const score_records = category_scores.map(score => ({
    org_id: request.org_id,
    fund_id: request.fund_id,
    deal_id: request.deal_id,
    rubric_version,
    category: score.category,
    raw_score: score.raw_score,
    weighted_score: score.weighted_score,
    driver_contributions: score.driver_contributions,
    evidence_refs: score.evidence_refs,
    scoring_method: 'feature_first_v2',
    confidence_level: score.confidence_level
  }));

  const { error } = await supabase
    .from('deal_scores')
    .upsert(score_records, {
      onConflict: 'org_id,fund_id,deal_id,rubric_version,category'
    });

  if (error) {
    console.error('Failed to persist scores:', error);
    throw error;
  }

  console.log('✅ [Scoring] Scores persisted successfully');
}