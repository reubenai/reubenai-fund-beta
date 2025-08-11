// Enhanced Strategy Type System for Investment Strategy Wizard

// Core category customization interface
export interface CategoryCustomization {
  weight: number;
  subcategories: Record<string, {
    weight: number;
    requirements?: string;
    enabled: boolean;
  }>;
  positiveSignals: string[];
  negativeSignals: string[];
}

// Complete wizard data structure for all 11 steps
export interface EnhancedWizardData {
  // Foundation (Steps 0-2)
  fundName: string;
  strategyDescription: string;
  fundType: 'vc' | 'pe';
  checkSizeMin: number;
  checkSizeMax: number;
  sectors: string[];
  stages: string[];
  geographies: string[];
  
  // Category Configurations (Steps 3-8)
  teamLeadershipConfig: CategoryCustomization;
  marketOpportunityConfig: CategoryCustomization;
  productTechnologyConfig: CategoryCustomization;
  businessTractionConfig: CategoryCustomization;
  financialHealthConfig: CategoryCustomization;
  strategicFitConfig: CategoryCustomization;
  
  // Deal Definition (Step 9)
  dealThresholds: {
    exciting: number;
    promising: number;
    needs_development: number;
  };
  
  // Generated Results
  enhancedCriteria?: EnhancedCategoryConfig[];
}

// Enhanced category configuration
export interface EnhancedCategoryConfig {
  name: string;
  weight: number;
  subcategories: SubcategoryConfig[];
  positiveSignals: string[];
  negativeSignals: string[];
  description?: string;
}

export interface SubcategoryConfig {
  name: string;
  weight: number;
  requirements: string;
  enabled: boolean;
  aiPrompt?: string;
}

// VC criteria template with all 6 categories
export const VC_CRITERIA_TEMPLATE: Record<string, CategoryCustomization> = {
  'Team & Leadership': {
    weight: 20,
    subcategories: {
      'Founder Experience': { weight: 40, enabled: true, requirements: 'Previous startup experience or domain expertise' },
      'Team Composition': { weight: 35, enabled: true, requirements: 'Balanced technical and business skills' },
      'Vision & Communication': { weight: 25, enabled: true, requirements: 'Clear vision and strong communication abilities' }
    },
    positiveSignals: [
      'Serial entrepreneurs with successful exits',
      'Domain experts with deep industry knowledge',
      'Strong technical background in relevant field',
      'Previous experience at top-tier companies'
    ],
    negativeSignals: [
      'Inexperienced team with no relevant background',
      'Frequent founder conflicts or departures',
      'Lack of domain expertise',
      'Poor communication skills'
    ]
  },
  'Market Opportunity': {
    weight: 18,
    subcategories: {
      'Market Size': { weight: 40, enabled: true, requirements: 'Large and growing addressable market' },
      'Market Timing': { weight: 35, enabled: true, requirements: 'Favorable market timing and trends' },
      'Competitive Landscape': { weight: 25, enabled: true, requirements: 'Defensible position in competitive landscape' }
    },
    positiveSignals: [
      'Large TAM with high growth rates',
      'Regulatory tailwinds and market shifts',
      'Limited competition or clear differentiation',
      'Strong market validation and demand signals'
    ],
    negativeSignals: [
      'Declining or stagnant market',
      'Intense competition with low barriers',
      'Regulatory headwinds',
      'Unclear market demand'
    ]
  },
  'Product & Technology': {
    weight: 17,
    subcategories: {
      'Product Innovation': { weight: 40, enabled: true, requirements: 'Innovative product with clear differentiation' },
      'Technology Advantage': { weight: 35, enabled: true, requirements: 'Strong technology moat or IP protection' },
      'Product-Market Fit': { weight: 25, enabled: true, requirements: 'Clear evidence of product-market fit' }
    },
    positiveSignals: [
      'Proprietary technology or algorithms',
      'Patent portfolio and IP protection',
      'Strong customer feedback and retention',
      'Clear product differentiation'
    ],
    negativeSignals: [
      'Commoditized product offering',
      'No clear technology advantage',
      'Poor product-market fit signals',
      'High customer churn'
    ]
  },
  'Business Traction': {
    weight: 16,
    subcategories: {
      'Revenue Growth': { weight: 40, enabled: true, requirements: 'Strong revenue growth and momentum' },
      'Customer Metrics': { weight: 35, enabled: true, requirements: 'Healthy customer acquisition and retention' },
      'Market Validation': { weight: 25, enabled: true, requirements: 'Clear market validation and adoption' }
    },
    positiveSignals: [
      'Strong revenue growth rates',
      'High customer retention and LTV',
      'Efficient customer acquisition',
      'Strong unit economics'
    ],
    negativeSignals: [
      'Declining or stagnant revenue',
      'High customer churn',
      'Poor unit economics',
      'Difficulty acquiring customers'
    ]
  },
  'Financial Health': {
    weight: 15,
    subcategories: {
      'Financial Performance': { weight: 40, enabled: true, requirements: 'Strong financial metrics and performance' },
      'Capital Efficiency': { weight: 35, enabled: true, requirements: 'Efficient use of capital and resources' },
      'Financial Planning': { weight: 25, enabled: true, requirements: 'Strong financial planning and controls' }
    },
    positiveSignals: [
      'Positive unit economics',
      'Efficient capital deployment',
      'Strong gross margins',
      'Clear path to profitability'
    ],
    negativeSignals: [
      'Poor unit economics',
      'High burn rate without revenue growth',
      'Weak financial controls',
      'Unclear path to profitability'
    ]
  },
  'Strategic Fit': {
    weight: 14,
    subcategories: {
      'Portfolio Synergies': { weight: 40, enabled: true, requirements: 'Clear synergies with existing portfolio' },
      'Investment Thesis Alignment': { weight: 35, enabled: true, requirements: 'Strong alignment with fund thesis' },
      'Value Creation Potential': { weight: 25, enabled: true, requirements: 'Clear value creation opportunities' }
    },
    positiveSignals: [
      'Strong portfolio synergies',
      'Alignment with investment thesis',
      'Clear value creation plan',
      'Strategic customer introductions possible'
    ],
    negativeSignals: [
      'No portfolio synergies',
      'Misalignment with fund thesis',
      'Limited value creation opportunities',
      'Potential conflicts with existing investments'
    ]
  }
};

