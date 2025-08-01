// Enhanced Fund Type Specialization Templates

import { EnhancedCriteriaTemplate, EnhancedCriteriaCategory } from './vc-pe-criteria';

// Stage-specific specializations
export interface StageSpecialization {
  stage: string;
  adjustments: {
    categoryWeights: { [category: string]: number };
    subcategoryEmphasis: { [category: string]: { [subcategory: string]: number } };
    additionalSignals: { [category: string]: string[] };
  };
}

// Industry-specific overlays
export interface IndustryOverlay {
  industry: string;
  fundType: 'vc' | 'pe';
  specializedCriteria: {
    [category: string]: {
      weight?: number;
      additionalSubcategories?: any[];
      industrySpecificSignals: string[];
      industrySpecificRisks: string[];
    };
  };
}

// Geographic risk assessment
export interface GeographicRiskProfile {
  region: string;
  riskFactors: {
    regulatory: string[];
    political: string[];
    economic: string[];
    currency: string[];
    operational: string[];
  };
  adjustments: {
    riskWeightModifier: number; // Multiplier for risk-related criteria
    additionalDueDiligence: string[];
  };
}

// Investment size adjustments
export interface SizeSpecialization {
  sizeRange: { min: number; max: number };
  fundType: 'vc' | 'pe';
  adjustments: {
    categoryWeights: { [category: string]: number };
    additionalConsiderations: string[];
    dueDiligenceDepth: 'light' | 'standard' | 'deep';
  };
}

// VC Stage Specializations
export const VC_STAGE_SPECIALIZATIONS: StageSpecialization[] = [
  {
    stage: 'Pre-Seed',
    adjustments: {
      categoryWeights: {
        'Team & Leadership': 35,
        'Market Opportunity': 30,
        'Product & Technology': 25,
        'Business Traction': 5,
        'Financial Health': 3,
        'Strategic Fit': 2
      },
      subcategoryEmphasis: {
        'Team & Leadership': {
          'Founder Experience': 50,
          'Domain Expertise': 35,
          'Execution Track Record': 15
        },
        'Product & Technology': {
          'Product-Market Fit': 60,
          'Technology Differentiation': 30,
          'Scalability': 10
        }
      },
      additionalSignals: {
        'Team & Leadership': [
          'Strong technical co-founder',
          'Previous startup experience',
          'Deep domain expertise',
          'Complementary skill sets'
        ],
        'Market Opportunity': [
          'Large addressable market',
          'Early market indicators',
          'Technology adoption trends',
          'Regulatory tailwinds'
        ]
      }
    }
  },
  {
    stage: 'Seed',
    adjustments: {
      categoryWeights: {
        'Team & Leadership': 30,
        'Market Opportunity': 25,
        'Product & Technology': 25,
        'Business Traction': 15,
        'Financial Health': 3,
        'Strategic Fit': 2
      },
      subcategoryEmphasis: {
        'Product & Technology': {
          'Product-Market Fit': 45,
          'Technology Differentiation': 35,
          'Scalability': 20
        },
        'Business Traction': {
          'Revenue Growth': 40,
          'Customer Metrics': 40,
          'Partnership/Validation': 20
        }
      },
      additionalSignals: {
        'Business Traction': [
          'Early customer validation',
          'Product usage metrics',
          'Letter of intent from customers',
          'Pilot program success'
        ]
      }
    }
  },
  {
    stage: 'Series A',
    adjustments: {
      categoryWeights: {
        'Team & Leadership': 25,
        'Market Opportunity': 25,
        'Product & Technology': 20,
        'Business Traction': 20,
        'Financial Health': 8,
        'Strategic Fit': 2
      },
      subcategoryEmphasis: {
        'Business Traction': {
          'Revenue Growth': 45,
          'Customer Metrics': 35,
          'Partnership/Validation': 20
        },
        'Financial Health': {
          'Unit Economics': 60,
          'Burn Rate/Runway': 25,
          'Funding History': 15
        }
      },
      additionalSignals: {
        'Business Traction': [
          'Consistent MRR growth',
          'Strong customer retention',
          'Expanding customer base',
          'Clear revenue model'
        ]
      }
    }
  },
  {
    stage: 'Series B+',
    adjustments: {
      categoryWeights: {
        'Team & Leadership': 20,
        'Market Opportunity': 20,
        'Product & Technology': 15,
        'Business Traction': 25,
        'Financial Health': 15,
        'Strategic Fit': 5
      },
      subcategoryEmphasis: {
        'Financial Health': {
          'Unit Economics': 50,
          'Burn Rate/Runway': 30,
          'Funding History': 20
        },
        'Business Traction': {
          'Revenue Growth': 50,
          'Customer Metrics': 30,
          'Partnership/Validation': 20
        }
      },
      additionalSignals: {
        'Financial Health': [
          'Positive unit economics',
          'Path to profitability',
          'Strong cash management',
          'Efficient capital deployment'
        ]
      }
    }
  }
];

