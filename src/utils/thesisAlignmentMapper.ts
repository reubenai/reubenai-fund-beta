// Thesis alignment mapping utilities for enhanced sector matching

import { calculateSectorAlignment } from './sectorMapping';

export interface ThesisAlignmentRequest {
  deal: {
    company_name: string;
    industry?: string;
    industries?: string[];
    sector?: string;
    sectors?: string[];
    stage?: string;
    geography?: string;
    investment_amount?: number;
    funding_round?: string;
  };
  strategy: {
    industries?: string[];
    geography?: string[];
    min_investment_amount?: number;
    max_investment_amount?: number;
    fund_type: 'vc' | 'pe';
    stages?: string[];
  };
}

export interface AlignmentResult {
  overall_score: number;
  sector_alignment: {
    score: number;
    matches: string[];
    reasoning: string;
  };
  geography_alignment: {
    score: number;
    matches: string[];
    reasoning: string;
  };
  stage_alignment: {
    score: number;
    match: string | null;
    reasoning: string;
  };
  size_alignment: {
    score: number;
    reasoning: string;
  };
  confidence: number;
  recommendation: 'strong_fit' | 'good_fit' | 'partial_fit' | 'poor_fit';
}

/**
 * Enhanced thesis alignment calculation with detailed sector mapping
 */
export function calculateEnhancedThesisAlignment(
  request: ThesisAlignmentRequest
): AlignmentResult {
  const { deal, strategy } = request;
  
  // Extract and normalize deal sectors
  const dealSectors = normalizeDealSectors(deal);
  const strategySectors = strategy.industries || [];
  
  // Calculate sector alignment using enhanced mapping
  const sectorAlignment = calculateSectorAlignment(dealSectors, strategySectors);
  
  // Calculate geography alignment
  const geographyAlignment = calculateGeographyAlignment(
    deal.geography,
    strategy.geography || []
  );
  
  // Calculate stage alignment
  const stageAlignment = calculateStageAlignment(
    deal.stage || deal.funding_round,
    strategy.stages || [],
    strategy.fund_type
  );
  
  // Calculate size alignment
  const sizeAlignment = calculateSizeAlignment(
    deal.investment_amount,
    strategy.min_investment_amount,
    strategy.max_investment_amount
  );
  
  // Calculate overall score (weighted average)
  const weights = {
    sector: 0.35,
    geography: 0.25,
    stage: 0.25,
    size: 0.15
  };
  
  const overallScore = Math.round(
    sectorAlignment.score * weights.sector +
    geographyAlignment.score * weights.geography +
    stageAlignment.score * weights.stage +
    sizeAlignment.score * weights.size
  );
  
  // Calculate confidence based on data completeness
  const confidence = calculateConfidence(deal, strategy);
  
  // Determine recommendation
  const recommendation = getRecommendation(overallScore, confidence);
  
  return {
    overall_score: overallScore,
    sector_alignment: sectorAlignment,
    geography_alignment: geographyAlignment,
    stage_alignment: stageAlignment,
    size_alignment: sizeAlignment,
    confidence,
    recommendation
  };
}

function normalizeDealSectors(deal: any): string[] {
  const sectors: string[] = [];
  
  // Handle different sector field formats
  if (deal.industries && Array.isArray(deal.industries)) {
    sectors.push(...deal.industries);
  } else if (deal.industry) {
    sectors.push(deal.industry);
  }
  
  if (deal.sectors && Array.isArray(deal.sectors)) {
    sectors.push(...deal.sectors);
  } else if (deal.sector) {
    sectors.push(deal.sector);
  }
  
  return [...new Set(sectors)]; // Remove duplicates
}

