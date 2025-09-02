
import React from 'react';
import { Deal } from '@/hooks/usePipelineDeals';
import { ReubenAISummaryScoreEnhanced } from './ReubenAISummaryScoreEnhanced';
import { ReubenAISummaryScoreV2 } from './ReubenAISummaryScoreV2';
import { ReubenAISummaryScore } from './ReubenAISummaryScore';
import { type AnyFundType, toDatabaseFundType } from '@/utils/fundTypeConversion';

interface ReubenAISummaryScoreBridgeProps {
  deal: Deal;
  fundType: AnyFundType;
  onScoreCalculated?: (score: number) => void;
}

/**
 * Bridge component that determines whether to use Blueprint v2 or legacy scoring
 * Based on feature flags, deal characteristics, or gradual rollout strategy
 */
export function ReubenAISummaryScoreBridge({ deal, fundType, onScoreCalculated }: ReubenAISummaryScoreBridgeProps) {
  // Use the new enhanced component that shows real data
  const useEnhancedVersion = true; // Feature flag for enhanced ReubenAI with real data
  
  if (useEnhancedVersion) {
    return (
      <ReubenAISummaryScoreEnhanced 
        deal={deal} 
        fundType={fundType} 
        onScoreCalculated={onScoreCalculated}
      />
    );
  }

  // Feature flag or condition to determine which version to use
  const useBlueprintV2 = true; // TODO: Replace with actual feature flag or condition

  // Blueprint v2 eligibility criteria (optional)
  const isBlueprintV2Eligible = () => {
    // Could check deal age, fund preferences, organization settings, etc.
    return true;
  };

  if (useBlueprintV2 && isBlueprintV2Eligible()) {
    return (
      <ReubenAISummaryScoreV2 
        deal={deal} 
        fundType={toDatabaseFundType(fundType)} 
        onScoreCalculated={onScoreCalculated}
      />
    );
  }

  // Fallback to legacy version
  return (
    <ReubenAISummaryScore 
      deal={deal} 
      fundType={toDatabaseFundType(fundType)} 
      onScoreCalculated={onScoreCalculated}
    />
  );
}