// PE Stage Specializations
export const PE_STAGE_SPECIALIZATIONS: StageSpecialization[] = [
  {
    stage: 'Growth Equity',
    adjustments: {
      categoryWeights: {
        'Financial Performance': 25,
        'Market Position': 25,
        'Operational Excellence': 20,
        'Growth Potential': 25,
        'Risk Assessment': 5
      },
      subcategoryEmphasis: {
        'Growth Potential': {
          'Organic Growth': 50,
          'Acquisition Opportunities': 30,
          'International Expansion': 20
        }
      },
      additionalSignals: {
        'Growth Potential': [
          'Scalable business model',
          'Market expansion opportunities',
          'Product line extension potential',
          'Technology-enabled growth'
        ]
      }
    }
  },
  {
    stage: 'Buyout',
    adjustments: {
      categoryWeights: {
        'Financial Performance': 35,
        'Market Position': 25,
        'Operational Excellence': 25,
        'Growth Potential': 10,
        'Risk Assessment': 5
      },
      subcategoryEmphasis: {
        'Financial Performance': {
          'EBITDA Margins': 40,
          'Cash Flow': 35,
          'Revenue Growth': 25
        },
        'Operational Excellence': {
          'Management Quality': 50,
          'Operational Efficiency': 30,
          'Systems/Processes': 20
        }
      },
      additionalSignals: {
        'Financial Performance': [
          'Consistent cash flow generation',
          'Strong EBITDA margins',
          'Predictable revenue streams',
          'Debt service capability'
        ]
      }
    }
  },
  {
    stage: 'Distressed/Turnaround',
    adjustments: {
      categoryWeights: {
        'Financial Performance': 40,
        'Market Position': 15,
        'Operational Excellence': 30,
        'Growth Potential': 5,
        'Risk Assessment': 10
      },
      subcategoryEmphasis: {
        'Operational Excellence': {
          'Management Quality': 60,
          'Operational Efficiency': 25,
          'Systems/Processes': 15
        },
        'Risk Assessment': {
          'Financial Risk': 50,
          'Operational Risk': 30,
          'Market Risk': 20
        }
      },
      additionalSignals: {
        'Risk Assessment': [
          'Turnaround feasibility',
          'Asset quality assessment',
          'Debt restructuring potential',
          'Market recovery prospects'
        ]
      }
    }
  }
];

