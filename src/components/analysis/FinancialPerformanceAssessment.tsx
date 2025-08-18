import React from 'react';
import { EnhancedFinancialPerformanceAssessment } from './EnhancedFinancialPerformanceAssessment';
import { Deal } from '@/hooks/usePipelineDeals';

interface FinancialPerformanceAssessmentProps {
  deal: Deal;
}

export function FinancialPerformanceAssessment({ deal }: FinancialPerformanceAssessmentProps) {
  return <EnhancedFinancialPerformanceAssessment deal={deal} />;
}