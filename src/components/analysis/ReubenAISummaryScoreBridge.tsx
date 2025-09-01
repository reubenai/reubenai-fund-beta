
import React from 'react';
import { Deal } from '@/hooks/usePipelineDeals';
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