// Industry Overlays
export const INDUSTRY_OVERLAYS: IndustryOverlay[] = [
  {
    industry: 'SaaS/Software',
    fundType: 'vc',
    specializedCriteria: {
      'Product & Technology': {
        weight: 25,
        industrySpecificSignals: [
          'Recurring revenue model',
          'High customer LTV',
          'Scalable architecture',
          'API-first design',
          'Strong security framework',
          'Multi-tenant architecture'
        ],
        industrySpecificRisks: [
          'High customer churn',
          'Intense competition',
          'Technology obsolescence',
          'Data security vulnerabilities'
        ]
      },
      'Business Traction': {
        additionalSubcategories: [
          {
            name: 'SaaS Metrics',
            weight: 25,
            enabled: true,
            requirements: 'Key SaaS performance indicators',
            aiSearchKeywords: ['ARR', 'MRR', 'churn', 'CAC', 'LTV', 'NPS'],
            positiveSignals: ['Low churn rates', 'High NPS scores', 'Strong ARR growth', 'Efficient CAC payback'],
            negativeSignals: ['High churn rates', 'Poor unit economics', 'Declining ARR', 'High CAC']
          }
        ],
        industrySpecificSignals: [
          'Month-over-month recurring revenue growth',
          'Net revenue retention > 110%',
          'Customer acquisition cost efficiency',
          'Product-led growth indicators'
        ],
        industrySpecificRisks: [
          'Revenue concentration risk',
          'Pricing pressure from competitors',
          'Customer success challenges'
        ]
      }
    }
  },
  {
    industry: 'Healthcare/Biotech',
    fundType: 'vc',
    specializedCriteria: {
      'Product & Technology': {
        weight: 30,
        additionalSubcategories: [
          {
            name: 'Regulatory Pathway',
            weight: 30,
            enabled: true,
            requirements: 'Clear regulatory approval pathway',
            aiSearchKeywords: ['FDA', 'regulatory', 'clinical trials', 'approval', 'compliance'],
            positiveSignals: ['Clear regulatory pathway', 'FDA breakthrough designation', 'Strong clinical data'],
            negativeSignals: ['Regulatory uncertainty', 'Failed clinical trials', 'Compliance issues']
          }
        ],
        industrySpecificSignals: [
          'Strong clinical data',
          'Regulatory milestone achievements',
          'Intellectual property protection',
          'Key opinion leader endorsements'
        ],
        industrySpecificRisks: [
          'Regulatory approval delays',
          'Clinical trial failures',
          'Reimbursement challenges',
          'IP infringement risks'
        ]
      },
      'Market Opportunity': {
        industrySpecificSignals: [
          'Large patient population',
          'Unmet medical need',
          'Favorable reimbursement landscape',
          'Growing disease prevalence'
        ],
        industrySpecificRisks: [
          'Reimbursement policy changes',
          'Regulatory environment shifts',
          'Competition from big pharma'
        ]
      }
    }
  },
  {
    industry: 'FinTech',
    fundType: 'vc',
    specializedCriteria: {
      'Market Opportunity': {
        additionalSubcategories: [
          {
            name: 'Regulatory Environment',
            weight: 25,
            enabled: true,
            requirements: 'Favorable regulatory landscape',
            aiSearchKeywords: ['regulation', 'compliance', 'fintech', 'banking', 'licensing'],
            positiveSignals: ['Regulatory clarity', 'Sandbox participation', 'Banking partnerships'],
            negativeSignals: ['Regulatory uncertainty', 'Compliance challenges', 'License requirements']
          }
        ],
        industrySpecificSignals: [
          'Banking partnership potential',
          'Regulatory sandbox participation',
          'Compliance framework strength',
          'Payment ecosystem integration'
        ],
        industrySpecificRisks: [
          'Regulatory changes',
          'Banking partner dependency',
          'Cybersecurity threats',
          'Compliance costs'
        ]
      },
      'Product & Technology': {
        industrySpecificSignals: [
          'Strong security and encryption',
          'Fraud detection capabilities',
          'API integration capabilities',
          'Real-time processing'
        ],
        industrySpecificRisks: [
          'Cybersecurity vulnerabilities',
          'Data privacy concerns',
          'Technical integration challenges'
        ]
      }
    }
  },
  {
    industry: 'Climate Tech',
    fundType: 'vc',
    specializedCriteria: {
      'Market Opportunity': {
        additionalSubcategories: [
          {
            name: 'Sustainability Impact',
            weight: 30,
            enabled: true,
            requirements: 'Clear environmental impact and measurability',
            aiSearchKeywords: ['sustainability', 'carbon', 'emissions', 'ESG', 'climate'],
            positiveSignals: ['Measurable environmental impact', 'Carbon reduction potential', 'ESG alignment'],
            negativeSignals: ['Unclear impact metrics', 'Greenwashing concerns', 'Limited measurability']
          }
        ],
        industrySpecificSignals: [
          'Corporate sustainability mandates',
          'Government incentives and policy support',
          'Carbon pricing mechanisms',
          'ESG investment flows'
        ],
        industrySpecificRisks: [
          'Policy and regulatory changes',
          'Technology adoption barriers',
          'Long sales cycles',
          'Capital intensity requirements'
        ]
      }
    }
  }
];

