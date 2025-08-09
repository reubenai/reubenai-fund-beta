// Shared fund-type-specific analysis utilities

export interface FundTypeContext {
  fundType: string;
  enhancedCriteria?: any;
  thresholds?: {
    exciting: number;
    promising: number;
    needs_development: number;
  };
  geography?: string[];
  keySignals?: string[];
}

export function generateFundTypePrompt(fundType: string, analysisType: string): string {
  const basePrompts = {
    vc: {
      focus: 'growth potential, scalability, innovation, and market disruption',
      priorities: 'team vision, technology differentiation, total addressable market expansion, unit economics improvement trajectory',
      evaluation_criteria: 'growth rate sustainability, competitive moat development, venture-scale exit potential, early adoption indicators',
      risk_tolerance: 'higher risk tolerance for unproven markets, emphasis on learning and iteration speed',
      success_metrics: 'customer acquisition cost trends, viral coefficients, product-market fit signals, funding efficiency'
    },
    pe: {
      focus: 'operational excellence, cash flow predictability, market position, and value creation',
      priorities: 'EBITDA margins, working capital efficiency, market consolidation opportunities, management team depth',
      evaluation_criteria: 'cash flow stability, competitive defensibility, operational improvement potential, debt capacity',
      risk_tolerance: 'lower risk tolerance requiring proven business models with predictable cash flows',
      success_metrics: 'EBITDA growth, cash conversion cycles, market share expansion, operational leverage'
    }
  };

  const contextPrompts = {
    market_analysis: {
      vc: 'Focus on market timing, disruption potential, early adopter behavior, technology adoption curves, and competitive gaps that enable rapid growth.',
      pe: 'Focus on market maturity, consolidation opportunities, pricing power, customer stickiness, and operational efficiency improvements.'
    },
    financial_analysis: {
      vc: 'Prioritize burn rate efficiency, runway optimization, unit economics trends, growth capital requirements, and path to profitability.',
      pe: 'Prioritize EBITDA margins, cash generation, debt service capability, working capital optimization, and return on invested capital.'
    },
    team_assessment: {
      vc: 'Evaluate entrepreneurial vision, technical expertise, adaptability, product development speed, and ability to pivot based on market feedback.',
      pe: 'Evaluate operational experience, value creation track record, financial discipline, process improvement capabilities, and strategic planning.'
    },
    risk_assessment: {
      vc: 'Assess execution risk, market timing risk, competitive response risk, and technology obsolescence while maintaining upside-focused perspective.',
      pe: 'Assess operational risk, market share erosion risk, margin compression risk, and refinancing risk with downside protection emphasis.'
    }
  };

  const type = fundType === 'vc' || fundType === 'venture_capital' ? 'vc' : 'pe';
  const baseContext = basePrompts[type];
  const specificContext = contextPrompts[analysisType]?.[type] || '';

  return `
FUND TYPE: ${type.toUpperCase()} Investment Focus

ANALYSIS PERSPECTIVE:
Primary Focus: ${baseContext.focus}
Key Priorities: ${baseContext.priorities}
Evaluation Criteria: ${baseContext.evaluation_criteria}
Risk Tolerance: ${baseContext.risk_tolerance}
Success Metrics: ${baseContext.success_metrics}

SPECIFIC GUIDANCE FOR ${analysisType.toUpperCase()}:
${specificContext}

Apply this ${type.toUpperCase()} investment lens throughout your analysis, ensuring recommendations align with the fund's investment methodology and return expectations.
`;
}

export function applyFundTypeScoring(baseScore: number, fundType: string, analysisType: string, factorData: any): number {
  const type = fundType === 'vc' || fundType === 'venture_capital' ? 'vc' : 'pe';
  
  const scoringAdjustments = {
    vc: {
      market_analysis: {
        growth_rate_multiplier: 1.2, // VC values high growth more
        innovation_bonus: 15, // Bonus for innovation potential
        early_market_penalty: -5 // Less penalty for early markets
      },
      financial_analysis: {
        profitability_penalty: -5, // Less penalty for lack of profitability
        growth_efficiency_bonus: 20, // High bonus for growth efficiency
        cash_burn_tolerance: 0.8 // More tolerant of cash burn
      },
      team_assessment: {
        vision_multiplier: 1.3, // High value on vision
        experience_requirement: 0.7, // Lower experience requirement
        adaptability_bonus: 10 // Bonus for adaptability
      }
    },
    pe: {
      market_analysis: {
        market_position_multiplier: 1.3, // PE values market position more
        stability_bonus: 15, // Bonus for market stability
        maturity_preference: 10 // Preference for mature markets
      },
      financial_analysis: {
        profitability_requirement: 1.2, // Higher profitability requirement
        cash_flow_multiplier: 1.4, // High value on cash flow
        margin_expansion_bonus: 15 // Bonus for margin expansion potential
      },
      team_assessment: {
        operational_experience_multiplier: 1.3, // High value on operations experience
        track_record_requirement: 1.2, // Higher track record requirement
        value_creation_bonus: 15 // Bonus for value creation experience
      }
    }
  };

  const adjustments = scoringAdjustments[type]?.[analysisType];
  if (!adjustments) return baseScore;

  let adjustedScore = baseScore;

  // Apply fund-type-specific adjustments based on factor data
  Object.keys(adjustments).forEach(factor => {
    const adjustment = adjustments[factor];
    if (typeof adjustment === 'number' && factorData[factor]) {
      adjustedScore += adjustment;
    } else if (typeof adjustment === 'number' && adjustment < 1) {
      // Multiplier or penalty
      adjustedScore *= adjustment;
    }
  });

  return Math.max(0, Math.min(100, adjustedScore));
}

