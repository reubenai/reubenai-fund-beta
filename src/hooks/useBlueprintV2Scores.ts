import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { type DatabaseFundType, toDatabaseFundType, type AnyFundType } from '@/utils/fundTypeConversion';

export interface BlueprintV2Score {
  id: string;
  deal_id: string;
  fund_id: string;
  organization_id: string;
  category_id: string;
  subcategory_id: string;
  score: number;
  confidence_score: number;
  weight: number;
  reasoning: string | null;
  insights: string[] | null;
  strengths: string[] | null;
  concerns: string[] | null;
  recommendations: string[] | null;
  data_sources: any;
  data_completeness_score: number;
  validation_flags: any;
  engine_name: string | null;
  analysis_version: number;
  created_at: string;
  updated_at: string;
}

export interface BlueprintV2Scores {
  overallScore: number;
  confidence: number;
  categoryScores: Record<string, {
    score: number;
    confidence: number;
    weight: number;
    subcategories: Record<string, BlueprintV2Score>;
  }>;
  lastUpdated: string;
}

export function useBlueprintV2Scores(dealId: string, fundType: AnyFundType) {
  const [scores, setScores] = useState<BlueprintV2Scores | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const databaseFundType = toDatabaseFundType(fundType);
  
  useEffect(() => {
    if (dealId && fundType) {
      fetchScores();
    }
  }, [dealId, fundType]);

  const fetchScores = async () => {
    setLoading(true);
    setError(null);

    try {
      const tableName = databaseFundType === 'venture_capital' 
        ? 'blueprint_v2_scores_vc' 
        : 'blueprint_v2_scores_pe';

      const { data: scoresData, error: fetchError } = await supabase
        .from(tableName)
        .select('*')
        .eq('deal_id', dealId)
        .order('updated_at', { ascending: false });

      if (fetchError) {
        throw new Error(`Failed to fetch Blueprint v2 scores: ${fetchError.message}`);
      }

      if (!scoresData || scoresData.length === 0) {
        setScores(null);
        return;
      }

      // Transform the raw scores into the structured format
      const transformedScores = transformScoresToBlueprint(scoresData);
      setScores(transformedScores);

    } catch (err) {
      console.error('Error fetching Blueprint v2 scores:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch scores');
    } finally {
      setLoading(false);
    }
  };

  const refreshScores = () => {
    fetchScores();
  };

  return {
    scores,
    loading,
    error,
    refreshScores
  };
}

function transformScoresToBlueprint(rawScores: BlueprintV2Score[]): BlueprintV2Scores {
  const categoryScores: Record<string, {
    score: number;
    confidence: number;
    weight: number;
    subcategories: Record<string, BlueprintV2Score>;
  }> = {};

  let totalWeightedScore = 0;
  let totalWeight = 0;
  let totalConfidence = 0;
  let categoryCount = 0;
  let lastUpdated = '';

  // Group scores by category
  rawScores.forEach(score => {
    if (!categoryScores[score.category_id]) {
      categoryScores[score.category_id] = {
        score: 0,
        confidence: 0,
        weight: 0,
        subcategories: {}
      };
    }

    categoryScores[score.category_id].subcategories[score.subcategory_id] = score;
    
    // Track the most recent update
    if (score.updated_at > lastUpdated) {
      lastUpdated = score.updated_at;
    }
  });

  // Calculate category-level scores
  Object.keys(categoryScores).forEach(categoryId => {
    const category = categoryScores[categoryId];
    const subcategories = Object.values(category.subcategories);
    
    if (subcategories.length === 0) return;

    // Calculate weighted average for category
    let categoryWeightedScore = 0;
    let categoryTotalWeight = 0;
    let categoryTotalConfidence = 0;

    subcategories.forEach(sub => {
      categoryWeightedScore += sub.score * sub.weight;
      categoryTotalWeight += sub.weight;
      categoryTotalConfidence += sub.confidence_score;
    });

    category.score = categoryTotalWeight > 0 ? Math.round(categoryWeightedScore / categoryTotalWeight) : 0;
    category.confidence = Math.round(categoryTotalConfidence / subcategories.length);
    category.weight = categoryTotalWeight;

    // Add to overall calculation
    totalWeightedScore += category.score * category.weight;
    totalWeight += category.weight;
    totalConfidence += category.confidence;
    categoryCount++;
  });

  return {
    overallScore: totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0,
    confidence: categoryCount > 0 ? Math.round(totalConfidence / categoryCount) : 0,
    categoryScores,
    lastUpdated: lastUpdated || new Date().toISOString()
  };
}