// Predefined sector options
export const SECTOR_OPTIONS = [
  'Technology', 'Healthcare', 'FinTech', 'AI/ML', 'SaaS', 'E-commerce',
  'Biotech', 'CleanTech', 'EdTech', 'Food & Beverage', 'Real Estate',
  'Manufacturing', 'Consumer Goods', 'Energy', 'Transportation'
];

// Fund-type specific stage options
export const VC_STAGE_OPTIONS = [
  'Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Series D+',
  'Growth', 'Late Stage', 'Pre-IPO'
];

export const PE_STAGE_OPTIONS = [
  'Growth Equity', 'Buyout', 'Expansion Capital', 'Distressed', 
  'Secondary', 'Recapitalization', 'Management Buyout (MBO)', 
  'Leveraged Buyout (LBO)', 'Late Stage'
];

// Helper function to get stage options based on fund type
export const getStageOptionsByFundType = (fundType: 'vc' | 'pe'): string[] => {
  return fundType === 'vc' ? VC_STAGE_OPTIONS : PE_STAGE_OPTIONS;
};

// Legacy export for backward compatibility
export const STAGE_OPTIONS = VC_STAGE_OPTIONS;

// Predefined geography options
export const GEOGRAPHY_OPTIONS = [
  'North America', 'United States', 'Canada', 'Europe', 'United Kingdom',
  'Germany', 'France', 'Asia Pacific', 'China', 'India', 'Japan',
  'Southeast Asia', 'Australia', 'Western Australia', 'Latin America', 'Middle East', 'Africa'
];

// Default deal thresholds
export const DEFAULT_DEAL_THRESHOLDS = {
  exciting: 85,
  promising: 70,
  needs_development: 50
};