// Geographic Risk Profiles
export const GEOGRAPHIC_RISK_PROFILES: GeographicRiskProfile[] = [
  {
    region: 'North America',
    riskFactors: {
      regulatory: ['SEC regulations', 'State-level compliance', 'Industry-specific regulations'],
      political: ['Policy stability', 'Trade relations', 'Tax policy changes'],
      economic: ['Interest rate environment', 'Economic cycles', 'Labor market conditions'],
      currency: ['USD strength', 'Cross-border currency risk'],
      operational: ['Talent availability', 'Cost inflation', 'Supply chain disruptions']
    },
    adjustments: {
      riskWeightModifier: 1.0,
      additionalDueDiligence: ['Legal structure optimization', 'Tax efficiency analysis']
    }
  },
  {
    region: 'Europe',
    riskFactors: {
      regulatory: ['GDPR compliance', 'EU regulations', 'Brexit implications'],
      political: ['EU policy changes', 'National sovereignty issues', 'Immigration policies'],
      economic: ['ECB monetary policy', 'Economic integration', 'Energy costs'],
      currency: ['EUR volatility', 'Multi-currency exposure'],
      operational: ['Cross-border operations', 'Language barriers', 'Cultural differences']
    },
    adjustments: {
      riskWeightModifier: 1.1,
      additionalDueDiligence: ['Regulatory compliance framework', 'Multi-country operations analysis']
    }
  },
  {
    region: 'Asia-Pacific',
    riskFactors: {
      regulatory: ['Varying regulatory frameworks', 'Data localization', 'Foreign investment restrictions'],
      political: ['Geopolitical tensions', 'Government relations', 'Policy unpredictability'],
      economic: ['Currency volatility', 'Economic development stages', 'Trade dependencies'],
      currency: ['Multiple currency exposure', 'Capital controls'],
      operational: ['Cultural adaptation', 'Local partnerships', 'Talent management']
    },
    adjustments: {
      riskWeightModifier: 1.3,
      additionalDueDiligence: ['Local market analysis', 'Regulatory compliance assessment', 'Cultural fit evaluation']
    }
  },
  {
    region: 'Emerging Markets',
    riskFactors: {
      regulatory: ['Regulatory instability', 'Enforcement inconsistency', 'Bureaucratic challenges'],
      political: ['Political instability', 'Corruption risks', 'Policy reversals'],
      economic: ['Currency devaluation', 'Inflation risks', 'Economic volatility'],
      currency: ['High currency volatility', 'Convertibility issues'],
      operational: ['Infrastructure limitations', 'Talent scarcity', 'Exit challenges']
    },
    adjustments: {
      riskWeightModifier: 1.5,
      additionalDueDiligence: ['Political risk assessment', 'Currency hedging analysis', 'Exit strategy planning']
    }
  }
];

// Investment Size Specializations
export const SIZE_SPECIALIZATIONS: SizeSpecialization[] = [
  {
    sizeRange: { min: 100000, max: 1000000 },
    fundType: 'vc',
    adjustments: {
      categoryWeights: {
        'Team & Leadership': 35,
        'Market Opportunity': 30,
        'Product & Technology': 25,
        'Business Traction': 8,
        'Financial Health': 1,
        'Strategic Fit': 1
      },
      additionalConsiderations: [
        'Portfolio construction impact',
        'Follow-on investment strategy',
        'Hands-on support requirements'
      ],
      dueDiligenceDepth: 'standard'
    }
  },
  {
    sizeRange: { min: 1000000, max: 10000000 },
    fundType: 'vc',
    adjustments: {
      categoryWeights: {
        'Team & Leadership': 25,
        'Market Opportunity': 25,
        'Product & Technology': 20,
        'Business Traction': 20,
        'Financial Health': 8,
        'Strategic Fit': 2
      },
      additionalConsiderations: [
        'Board seat consideration',
        'Strategic value-add opportunities',
        'Co-investor coordination'
      ],
      dueDiligenceDepth: 'deep'
    }
  },
  {
    sizeRange: { min: 10000000, max: 100000000 },
    fundType: 'pe',
    adjustments: {
      categoryWeights: {
        'Financial Performance': 35,
        'Market Position': 25,
        'Operational Excellence': 25,
        'Growth Potential': 10,
        'Risk Assessment': 5
      },
      additionalConsiderations: [
        'Management equity participation',
        'Debt structuring optimization',
        'Exit strategy planning',
        'Value creation plan development'
      ],
      dueDiligenceDepth: 'deep'
    }
  }
];

// Helper functions for specialization application
export function getStageSpecialization(stage: string, fundType: 'vc' | 'pe'): StageSpecialization | null {
  const specializations = fundType === 'vc' ? VC_STAGE_SPECIALIZATIONS : PE_STAGE_SPECIALIZATIONS;
  return specializations.find(s => s.stage === stage) || null;
}

export function getIndustryOverlay(industry: string, fundType: 'vc' | 'pe'): IndustryOverlay | null {
  return INDUSTRY_OVERLAYS.find(o => o.industry === industry && o.fundType === fundType) || null;
}

export function getGeographicRiskProfile(region: string): GeographicRiskProfile | null {
  return GEOGRAPHIC_RISK_PROFILES.find(p => p.region === region) || null;
}

export function getSizeSpecialization(investmentSize: number, fundType: 'vc' | 'pe'): SizeSpecialization | null {
  return SIZE_SPECIALIZATIONS.find(s => 
    s.fundType === fundType && 
    investmentSize >= s.sizeRange.min && 
    investmentSize <= s.sizeRange.max
  ) || null;
}

