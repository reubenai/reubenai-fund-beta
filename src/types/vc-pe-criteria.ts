// Enhanced VC and PE Criteria Templates with Hierarchical Structure

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

// VC Criteria Template
export const VC_CRITERIA_TEMPLATE: EnhancedCriteriaTemplate = {
  fundType: 'vc',
  totalWeight: 100,
  categories: [
    {
      name: 'Team & Leadership',
      weight: 20,
      enabled: true,
      icon: 'Users',
      description: 'Evaluate the founding team and leadership capabilities',
      subcategories: [
        {
          name: 'Founder Experience',
          weight: 40,
          enabled: true,
          requirements: 'Previous startup and industry experience',
          aiSearchKeywords: ['founder', 'experience', 'startup', 'leadership', 'track record'],
          positiveSignals: ['Serial entrepreneurs with successful exits', 'Domain experts with deep industry knowledge', 'Previous experience at top-tier companies'],
          negativeSignals: ['Inexperienced team with no relevant background', 'Frequent founder conflicts or departures', 'Lack of domain expertise']
        },
        {
          name: 'Domain Expertise',
          weight: 30,
          enabled: true,
          requirements: 'Deep knowledge in target market/industry',
          aiSearchKeywords: ['domain', 'expertise', 'industry', 'knowledge', 'technical'],
          positiveSignals: ['Deep technical background in relevant field', 'Industry recognition and awards', 'Published research or patents'],
          negativeSignals: ['Shallow understanding of market dynamics', 'No technical differentiation', 'Limited industry connections']
        },
        {
          name: 'Execution Track Record',
          weight: 30,
          enabled: true,
          requirements: 'History of successful execution and delivery',
          aiSearchKeywords: ['execution', 'delivery', 'achievement', 'milestones', 'success'],
          positiveSignals: ['Consistent delivery of milestones', 'Strong team building capabilities', 'Proven ability to scale operations'],
          negativeSignals: ['History of missed deadlines', 'High team turnover', 'Poor execution on previous ventures']
        }
      ]
    },
    {
      name: 'Market Opportunity',
      weight: 20,
      enabled: true,
      icon: 'Building2',
      description: 'Assess the market size, timing, and competitive landscape',
      subcategories: [
        {
          name: 'Market Size/TAM',
          weight: 35,
          enabled: true,
          requirements: 'Total addressable market size and potential',
          aiSearchKeywords: ['market size', 'TAM', 'addressable market', 'opportunity', 'revenue potential'],
          positiveSignals: ['Large TAM with high growth rates', 'Multiple revenue streams', 'Global market opportunity'],
          negativeSignals: ['Small or declining market', 'Limited expansion potential', 'Niche market with low ceiling']
        },
        {
          name: 'Market Growth Rate',
          weight: 25,
          enabled: true,
          requirements: 'Rate of market expansion and trends',
          aiSearchKeywords: ['growth rate', 'market trends', 'expansion', 'adoption', 'penetration'],
          positiveSignals: ['High market growth rates', 'Accelerating adoption trends', 'Favorable demographic shifts'],
          negativeSignals: ['Declining market growth', 'Saturation indicators', 'Negative market trends']
        },
        {
          name: 'Market Timing',
          weight: 20,
          enabled: true,
          requirements: 'Timing of market entry and adoption readiness',
          aiSearchKeywords: ['timing', 'market readiness', 'adoption', 'early', 'disruption'],
          positiveSignals: ['Perfect timing for market disruption', 'Technology adoption curve inflection', 'Regulatory tailwinds'],
          negativeSignals: ['Too early for market adoption', 'Regulatory headwinds', 'Market timing misalignment']
        },
        {
          name: 'Competitive Landscape',
          weight: 20,
          enabled: true,
          requirements: 'Competitive positioning and differentiation',
          aiSearchKeywords: ['competition', 'competitive advantage', 'differentiation', 'moat', 'positioning'],
          positiveSignals: ['Clear competitive differentiation', 'Strong barriers to entry', 'First-mover advantage'],
          negativeSignals: ['Intense competition with low barriers', 'Commoditized market', 'Unclear differentiation']
        }
      ]
    },
    {
      name: 'Product & Technology',
      weight: 15,
      enabled: true,
      icon: 'Cpu',
      description: 'Evaluate product innovation, technology advantage, and market fit',
      subcategories: [
        {
          name: 'Product-Market Fit',
          weight: 50,
          enabled: true,
          requirements: 'Evidence of strong product-market fit',
          aiSearchKeywords: ['product market fit', 'customer satisfaction', 'retention', 'usage', 'demand'],
          positiveSignals: ['Strong customer feedback and retention', 'High user engagement metrics', 'Growing organic demand'],
          negativeSignals: ['Poor product-market fit signals', 'High customer churn', 'Low user engagement']
        },
        {
          name: 'Technology Differentiation',
          weight: 30,
          enabled: true,
          requirements: 'Unique technology or IP advantages',
          aiSearchKeywords: ['technology', 'IP', 'patents', 'innovation', 'proprietary'],
          positiveSignals: ['Proprietary technology or algorithms', 'Patent portfolio and IP protection', 'Technical innovation leadership'],
          negativeSignals: ['Commoditized technology offering', 'No clear technology advantage', 'Easily replicable solution']
        },
        {
          name: 'Scalability',
          weight: 20,
          enabled: true,
          requirements: 'Ability to scale product and technology',
          aiSearchKeywords: ['scalability', 'architecture', 'infrastructure', 'capacity', 'growth'],
          positiveSignals: ['Scalable technology architecture', 'Proven ability to handle growth', 'Efficient resource utilization'],
          negativeSignals: ['Scalability limitations', 'Infrastructure bottlenecks', 'High marginal costs']
        }
      ]
    },
    {
      name: 'Business Traction',
      weight: 12,
      enabled: true,
      icon: 'BarChart3',
      description: 'Assess revenue growth, customer metrics, and market validation',
      subcategories: [
        {
          name: 'Revenue Growth',
          weight: 50,
          enabled: true,
          requirements: 'Revenue growth rate and sustainability',
          aiSearchKeywords: ['revenue', 'growth', 'sales', 'recurring', 'ARR', 'MRR'],
          positiveSignals: ['Strong revenue growth rates', 'Recurring revenue model', 'Predictable revenue streams'],
          negativeSignals: ['Declining or stagnant revenue', 'One-time revenue model', 'Unpredictable revenue']
        },
        {
          name: 'Customer Metrics',
          weight: 30,
          enabled: true,
          requirements: 'Customer acquisition, retention, and satisfaction',
          aiSearchKeywords: ['customer', 'acquisition', 'retention', 'LTV', 'CAC', 'churn'],
          positiveSignals: ['High customer retention and LTV', 'Efficient customer acquisition', 'Strong customer satisfaction'],
          negativeSignals: ['High customer churn', 'Poor unit economics', 'Difficulty acquiring customers']
        },
        {
          name: 'Partnership/Validation',
          weight: 20,
          enabled: true,
          requirements: 'Strategic partnerships and market validation',
          aiSearchKeywords: ['partnerships', 'validation', 'strategic', 'enterprise', 'pilot'],
          positiveSignals: ['Strategic partnerships with industry leaders', 'Enterprise pilot programs', 'Market validation signals'],
          negativeSignals: ['Lack of strategic partnerships', 'Limited market validation', 'Weak customer references']
        }
      ]
    },
    {
      name: 'Financial Health',
      weight: 8,
      enabled: true,
      icon: 'CreditCard',
      description: 'Evaluate unit economics, burn rate, and funding history',
      subcategories: [
        {
          name: 'Unit Economics',
          weight: 50,
          enabled: true,
          requirements: 'Customer acquisition cost and lifetime value',
          aiSearchKeywords: ['unit economics', 'LTV', 'CAC', 'margins', 'profitability'],
          positiveSignals: ['Positive unit economics', 'Strong LTV/CAC ratio', 'Clear path to profitability'],
          negativeSignals: ['Poor unit economics', 'Negative LTV/CAC ratio', 'Unclear path to profitability']
        },
        {
          name: 'Burn Rate/Runway',
          weight: 30,
          enabled: true,
          requirements: 'Capital efficiency and runway management',
          aiSearchKeywords: ['burn rate', 'runway', 'cash', 'efficiency', 'capital'],
          positiveSignals: ['Efficient capital deployment', 'Extended runway', 'Improving burn efficiency'],
          negativeSignals: ['High burn rate without revenue growth', 'Short runway', 'Inefficient capital use']
        },
        {
          name: 'Funding History',
          weight: 20,
          enabled: true,
          requirements: 'Previous funding rounds and investor quality',
          aiSearchKeywords: ['funding', 'investors', 'valuation', 'rounds', 'capital'],
          positiveSignals: ['Quality investor backing', 'Reasonable valuations', 'Successful funding history'],
          negativeSignals: ['Poor investor quality', 'Inflated valuations', 'Funding difficulties']
        }
      ]
    },
    {
      name: 'Strategic Timing',
      weight: 10,
      enabled: true,
      icon: 'Clock',
      description: 'Evaluate market timing and strategic entry points',
      subcategories: [
        {
          name: 'Market Entry Timing',
          weight: 60,
          enabled: true,
          requirements: 'Optimal timing for market entry and disruption',
          aiSearchKeywords: ['timing', 'market entry', 'disruption', 'early', 'first mover'],
          positiveSignals: ['Perfect timing for market disruption', 'Early mover advantage', 'Technology adoption inflection point'],
          negativeSignals: ['Too early for market adoption', 'Missed timing window', 'Late market entry']
        },
        {
          name: 'Competitive Timing',
          weight: 40,
          enabled: true,
          requirements: 'Timing relative to competitive landscape',
          aiSearchKeywords: ['competitive timing', 'first mover', 'fast follower', 'market dynamics'],
          positiveSignals: ['Strategic timing advantage', 'Competitive window opportunity', 'Market timing alignment'],
          negativeSignals: ['Poor competitive timing', 'Saturated market entry', 'Timing disadvantage']
        }
      ]
    },
    {
      name: 'Trust & Transparency',
      weight: 10,
      enabled: true,
      icon: 'Shield',
      description: 'Assess governance, transparency, and stakeholder trust',
      subcategories: [
        {
          name: 'Corporate Governance',
          weight: 50,
          enabled: true,
          requirements: 'Board structure and governance practices',
          aiSearchKeywords: ['governance', 'board', 'transparency', 'ethics', 'compliance'],
          positiveSignals: ['Strong board composition', 'Clear governance structure', 'High transparency standards'],
          negativeSignals: ['Weak governance practices', 'Board composition issues', 'Transparency concerns']
        },
        {
          name: 'Stakeholder Relations',
          weight: 30,
          enabled: true,
          requirements: 'Relationships with investors, customers, and employees',
          aiSearchKeywords: ['stakeholder', 'investor relations', 'customer trust', 'employee satisfaction'],
          positiveSignals: ['Strong stakeholder trust', 'Positive investor relations', 'High employee satisfaction'],
          negativeSignals: ['Stakeholder conflicts', 'Trust issues', 'Poor stakeholder management']
        },
        {
          name: 'ESG Compliance',
          weight: 20,
          enabled: true,
          requirements: 'Environmental, social, and governance standards',
          aiSearchKeywords: ['ESG', 'sustainability', 'social responsibility', 'environmental'],
          positiveSignals: ['Strong ESG practices', 'Sustainability leadership', 'Social responsibility focus'],
          negativeSignals: ['ESG compliance issues', 'Environmental concerns', 'Social responsibility gaps']
        }
      ]
    },
    {
      name: 'Strategic Fit',
      weight: 5,
      enabled: true,
      icon: 'Crosshair',
      description: 'Assess alignment with fund thesis and strategic value',
      subcategories: [
        {
          name: 'Thesis Alignment',
          weight: 50,
          enabled: true,
          requirements: 'Alignment with fund investment thesis',
          aiSearchKeywords: ['thesis', 'alignment', 'strategy', 'focus', 'mandate'],
          positiveSignals: ['Strong alignment with investment thesis', 'Fits fund sector focus', 'Strategic value creation opportunities'],
          negativeSignals: ['Misalignment with fund thesis', 'Outside fund focus areas', 'Limited value creation potential']
        },
        {
          name: 'Check Size Fit',
          weight: 30,
          enabled: true,
          requirements: 'Match with fund check size parameters',
          aiSearchKeywords: ['check size', 'investment', 'round', 'funding', 'capital'],
          positiveSignals: ['Appropriate check size for fund', 'Right stage for fund mandate', 'Ownership target achievable'],
          negativeSignals: ['Check size too small/large', 'Wrong stage for fund', 'Ownership dilution concerns']
        },
        {
          name: 'Geography Fit',
          weight: 20,
          enabled: true,
          requirements: 'Geographic alignment with fund focus',
          aiSearchKeywords: ['geography', 'location', 'market', 'region', 'expansion'],
          positiveSignals: ['Strong geographic alignment', 'Access to local networks', 'Market knowledge advantage'],
          negativeSignals: ['Geographic misalignment', 'Limited market access', 'Regulatory complications']
        }
      ]
    }
  ]
};

