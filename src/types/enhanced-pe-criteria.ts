// Enhanced PE Criteria Template with Proper Weights and Sub-Criteria
export interface EnhancedSubcategory {
  name: string;
  weight: number;
  enabled: boolean;
  requirements: string;
  aiSearchKeywords: string[];
  positiveSignals: string[];
  negativeSignals: string[];
  isCustom?: boolean;
}

export interface EnhancedCriteriaCategory {
  name: string;
  weight: number;
  enabled: boolean;
  subcategories: EnhancedSubcategory[];
  description: string;
  icon: string;
}

export interface EnhancedCriteriaTemplate {
  fundType: 'vc' | 'pe';
  categories: EnhancedCriteriaCategory[];
  totalWeight: number;
}

// Enhanced PE Criteria Template with Correct Weights
export const ENHANCED_PE_CRITERIA_TEMPLATE: EnhancedCriteriaTemplate = {
  fundType: 'pe',
  totalWeight: 100,
  categories: [
    {
      name: 'Financial Performance',
      weight: 35,
      enabled: true,
      icon: 'DollarSign',
      description: 'Assess financial health, profitability, and cash generation',
      subcategories: [
        {
          name: 'Revenue Quality',
          weight: 40,
          enabled: true,
          requirements: 'Recurring revenue and predictable income streams',
          aiSearchKeywords: ['revenue', 'recurring', 'ARR', 'subscription', 'revenue quality', 'churn', 'customer retention'],
          positiveSignals: ['High recurring revenue (>70%)', 'Low customer churn (<5% annually)', 'Long-term contracts with predictable renewals', 'Growing average contract value'],
          negativeSignals: ['Lumpy or project-based revenue', 'High customer concentration (>20% from single customer)', 'Declining ARR or high churn rates', 'Seasonality or cyclical dependency']
        },
        {
          name: 'Profitability Analysis',
          weight: 35,
          enabled: true,
          requirements: 'EBITDA margins and operational efficiency',
          aiSearchKeywords: ['EBITDA', 'margins', 'profitability', 'operating income', 'operational efficiency', 'cost structure'],
          positiveSignals: ['EBITDA margins >15%', 'Expanding margins over time', 'Strong operating leverage', 'Disciplined cost management'],
          negativeSignals: ['Declining EBITDA margins', 'Below industry average profitability', 'High fixed cost structure', 'Poor expense control']
        },
        {
          name: 'Cash Management',
          weight: 25,
          enabled: true,
          requirements: 'Working capital efficiency and cash flow generation',
          aiSearchKeywords: ['cash flow', 'working capital', 'cash conversion', 'DSO', 'inventory turns', 'free cash flow'],
          positiveSignals: ['Positive free cash flow', 'Efficient working capital cycle', 'Strong cash conversion (>90%)', 'Low DSO and high inventory turns'],
          negativeSignals: ['Negative free cash flow', 'Poor working capital management', 'High DSO or slow inventory turns', 'Cash flow volatility or seasonality']
        }
      ]
    },
    {
      name: 'Operational Excellence',
      weight: 25,
      enabled: true,
      icon: 'Shield',
      description: 'Evaluate operational efficiency and management quality',
      subcategories: [
        {
          name: 'Management Team Strength',
          weight: 40,
          enabled: true,
          requirements: 'Experienced leadership with proven track record',
          aiSearchKeywords: ['management team', 'leadership', 'CEO', 'executives', 'track record', 'experience'],
          positiveSignals: ['Experienced management with sector expertise', 'Proven track record of value creation', 'Strong operational discipline', 'Low management turnover'],
          negativeSignals: ['Inexperienced or unproven management', 'High executive turnover', 'Poor operational track record', 'Weak leadership capabilities']
        },
        {
          name: 'Operational Efficiency',
          weight: 35,
          enabled: true,
          requirements: 'Process optimization and operational metrics',
          aiSearchKeywords: ['operational efficiency', 'processes', 'automation', 'productivity', 'KPIs', 'metrics'],
          positiveSignals: ['Strong operational metrics', 'Process optimization initiatives', 'Technology-enabled efficiency', 'Benchmarked performance'],
          negativeSignals: ['Poor operational metrics', 'Manual processes', 'Low productivity', 'Below industry benchmarks']
        },
        {
          name: 'Technology & Systems',
          weight: 25,
          enabled: true,
          requirements: 'Technology infrastructure and digital capabilities',
          aiSearchKeywords: ['technology', 'systems', 'digital', 'automation', 'infrastructure', 'IT'],
          positiveSignals: ['Modern technology stack', 'Digital transformation progress', 'Automation capabilities', 'Scalable systems'],
          negativeSignals: ['Legacy technology systems', 'Poor digital capabilities', 'Manual processes', 'Technology debt']
        }
      ]
    },
    {
      name: 'Market Position',
      weight: 15,
      enabled: true,
      icon: 'Target',
      description: 'Evaluate competitive position and market dynamics',
      subcategories: [
        {
          name: 'Market Share & Position',
          weight: 40,
          enabled: true,
          requirements: 'Position within target market segments and competitive landscape',
          aiSearchKeywords: ['market share', 'market leader', 'position', 'competitive position', 'market penetration'],
          positiveSignals: ['Leading or strong #2 market position', 'Growing market share', 'Strong brand recognition', 'Pricing power'],
          negativeSignals: ['Declining market share', 'Weak competitive position', 'Price competition pressure', 'Commoditized offering']
        },
        {
          name: 'Competitive Advantages',
          weight: 35,
          enabled: true,
          requirements: 'Sustainable competitive moats and differentiation',
          aiSearchKeywords: ['competitive advantage', 'moat', 'differentiation', 'barriers to entry', 'unique value proposition'],
          positiveSignals: ['Strong competitive moats', 'Unique value proposition', 'High barriers to entry', 'Network effects or switching costs'],
          negativeSignals: ['Commoditized product/service', 'Easy to replicate offering', 'Low barriers to entry', 'Intense price competition']
        },
        {
          name: 'Customer Base Quality',
          weight: 25,
          enabled: true,
          requirements: 'Quality, diversity, and loyalty of customer relationships',
          aiSearchKeywords: ['customer relationships', 'customer base', 'retention', 'loyalty', 'diversification'],
          positiveSignals: ['Diversified customer base', 'High customer retention rates', 'Long-term contracts', 'Strong customer satisfaction'],
          negativeSignals: ['Customer concentration risk', 'High customer churn', 'Poor customer satisfaction', 'Transactional relationships']
        }
      ]
    },
    {
      name: 'Management Quality',
      weight: 10,
      enabled: true,
      icon: 'Users',
      description: 'Assess leadership quality and organizational capabilities',
      subcategories: [
        {
          name: 'Leadership Track Record',
          weight: 45,
          enabled: true,
          requirements: 'Proven leadership with history of value creation',
          aiSearchKeywords: ['leadership', 'CEO', 'management track record', 'value creation', 'previous experience'],
          positiveSignals: ['Successful track record of value creation', 'Industry expertise and relationships', 'Strong leadership capabilities', 'Aligned incentives'],
          negativeSignals: ['Unproven or poor track record', 'Lack of industry experience', 'Weak leadership skills', 'Misaligned incentives']
        },
        {
          name: 'Organizational Strength',
          weight: 35,
          enabled: true,
          requirements: 'Quality of organizational structure and talent',
          aiSearchKeywords: ['organization', 'talent', 'team strength', 'retention', 'culture'],
          positiveSignals: ['Strong organizational depth', 'High employee retention', 'Positive culture', 'Strong bench strength'],
          negativeSignals: ['Thin organizational depth', 'High employee turnover', 'Poor culture', 'Key person dependency']
        },
        {
          name: 'Strategic Vision',
          weight: 20,
          enabled: true,
          requirements: 'Clear strategic direction and execution capability',
          aiSearchKeywords: ['strategy', 'vision', 'strategic planning', 'execution', 'roadmap'],
          positiveSignals: ['Clear strategic vision', 'Strong execution track record', 'Effective strategic planning', 'Adaptability to change'],
          negativeSignals: ['Unclear strategy', 'Poor execution history', 'Reactive management', 'Resistance to change']
        }
      ]
    },
    {
      name: 'Growth Potential',
      weight: 10,
      enabled: true,
      icon: 'TrendingUp',
      description: 'Assess future growth opportunities and value creation',
      subcategories: [
        {
          name: 'Market Expansion Opportunities',
          weight: 40,
          enabled: true,
          requirements: 'Geographic, product, and customer expansion potential',
          aiSearchKeywords: ['market expansion', 'geographic expansion', 'product expansion', 'new markets', 'international'],
          positiveSignals: ['Clear expansion runway', 'Proven expansion model', 'Untapped markets', 'Scalable platform'],
          negativeSignals: ['Limited expansion opportunities', 'Saturated markets', 'High expansion costs', 'Failed expansion history']
        },
        {
          name: 'Value Creation Initiatives',
          weight: 35,
          enabled: true,
          requirements: 'Operational improvements and efficiency opportunities',
          aiSearchKeywords: ['value creation', 'operational improvements', 'cost reduction', 'efficiency', 'optimization'],
          positiveSignals: ['Clear improvement roadmap', 'Operational leverage opportunities', 'Cost reduction potential', 'Process optimization'],
          negativeSignals: ['Limited improvement opportunities', 'Already optimized', 'High execution risk', 'No clear value plan']
        },
        {
          name: 'Exit Strategy Potential',
          weight: 25,
          enabled: true,
          requirements: 'Exit optionality and value realization opportunities',
          aiSearchKeywords: ['exit strategy', 'strategic buyers', 'IPO potential', 'multiple expansion', 'exit valuation'],
          positiveSignals: ['Multiple exit pathways', 'Strategic buyer interest', 'IPO potential', 'Multiple expansion opportunity'],
          negativeSignals: ['Limited exit options', 'Lack of strategic buyers', 'Poor exit timing', 'Multiple compression risk']
        }
      ]
    },
    {
      name: 'Strategic Fit',
      weight: 5,
      enabled: true,
      icon: 'Target',
      description: 'Evaluate alignment with fund strategy and portfolio synergies',
      subcategories: [
        {
          name: 'Fund Strategy Alignment',
          weight: 50,
          enabled: true,
          requirements: 'Alignment with fund investment thesis and criteria',
          aiSearchKeywords: ['strategy alignment', 'investment thesis', 'fund criteria', 'mandate fit'],
          positiveSignals: ['Perfect strategy alignment', 'Core investment thesis fit', 'Sweet spot for fund', 'Clear mandate match'],
          negativeSignals: ['Poor strategy alignment', 'Outside fund mandate', 'Thesis mismatch', 'Edge case investment']
        },
        {
          name: 'Portfolio Synergies',
          weight: 30,
          enabled: true,
          requirements: 'Potential synergies with existing portfolio companies',
          aiSearchKeywords: ['portfolio synergies', 'cross-selling', 'operational synergies', 'value creation'],
          positiveSignals: ['Strong portfolio synergies', 'Cross-selling opportunities', 'Shared best practices', 'Operational leverage'],
          negativeSignals: ['No portfolio synergies', 'Potential conflicts', 'Limited cross-value creation', 'Isolated investment']
        },
        {
          name: 'Risk-Return Profile',
          weight: 20,
          enabled: true,
          requirements: 'Risk-return characteristics matching fund objectives',
          aiSearchKeywords: ['risk return', 'fund objectives', 'return targets', 'risk profile'],
          positiveSignals: ['Ideal risk-return profile', 'Meets return targets', 'Appropriate risk level', 'Portfolio balance'],
          negativeSignals: ['Poor risk-return fit', 'Below return targets', 'Excessive risk', 'Portfolio imbalance']
        }
      ]
    }
  ]
};

// Helper function to get PE template with proper weights
export const getEnhancedPETemplate = (): EnhancedCriteriaTemplate => {
  return ENHANCED_PE_CRITERIA_TEMPLATE;
};

// Validation function for enhanced PE criteria
export const validateEnhancedPECriteria = (template: EnhancedCriteriaTemplate): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Check total category weights sum to 100
  const totalCategoryWeight = template.categories.reduce((sum, category) => 
    category.enabled ? sum + category.weight : sum, 0
  );
  
  if (Math.abs(totalCategoryWeight - 100) > 0.1) {
    errors.push(`Total category weights sum to ${totalCategoryWeight}%, should be 100%`);
  }
  
  // Check each category's subcategories sum to 100
  template.categories.forEach(category => {
    if (category.enabled) {
      const subcategoryTotal = category.subcategories.reduce((sum, sub) => 
        sub.enabled ? sum + sub.weight : sum, 0
      );
      
      if (Math.abs(subcategoryTotal - 100) > 0.1) {
        errors.push(`${category.name} subcategory weights sum to ${subcategoryTotal}%, should be 100%`);
      }
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};