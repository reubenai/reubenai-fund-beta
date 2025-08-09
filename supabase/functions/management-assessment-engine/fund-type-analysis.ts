// Fund-type-specific management analysis functions

export function generateManagementFundTypeAnalysis(fundType: string, analysisData: any): any {
  if (fundType === 'vc' || fundType === 'venture_capital') {
    return {
      focus: 'vision_and_execution',
      key_attributes: ['entrepreneurial_vision', 'technical_expertise', 'growth_mindset', 'adaptability'],
      success_factors: ['founder_market_fit', 'technical_leadership', 'scaling_experience', 'pivoting_ability'],
      red_flags: ['lack_of_domain_expertise', 'no_technical_co_founder', 'poor_communication', 'rigid_thinking'],
      assessment_criteria: 'VC prioritizes visionary founders with deep domain expertise and proven ability to execute in uncertain environments'
    };
  } else if (fundType === 'pe' || fundType === 'private_equity') {
    return {
      focus: 'operational_excellence',
      key_attributes: ['operational_expertise', 'financial_discipline', 'proven_track_record', 'strategic_thinking'],
      success_factors: ['value_creation_experience', 'operational_improvements', 'market_expansion', 'efficiency_gains'],
      red_flags: ['poor_financial_controls', 'lack_of_operational_metrics', 'resistance_to_change', 'weak_governance'],
      assessment_criteria: 'PE prioritizes experienced operators with proven ability to drive value creation and operational improvements'
    };
  }
  return {
    focus: 'general_leadership',
    key_attributes: ['leadership_skills', 'industry_experience', 'team_building'],
    success_factors: ['strong_execution', 'clear_vision', 'team_cohesion'],
    red_flags: ['poor_leadership', 'lack_of_experience', 'team_conflicts'],
    assessment_criteria: 'General assessment of leadership capabilities and team dynamics'
  };
}

export function assessFounderFitForFundType(founder: any, fundType: string): string {
  if (fundType === 'vc' || fundType === 'venture_capital') {
    // VC looks for visionary founders who can navigate uncertainty
    if (founder.previous_experience?.includes('startup') || 
        founder.background?.includes('technical') ||
        founder.achievements?.includes('innovation')) {
      return 'Strong VC fit - entrepreneurial background with innovation track record';
    }
    return 'Moderate VC fit - assess entrepreneurial potential and adaptability';
  } else if (fundType === 'pe' || fundType === 'private_equity') {
    // PE looks for operational leaders with proven value creation
    if (founder.previous_experience?.includes('operations') ||
        founder.background?.includes('management') ||
        founder.achievements?.includes('growth')) {
      return 'Strong PE fit - operational expertise with value creation experience';
    }
    return 'Moderate PE fit - assess operational capabilities and execution track record';
  }
  return 'General leadership assessment required';
}

export function identifyFundTypeSpecificGaps(teamComposition: any, fundType: string): string[] {
  const gaps: string[] = [];
  
  if (fundType === 'vc' || fundType === 'venture_capital') {
    if (!teamComposition.technical_expertise) {
      gaps.push('Technical co-founder or CTO needed for product development');
    }
    if (!teamComposition.product_expertise) {
      gaps.push('Product management expertise critical for user-centric development');
    }
    if (!teamComposition.growth_marketing) {
      gaps.push('Growth marketing capabilities essential for scaling user acquisition');
    }
    if (!teamComposition.fundraising_experience) {
      gaps.push('Fundraising experience valuable for future rounds');
    }
  } else if (fundType === 'pe' || fundType === 'private_equity') {
    if (!teamComposition.financial_expertise) {
      gaps.push('CFO or financial controller needed for financial discipline');
    }
    if (!teamComposition.operations_management) {
      gaps.push('Operations expertise critical for efficiency improvements');
    }
    if (!teamComposition.strategic_planning) {
      gaps.push('Strategic planning capabilities needed for value creation');
    }
    if (!teamComposition.governance_experience) {
      gaps.push('Board and governance experience important for institutional oversight');
    }
  }
  
  return gaps;
}