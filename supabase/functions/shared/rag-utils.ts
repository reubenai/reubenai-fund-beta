// Shared RAG Utility - Single Source of Truth for RAG Calculations
// Used by all edge functions to ensure consistency

export interface StrategyThresholds {
  exciting: number;
  promising: number;
  needs_development: number;
}

export interface RAGResult {
  level: string;
  label: string;
  color: string;
  score?: number;
  confidence?: number;
  reasoning?: string;
}

const DEFAULT_THRESHOLDS: StrategyThresholds = {
  exciting: 85,
  promising: 70,
  needs_development: 50
};

/**
 * Fetch strategy thresholds for a fund
 */
export async function getStrategyThresholds(supabase: any, fundId: string): Promise<StrategyThresholds> {
  try {
    const { data: strategy, error } = await supabase
      .from('investment_strategies')
      .select('exciting_threshold, promising_threshold, needs_development_threshold')
      .eq('fund_id', fundId)
      .single();

    if (error) {
      console.warn(`No strategy found for fund ${fundId}, using defaults:`, error.message);
      return DEFAULT_THRESHOLDS;
    }

    return {
      exciting: strategy?.exciting_threshold || DEFAULT_THRESHOLDS.exciting,
      promising: strategy?.promising_threshold || DEFAULT_THRESHOLDS.promising,
      needs_development: strategy?.needs_development_threshold || DEFAULT_THRESHOLDS.needs_development
    };
  } catch (error) {
    console.warn(`Error fetching strategy thresholds for fund ${fundId}:`, error);
    return DEFAULT_THRESHOLDS;
  }
}

/**
 * Calculate RAG category from score and thresholds - SINGLE SOURCE OF TRUTH
 */
export function calculateRAGCategory(score: number | null | undefined, thresholds: StrategyThresholds): RAGResult {
  if (!score || score === null || score === undefined) {
    return {
      level: 'unknown',
      label: 'Unknown',
      color: 'bg-gray-100 text-gray-600'
    };
  }

  if (score >= thresholds.exciting) {
    return {
      level: 'exciting',
      label: 'Exciting',
      color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      score
    };
  }

  if (score >= thresholds.promising) {
    return {
      level: 'promising',
      label: 'Promising',
      color: 'bg-amber-100 text-amber-700 border-amber-200',
      score
    };
  }

  if (score >= thresholds.needs_development) {
    return {
      level: 'needs_development',
      label: 'Needs Development',
      color: 'bg-orange-100 text-orange-700 border-orange-200',
      score
    };
  }

  return {
    level: 'not_aligned',
    label: 'Not Aligned',
    color: 'bg-red-100 text-red-700 border-red-200',
    score
  };
}

/**
 * Calculate RAG status string for database storage
 */
export function calculateRAGStatus(score: number | null | undefined, thresholds: StrategyThresholds): string {
  const category = calculateRAGCategory(score, thresholds);
  return category.level;
}

/**
 * Validate strategy thresholds
 */
export function validateThresholds(thresholds: StrategyThresholds): boolean {
  return (
    thresholds.exciting > thresholds.promising &&
    thresholds.promising > thresholds.needs_development &&
    thresholds.needs_development > 0 &&
    thresholds.exciting <= 100
  );
}

/**
 * Get default thresholds as fallback
 */
export function getDefaultThresholds(): StrategyThresholds {
  return { ...DEFAULT_THRESHOLDS };
}

/**
 * Calculate confidence score based on data completeness and analysis quality
 */
export function calculateConfidenceScore(
  analysisData: any,
  dealData: any,
  strategyAlignment: number = 70
): number {
  let confidence = 50; // Base confidence

  // Analysis completeness (40 points max)
  if (analysisData) {
    const analysisScores = [
      analysisData.market_score,
      analysisData.leadership_score,
      analysisData.product_score,
      analysisData.financial_score,
      analysisData.thesis_alignment_score
    ].filter(score => score !== null && score !== undefined);

    if (analysisScores.length >= 3) confidence += 20;
    if (analysisScores.length >= 5) confidence += 20;
  }

  // Deal data completeness (30 points max)
  if (dealData) {
    const requiredFields = ['company_name', 'industry', 'deal_size', 'description'];
    const presentFields = requiredFields.filter(field => 
      dealData[field] && dealData[field] !== ''
    );
    confidence += (presentFields.length / requiredFields.length) * 30;
  }

  // Strategy alignment bonus (20 points max)
  if (strategyAlignment > 70) {
    confidence += Math.min(20, (strategyAlignment - 70) / 30 * 20);
  }

  return Math.min(100, Math.round(confidence));
}

/**
 * Generate RAG reasoning text
 */
export function generateRAGReasoning(
  score: number,
  thresholds: StrategyThresholds,
  factors: string[] = []
): string {
  const category = calculateRAGCategory(score, thresholds);
  
  let reasoning = `Score of ${score}/100 qualifies as "${category.label}" `;
  reasoning += `(threshold: ${getThresholdForLevel(category.level, thresholds)}).`;
  
  if (factors.length > 0) {
    reasoning += ` Key factors: ${factors.join(', ')}.`;
  }
  
  return reasoning;
}

function getThresholdForLevel(level: string, thresholds: StrategyThresholds): number {
  switch (level) {
    case 'exciting': return thresholds.exciting;
    case 'promising': return thresholds.promising;
    case 'needs_development': return thresholds.needs_development;
    default: return 0;
  }
}