// PE Criteria Template
export const PE_CRITERIA_TEMPLATE: EnhancedCriteriaTemplate = {
  fundType: 'pe',
  totalWeight: 100,
  categories: [
    {
      name: 'Financial Performance',
      weight: 15,
      enabled: true,
      icon: 'BarChart3',
      description: 'Evaluate revenue growth, profitability, and cash flow generation',
      subcategories: [
        {
          name: 'Revenue Growth',
          weight: 40,
          enabled: true,
          requirements: 'Historical revenue growth and sustainability',
          aiSearchKeywords: ['revenue', 'growth', 'sales', 'top line', 'recurring'],
          positiveSignals: ['Consistent revenue growth', 'Diversified revenue streams', 'Recurring revenue base'],
          negativeSignals: ['Declining revenue trends', 'Customer concentration risk', 'Cyclical revenue patterns']
        },
        {
          name: 'EBITDA Margins',
          weight: 35,
          enabled: true,
          requirements: 'Profitability margins and efficiency',
          aiSearchKeywords: ['EBITDA', 'margins', 'profitability', 'efficiency', 'costs'],
          positiveSignals: ['Strong EBITDA margins', 'Margin expansion trends', 'Cost efficiency programs'],
          negativeSignals: ['Declining margins', 'High cost structure', 'Margin compression pressure']
        },
        {
          name: 'Cash Flow',
          weight: 25,
          enabled: true,
          requirements: 'Free cash flow generation and predictability',
          aiSearchKeywords: ['cash flow', 'FCF', 'working capital', 'cash conversion'],
          positiveSignals: ['Strong free cash flow generation', 'Predictable cash flows', 'Efficient working capital management'],
          negativeSignals: ['Negative cash flows', 'Working capital issues', 'Cash flow volatility']
        }
      ]
    },
    {
      name: 'Market Position',
      weight: 15,
      enabled: true,
      icon: 'Building2',
      description: 'Assess market share, competitive advantages, and brand strength',
      subcategories: [
        {
          name: 'Market Share',
          weight: 40,
          enabled: true,
          requirements: 'Market share and competitive positioning',
          aiSearchKeywords: ['market share', 'competitive position', 'market leader', 'dominance'],
          positiveSignals: ['Leading market position', 'Growing market share', 'Competitive advantages'],
          negativeSignals: ['Declining market share', 'Weak competitive position', 'Market share erosion']
        },
        {
          name: 'Competitive Moat',
          weight: 35,
          enabled: true,
          requirements: 'Sustainable competitive advantages',
          aiSearchKeywords: ['competitive moat', 'barriers to entry', 'differentiation', 'advantages'],
          positiveSignals: ['Strong competitive moats', 'High barriers to entry', 'Sustainable differentiation'],
          negativeSignals: ['Weak competitive position', 'Low barriers to entry', 'Commoditized offering']
        },
        {
          name: 'Brand Strength',
          weight: 25,
          enabled: true,
          requirements: 'Brand recognition and customer loyalty',
          aiSearchKeywords: ['brand', 'recognition', 'loyalty', 'reputation', 'customer'],
          positiveSignals: ['Strong brand recognition', 'High customer loyalty', 'Premium pricing power'],
          negativeSignals: ['Weak brand position', 'Low customer loyalty', 'Price competition pressure']
        }
      ]
    },
    {
      name: 'Operational Excellence',
      weight: 14,
      enabled: true,
      icon: 'Users',
      description: 'Evaluate management quality, operational efficiency, and systems',
      subcategories: [
        {
          name: 'Management Quality',
          weight: 50,
          enabled: true,
          requirements: 'Leadership team experience and capability',
          aiSearchKeywords: ['management', 'leadership', 'experience', 'track record', 'team'],
          positiveSignals: ['Experienced management team', 'Strong operational leadership', 'Proven track record'],
          negativeSignals: ['Inexperienced management', 'High management turnover', 'Poor leadership quality']
        },
        {
          name: 'Operational Efficiency',
          weight: 30,
          enabled: true,
          requirements: 'Operational metrics and process optimization',
          aiSearchKeywords: ['operational efficiency', 'processes', 'productivity', 'optimization'],
          positiveSignals: ['High operational efficiency', 'Lean operations', 'Process optimization'],
          negativeSignals: ['Operational inefficiencies', 'Poor process management', 'High operational costs']
        },
        {
          name: 'Systems/Processes',
          weight: 20,
          enabled: true,
          requirements: 'Business systems and process maturity',
          aiSearchKeywords: ['systems', 'processes', 'infrastructure', 'technology', 'automation'],
          positiveSignals: ['Robust business systems', 'Scalable processes', 'Technology integration'],
          negativeSignals: ['Legacy systems', 'Manual processes', 'System integration issues']
        }
      ]
    },
    {
      name: 'Growth Potential',
      weight: 14,
      enabled: true,
      icon: 'Cpu',
      description: 'Assess organic growth opportunities and expansion potential',
      subcategories: [
        {
          name: 'Organic Growth',
          weight: 40,
          enabled: true,
          requirements: 'Organic growth opportunities and initiatives',
          aiSearchKeywords: ['organic growth', 'market expansion', 'product development', 'innovation'],
          positiveSignals: ['Strong organic growth potential', 'New product opportunities', 'Market expansion possibilities'],
          negativeSignals: ['Limited organic growth', 'Mature market dynamics', 'Product commoditization']
        },
        {
          name: 'Acquisition Opportunities',
          weight: 35,
          enabled: true,
          requirements: 'Inorganic growth through acquisitions',
          aiSearchKeywords: ['acquisitions', 'M&A', 'consolidation', 'roll-up', 'synergies'],
          positiveSignals: ['Clear acquisition targets', 'Industry consolidation opportunity', 'Synergy potential'],
          negativeSignals: ['Limited acquisition opportunities', 'High acquisition costs', 'Integration challenges']
        },
        {
          name: 'Market Expansion',
          weight: 25,
          enabled: true,
          requirements: 'Geographic or product expansion potential',
          aiSearchKeywords: ['market expansion', 'geographic expansion', 'international', 'new markets'],
          positiveSignals: ['International expansion opportunity', 'New market entry potential', 'Scalable business model'],
          negativeSignals: ['Limited expansion potential', 'Geographic constraints', 'Market saturation']
        }
      ]
    },
    {
      name: 'Risk Assessment',
      weight: 14,
      enabled: true,
      icon: 'CreditCard',
      description: 'Evaluate industry, regulatory, and execution risks',
      subcategories: [
        {
          name: 'Industry Risk',
          weight: 40,
          enabled: true,
          requirements: 'Industry-specific risks and cyclicality',
          aiSearchKeywords: ['industry risk', 'cyclical', 'secular trends', 'disruption'],
          positiveSignals: ['Stable industry dynamics', 'Positive secular trends', 'Defensive characteristics'],
          negativeSignals: ['High industry cyclicality', 'Disruptive threats', 'Declining industry trends']
        },
        {
          name: 'Regulatory Risk',
          weight: 35,
          enabled: true,
          requirements: 'Regulatory and compliance risks',
          aiSearchKeywords: ['regulatory', 'compliance', 'government', 'regulation', 'policy'],
          positiveSignals: ['Stable regulatory environment', 'Compliance advantages', 'Regulatory barriers protect market'],
          negativeSignals: ['High regulatory risk', 'Compliance challenges', 'Policy uncertainty']
        },
        {
          name: 'Execution Risk',
          weight: 25,
          enabled: true,
          requirements: 'Operational and execution risks',
          aiSearchKeywords: ['execution risk', 'operational risk', 'key man', 'dependencies'],
          positiveSignals: ['Low execution risk', 'Proven management', 'Diversified operations'],
          negativeSignals: ['High execution risk', 'Key person dependencies', 'Operational vulnerabilities']
        }
      ]
    },
    {
      name: 'Strategic Timing',
      weight: 14,
      enabled: true,
      icon: 'Clock',
      description: 'Evaluate acquisition timing and market positioning',
      subcategories: [
        {
          name: 'Market Cycle Timing',
          weight: 60,
          enabled: true,
          requirements: 'Timing relative to market and economic cycles',
          aiSearchKeywords: ['market cycle', 'economic timing', 'acquisition timing', 'market conditions'],
          positiveSignals: ['Optimal market cycle timing', 'Favorable economic conditions', 'Strategic acquisition window'],
          negativeSignals: ['Poor market timing', 'Economic headwinds', 'Unfavorable acquisition conditions']
        },
        {
          name: 'Exit Timing Potential',
          weight: 40,
          enabled: true,
          requirements: 'Potential for strategic exit timing',
          aiSearchKeywords: ['exit timing', 'strategic exit', 'market conditions', 'valuation timing'],
          positiveSignals: ['Clear exit timing strategy', 'Favorable exit market conditions', 'Multiple exit pathways'],
          negativeSignals: ['Unclear exit timing', 'Limited exit opportunities', 'Poor exit market conditions']
        }
      ]
    },
    {
      name: 'Trust & Transparency',
      weight: 14,
      enabled: true,
      icon: 'Shield',
      description: 'Assess governance quality and stakeholder trust',
      subcategories: [
        {
          name: 'Corporate Governance',
          weight: 50,
          enabled: true,
          requirements: 'Board effectiveness and governance quality',
          aiSearchKeywords: ['governance', 'board effectiveness', 'transparency', 'ethics', 'compliance'],
          positiveSignals: ['Strong governance framework', 'Effective board oversight', 'High transparency standards'],
          negativeSignals: ['Governance weaknesses', 'Board effectiveness issues', 'Transparency concerns']
        },
        {
          name: 'Stakeholder Trust',
          weight: 30,
          enabled: true,
          requirements: 'Trust levels with key stakeholders',
          aiSearchKeywords: ['stakeholder trust', 'management credibility', 'investor relations', 'reputation'],
          positiveSignals: ['High stakeholder trust', 'Strong management credibility', 'Positive reputation'],
          negativeSignals: ['Trust issues', 'Management credibility concerns', 'Reputation problems']
        },
        {
          name: 'ESG Standards',
          weight: 20,
          enabled: true,
          requirements: 'Environmental, social, and governance practices',
          aiSearchKeywords: ['ESG', 'sustainability', 'social responsibility', 'environmental practices'],
          positiveSignals: ['Strong ESG performance', 'Sustainability leadership', 'Social responsibility focus'],
          negativeSignals: ['ESG compliance issues', 'Environmental concerns', 'Social responsibility gaps']
        }
      ]
    }
  ]
};