function calculateGeographyAlignment(
  dealGeography?: string,
  strategyGeographies: string[] = []
): { score: number; matches: string[]; reasoning: string } {
  if (!dealGeography || !strategyGeographies.length) {
    return { score: 50, matches: [], reasoning: 'Insufficient geography data' };
  }
  
  // Direct match
  if (strategyGeographies.includes(dealGeography)) {
    return { 
      score: 100, 
      matches: [dealGeography], 
      reasoning: `Direct geography match: ${dealGeography}` 
    };
  }
  
  // Regional matches (e.g., "United States" matches "North America")
  const regionalMatches = strategyGeographies.filter(geo => 
    geo.includes(dealGeography) || dealGeography.includes(geo)
  );
  
  if (regionalMatches.length > 0) {
    return { 
      score: 75, 
      matches: regionalMatches, 
      reasoning: `Regional alignment: ${regionalMatches.join(', ')}` 
    };
  }
  
  return { score: 0, matches: [], reasoning: 'No geography alignment' };
}

function calculateStageAlignment(
  dealStage?: string,
  strategyStages: string[] = [],
  fundType: 'vc' | 'pe' = 'vc'
): { score: number; match: string | null; reasoning: string } {
  if (!dealStage || !strategyStages.length) {
    return { score: 50, match: null, reasoning: 'Insufficient stage data' };
  }
  
  // Direct match
  if (strategyStages.includes(dealStage)) {
    return { 
      score: 100, 
      match: dealStage, 
      reasoning: `Direct stage match: ${dealStage}` 
    };
  }
  
  // Partial matches for similar stages
  const partialMatches = strategyStages.filter(stage => 
    stage.toLowerCase().includes(dealStage.toLowerCase()) ||
    dealStage.toLowerCase().includes(stage.toLowerCase())
  );
  
  if (partialMatches.length > 0) {
    return { 
      score: 75, 
      match: partialMatches[0], 
      reasoning: `Similar stage alignment: ${partialMatches[0]}` 
    };
  }
  
  return { score: 0, match: null, reasoning: 'No stage alignment' };
}

function calculateSizeAlignment(
  dealAmount?: number,
  minAmount?: number,
  maxAmount?: number
): { score: number; reasoning: string } {
  if (!dealAmount || (!minAmount && !maxAmount)) {
    return { score: 50, reasoning: 'Insufficient investment size data' };
  }
  
  const min = minAmount || 0;
  const max = maxAmount || Infinity;
  
  if (dealAmount >= min && dealAmount <= max) {
    return { score: 100, reasoning: 'Investment size within target range' };
  }
  
  // Calculate proximity score
  const targetCenter = (min + max) / 2;
  const targetRange = max - min;
  const distance = Math.abs(dealAmount - targetCenter);
  const proximityScore = Math.max(0, 100 - (distance / targetRange) * 100);
  
  if (proximityScore > 50) {
    return { score: proximityScore, reasoning: 'Investment size close to target range' };
  }
  
  return { score: 0, reasoning: 'Investment size outside target range' };
}

function calculateConfidence(deal: any, strategy: any): number {
  let completeness = 0;
  let totalFields = 0;
  
  // Check deal data completeness
  const dealFields = ['company_name', 'industry', 'stage', 'geography', 'investment_amount'];
  dealFields.forEach(field => {
    totalFields++;
    if (deal[field] || deal[field + 's']) completeness++;
  });
  
  // Check strategy data completeness
  const strategyFields = ['industries', 'geography', 'min_investment_amount', 'stages'];
  strategyFields.forEach(field => {
    totalFields++;
    if (strategy[field] && Array.isArray(strategy[field]) ? strategy[field].length > 0 : strategy[field]) {
      completeness++;
    }
  });
  
  return Math.round((completeness / totalFields) * 100);
}

function getRecommendation(
  score: number, 
  confidence: number
): 'strong_fit' | 'good_fit' | 'partial_fit' | 'poor_fit' {
  if (score >= 85 && confidence >= 80) return 'strong_fit';
  if (score >= 70 && confidence >= 60) return 'good_fit';
  if (score >= 50) return 'partial_fit';
  return 'poor_fit';
}