// Template specialization engine
export function applySpecializations(
  baseTemplate: EnhancedCriteriaTemplate,
  stage?: string,
  industries?: string[],
  geographies?: string[],
  investmentSize?: number
): EnhancedCriteriaTemplate {
  let specialized = JSON.parse(JSON.stringify(baseTemplate));

  // Apply stage specialization
  if (stage) {
    const stageSpec = getStageSpecialization(stage, baseTemplate.fundType);
    if (stageSpec) {
      specialized = applyStageAdjustments(specialized, stageSpec);
    }
  }

  // Apply industry overlays
  if (industries && industries.length > 0) {
    industries.forEach(industry => {
      const overlay = getIndustryOverlay(industry, baseTemplate.fundType);
      if (overlay) {
        specialized = applyIndustryOverlay(specialized, overlay);
      }
    });
  }

  // Apply geographic risk adjustments
  if (geographies && geographies.length > 0) {
    geographies.forEach(geography => {
      const riskProfile = getGeographicRiskProfile(geography);
      if (riskProfile) {
        specialized = applyGeographicAdjustments(specialized, riskProfile);
      }
    });
  }

  // Apply size specialization
  if (investmentSize) {
    const sizeSpec = getSizeSpecialization(investmentSize, baseTemplate.fundType);
    if (sizeSpec) {
      specialized = applySizeAdjustments(specialized, sizeSpec);
    }
  }

  return specialized;
}

function applyStageAdjustments(template: EnhancedCriteriaTemplate, spec: StageSpecialization): EnhancedCriteriaTemplate {
  // Apply category weight adjustments
  template.categories.forEach(category => {
    if (spec.adjustments.categoryWeights[category.name]) {
      category.weight = spec.adjustments.categoryWeights[category.name];
    }
  });

  // Apply subcategory emphasis
  template.categories.forEach(category => {
    const subcategoryAdjustments = spec.adjustments.subcategoryEmphasis[category.name];
    if (subcategoryAdjustments) {
      category.subcategories.forEach(subcategory => {
        if (subcategoryAdjustments[subcategory.name]) {
          subcategory.weight = subcategoryAdjustments[subcategory.name];
        }
      });
    }

    // Add additional signals
    const additionalSignals = spec.adjustments.additionalSignals[category.name];
    if (additionalSignals) {
      category.subcategories.forEach(subcategory => {
        subcategory.positiveSignals = [...subcategory.positiveSignals, ...additionalSignals];
      });
    }
  });

  return template;
}

function applyIndustryOverlay(template: EnhancedCriteriaTemplate, overlay: IndustryOverlay): EnhancedCriteriaTemplate {
  Object.entries(overlay.specializedCriteria).forEach(([categoryName, criteria]) => {
    const category = template.categories.find(c => c.name === categoryName);
    if (category) {
      // Apply weight adjustments
      if (criteria.weight) {
        category.weight = criteria.weight;
      }

      // Add additional subcategories
      if (criteria.additionalSubcategories) {
        category.subcategories.push(...criteria.additionalSubcategories);
      }

      // Add industry-specific signals to all subcategories
      category.subcategories.forEach(subcategory => {
        subcategory.positiveSignals = [...subcategory.positiveSignals, ...criteria.industrySpecificSignals];
        subcategory.negativeSignals = [...subcategory.negativeSignals, ...criteria.industrySpecificRisks];
      });
    }
  });

  return template;
}

function applyGeographicAdjustments(template: EnhancedCriteriaTemplate, riskProfile: GeographicRiskProfile): EnhancedCriteriaTemplate {
  // Add geographic risk considerations
  const strategicFitCategory = template.categories.find(c => c.name === 'Strategic Fit');
  if (strategicFitCategory) {
    const geographySubcategory = strategicFitCategory.subcategories.find(s => s.name === 'Geography Fit');
    if (geographySubcategory) {
      // Add risk-specific signals
      geographySubcategory.negativeSignals = [
        ...geographySubcategory.negativeSignals,
        ...riskProfile.riskFactors.regulatory,
        ...riskProfile.riskFactors.political,
        ...riskProfile.riskFactors.economic
      ];
    }
  }

  return template;
}

function applySizeAdjustments(template: EnhancedCriteriaTemplate, spec: SizeSpecialization): EnhancedCriteriaTemplate {
  // Apply category weight adjustments based on investment size
  template.categories.forEach(category => {
    if (spec.adjustments.categoryWeights[category.name]) {
      category.weight = spec.adjustments.categoryWeights[category.name];
    }
  });

  return template;
}