export function validateStrategyAlignment(dealData: any, fundType: string, enhancedCriteria: any): {
  alignmentScore: number;
  alignmentFactors: string[];
  misalignmentRisks: string[];
} {
  const alignmentFactors: string[] = [];
  const misalignmentRisks: string[] = [];
  let alignmentScore = 50; // Base alignment

  const type = fundType === 'vc' || fundType === 'venture_capital' ? 'vc' : 'pe';

  if (type === 'vc') {
    // VC alignment checks
    if (dealData.industry && ['technology', 'software', 'biotech', 'fintech'].includes(dealData.industry.toLowerCase())) {
      alignmentScore += 15;
      alignmentFactors.push('High-growth industry alignment');
    }
    
    if (dealData.business_model && dealData.business_model.toLowerCase().includes('saas')) {
      alignmentScore += 10;
      alignmentFactors.push('Scalable SaaS business model');
    }
    
    if (dealData.employee_count && dealData.employee_count < 100) {
      alignmentScore += 5;
      alignmentFactors.push('Early-stage team size');
    } else if (dealData.employee_count && dealData.employee_count > 500) {
      alignmentScore -= 10;
      misalignmentRisks.push('Large team size may indicate later stage than typical VC focus');
    }

  } else if (type === 'pe') {
    // PE alignment checks
    if (dealData.valuation && dealData.valuation > 50000000) { // >$50M valuation
      alignmentScore += 15;
      alignmentFactors.push('Mature company valuation appropriate for PE');
    }
    
    if (dealData.employee_count && dealData.employee_count > 50) {
      alignmentScore += 10;
      alignmentFactors.push('Established organization size');
    }
    
    if (dealData.business_model && ['subscription', 'recurring'].some(model => 
        dealData.business_model.toLowerCase().includes(model))) {
      alignmentScore += 10;
      alignmentFactors.push('Recurring revenue model suitable for PE');
    }
    
    if (dealData.industry && ['technology', 'software'].includes(dealData.industry.toLowerCase()) && 
        dealData.employee_count && dealData.employee_count < 20) {
      alignmentScore -= 15;
      misalignmentRisks.push('Early-stage characteristics may not align with PE investment criteria');
    }
  }

  // Apply enhanced criteria weights if available
  if (enhancedCriteria?.categories) {
    const categoryWeights = enhancedCriteria.categories;
    if (categoryWeights['Market Opportunity']?.weight > 25) {
      alignmentFactors.push('High market focus aligns with fund strategy');
      alignmentScore += 5;
    }
    if (categoryWeights['Financial Health']?.weight > 20 && type === 'pe') {
      alignmentFactors.push('Financial health emphasis aligns with PE focus');
      alignmentScore += 8;
    }
    if (categoryWeights['Product & Technology']?.weight > 25 && type === 'vc') {
      alignmentFactors.push('Technology emphasis aligns with VC focus');
      alignmentScore += 8;
    }
  }

  return {
    alignmentScore: Math.max(0, Math.min(100, alignmentScore)),
    alignmentFactors,
    misalignmentRisks
  };
}

export function generateFundTypeRecommendations(fundType: string, analysisResults: any): string[] {
  const type = fundType === 'vc' || fundType === 'venture_capital' ? 'vc' : 'pe';
  
  const recommendations: string[] = [];

  if (type === 'vc') {
    recommendations.push('Evaluate product-market fit signals and customer validation metrics');
    recommendations.push('Assess technology differentiation and intellectual property protection');
    recommendations.push('Review go-to-market strategy and customer acquisition unit economics');
    recommendations.push('Analyze competitive positioning and sustainable competitive advantages');
    recommendations.push('Evaluate founding team technical expertise and vision execution capability');
    
    if (analysisResults.overallScore > 80) {
      recommendations.push('Consider leading the round given strong VC-specific metrics');
      recommendations.push('Evaluate board seat and governance participation opportunities');
    }
  } else if (type === 'pe') {
    recommendations.push('Conduct comprehensive financial due diligence including quality of earnings');
    recommendations.push('Assess operational improvement opportunities and value creation plan');
    recommendations.push('Evaluate management team depth and operational excellence track record');
    recommendations.push('Analyze market position defensibility and competitive moat sustainability');
    recommendations.push('Review debt capacity and optimal capital structure for value creation');
    
    if (analysisResults.overallScore > 75) {
      recommendations.push('Develop comprehensive 100-day value creation plan');
      recommendations.push('Assess add-on acquisition opportunities for portfolio synergies');
    }
  }

  return recommendations;
}