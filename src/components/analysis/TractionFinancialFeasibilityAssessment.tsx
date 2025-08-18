import React from 'react';
import { EnhancedTractionFinancialFeasibilityAssessment } from './EnhancedTractionFinancialFeasibilityAssessment';
import { Deal } from '@/hooks/usePipelineDeals';

interface TractionFinancialFeasibilityAssessmentProps {
  deal: Deal;
}

export function TractionFinancialFeasibilityAssessment({ deal }: TractionFinancialFeasibilityAssessmentProps) {
  return <EnhancedTractionFinancialFeasibilityAssessment deal={deal} />;
}