// Helper functions
export function getTemplateByFundType(fundType: 'vc' | 'pe'): EnhancedCriteriaTemplate {
  return fundType === 'vc' ? VC_CRITERIA_TEMPLATE : PE_CRITERIA_TEMPLATE;
}

export function validateCriteriaWeights(template: EnhancedCriteriaTemplate): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check total category weights
  const enabledCategories = template.categories.filter(c => c.enabled);
  const totalCategoryWeight = enabledCategories.reduce((sum, c) => sum + c.weight, 0);
  
  console.log('🔍 Enhanced criteria validation debug:');
  console.log('Total category weight:', totalCategoryWeight);
  console.log('Enabled categories:', enabledCategories.map(c => ({ name: c.name, weight: c.weight })));
  
  // More lenient precision check - allow up to 1% difference for floating point errors
  if (Math.abs(totalCategoryWeight - 100) > 1.0) {
    errors.push(`Category weights must sum to 100% (currently ${totalCategoryWeight.toFixed(1)}%)`);
  }
  
  // Check subcategory weights within each category
  enabledCategories.forEach(category => {
    const enabledSubcategories = category.subcategories.filter(s => s.enabled);
    const subcategoryTotal = enabledSubcategories.reduce((sum, s) => sum + s.weight, 0);
    
    console.log(`${category.name} subcategory total:`, subcategoryTotal);
    
    // More lenient precision check for subcategories too
    if (enabledSubcategories.length > 0 && Math.abs(subcategoryTotal - 100) > 1.0) {
      errors.push(`${category.name} subcategory weights must sum to 100% (currently ${subcategoryTotal.toFixed(1)}%)`);
    }
  });
  
  console.log('Validation result:', { isValid: errors.length === 0, errors });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}