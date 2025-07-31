// Intelligent Criteria Service for AI-powered strategy generation

import { CategoryCustomization } from '@/types/enhanced-strategy';

interface SectorIntelligence {
  keywords: string[];
  positiveSignals: string[];
  negativeSignals: string[];
  requirements: string[];
}

interface StageIntelligence {
  focusAreas: string[];
  requirements: string[];
  signals: string[];
}

class IntelligentCriteriaService {
  // Sector-specific intelligence database
  private sectorIntelligence: Record<string, SectorIntelligence> = {
    'AI/ML': {
      keywords: ['artificial intelligence', 'machine learning', 'deep learning', 'neural networks'],
      positiveSignals: [
        'Proprietary AI algorithms and models',
        'Large, high-quality training datasets',
        'Strong AI/ML team with PhDs',
        'Clear AI competitive moat',
        'AI-first product architecture'
      ],
      negativeSignals: [
        'Generic AI implementation',
        'No proprietary data advantage',
        'Weak AI talent or outsourced development',
        'AI as feature, not core differentiator'
      ],
      requirements: [
        'Proven AI/ML capabilities',
        'Defensible data moats',
        'Strong technical team'
      ]
    },
    'SaaS': {
      keywords: ['software', 'subscription', 'cloud', 'platform'],
      positiveSignals: [
        'Strong SaaS metrics (ARR, MRR, churn)',
        'Net revenue retention >110%',
        'Product-led growth',
        'High switching costs',
        'Multi-product expansion'
      ],
      negativeSignals: [
        'High customer churn rates',
        'Poor unit economics',
        'Difficult customer acquisition',
        'Commoditized features'
      ],
      requirements: [
        'Strong SaaS fundamentals',
        'Proven product-market fit',
        'Scalable go-to-market'
      ]
    },
    'FinTech': {
      keywords: ['financial technology', 'payments', 'banking', 'insurance'],
      positiveSignals: [
        'Regulatory compliance and approvals',
        'Strong financial partnerships',
        'Clear unit economics',
        'Network effects',
        'Financial data advantages'
      ],
      negativeSignals: [
        'Regulatory uncertainty',
        'High compliance costs',
        'Strong incumbent competition',
        'Limited differentiation'
      ],
      requirements: [
        'Regulatory compliance',
        'Strong financial controls',
        'Experienced financial services team'
      ]
    },
    'HealthTech': {
      keywords: ['healthcare', 'medical devices', 'digital health', 'biotech'],
      positiveSignals: [
        'Clinical validation and trials',
        'FDA approvals or pathway',
        'Strong clinical team',
        'Proven health outcomes',
        'Payor reimbursement'
      ],
      negativeSignals: [
        'Regulatory uncertainty',
        'Long development cycles',
        'Unclear reimbursement',
        'Limited clinical evidence'
      ],
      requirements: [
        'Clinical validation',
        'Regulatory pathway',
        'Healthcare industry expertise'
      ]
    },
    'E-commerce': {
      keywords: ['e-commerce', 'marketplace', 'retail', 'consumer'],
      positiveSignals: [
        'Strong marketplace dynamics',
        'Network effects',
        'High repeat purchase rates',
        'Efficient customer acquisition',
        'Strong brand recognition'
      ],
      negativeSignals: [
        'High customer acquisition costs',
        'Low repeat purchase rates',
        'Intense competition',
        'Thin margins'
      ],
      requirements: [
        'Strong unit economics',
        'Proven customer retention',
        'Scalable operations'
      ]
    }
  };

  // Stage-specific intelligence
  private stageIntelligence: Record<string, StageIntelligence> = {
    'Seed': {
      focusAreas: ['Product-market fit', 'Team strength', 'Market opportunity'],
      requirements: [
        'Strong founding team',
        'Early product validation',
        'Clear market opportunity'
      ],
      signals: [
        'Early customer traction',
        'Product development progress',
        'Team execution capability'
      ]
    },
    'Series A': {
      focusAreas: ['Scalable business model', 'Go-to-market strategy', 'Growth metrics'],
      requirements: [
        'Proven product-market fit',
        'Scalable go-to-market',
        'Strong growth metrics'
      ],
      signals: [
        'Revenue growth',
        'Customer acquisition efficiency',
        'Market expansion potential'
      ]
    },
    'Series B': {
      focusAreas: ['Market expansion', 'Operational efficiency', 'Team scaling'],
      requirements: [
        'Proven unit economics',
        'Market leadership potential',
        'Strong operational metrics'
      ],
      signals: [
        'Market share growth',
        'Operational leverage',
        'International expansion'
      ]
    },
    'Growth': {
      focusAreas: ['Market leadership', 'International expansion', 'Profitability'],
      requirements: [
        'Market leadership position',
        'Clear path to profitability',
        'Strong competitive moats'
      ],
      signals: [
        'Market dominance',
        'Profitability metrics',
        'Strategic partnerships'
      ]
    }
  };

  // Generate intelligent criteria based on sectors and stages
  generateSectorSpecificCriteria(sectors: string[]): Partial<CategoryCustomization> {
    const aggregatedSignals = {
      positive: [] as string[],
      negative: [] as string[],
      requirements: [] as string[]
    };

    sectors.forEach(sector => {
      const intelligence = this.sectorIntelligence[sector];
      if (intelligence) {
        aggregatedSignals.positive.push(...intelligence.positiveSignals);
        aggregatedSignals.negative.push(...intelligence.negativeSignals);
        aggregatedSignals.requirements.push(...intelligence.requirements);
      }
    });

    return {
      positiveSignals: [...new Set(aggregatedSignals.positive)],
      negativeSignals: [...new Set(aggregatedSignals.negative)]
    };
  }

  // Generate stage-specific requirements
  generateStageSpecificRequirements(stages: string[]): string[] {
    const requirements: string[] = [];

    stages.forEach(stage => {
      const intelligence = this.stageIntelligence[stage];
      if (intelligence) {
        requirements.push(...intelligence.requirements);
      }
    });

    return [...new Set(requirements)];
  }

  // Generate contextual placeholder text for different categories and sectors
  generateContextualPlaceholder(categoryName: string, sectors: string[]): string {
    const categoryPlaceholders: Record<string, string> = {
      'Team & Leadership': 'Former unicorn founder, Domain expert with PhD, Ex-FAANG leadership team...',
      'Market Opportunity': 'Regulatory tailwinds, Large enterprise adoption, Market consolidation trends...',
      'Product & Technology': 'Proprietary algorithms, Patent portfolio, AI/ML competitive advantage...',
      'Business Traction': 'Logo customers, Viral growth, Strong unit economics...',
      'Financial Health': 'Positive unit economics, Efficient capital deployment, Clear monetization...',
      'Strategic Fit': 'Portfolio synergies, Strategic customer introductions, Cross-selling opportunities...'
    };

    let basePlaceholder = categoryPlaceholders[categoryName] || 'Enter specific signals...';

    // Enhance with sector-specific context
    if (sectors.length > 0) {
      const sectorContext = sectors.map(sector => {
        const intelligence = this.sectorIntelligence[sector];
        return intelligence ? intelligence.keywords.join(', ') : sector;
      }).join(', ');

      basePlaceholder = `${basePlaceholder} (Focus: ${sectorContext})`;
    }

    return basePlaceholder;
  }

  // Generate intelligent subcategory requirements
  generateSubcategoryRequirements(
    categoryName: string, 
    subcategoryName: string, 
    sectors: string[],
    stages: string[]
  ): string {
    const baseRequirements: Record<string, Record<string, string>> = {
      'Team & Leadership': {
        'Founder Experience': 'Previous startup experience or deep domain expertise',
        'Team Composition': 'Balanced technical and business leadership',
        'Vision & Communication': 'Clear vision articulation and stakeholder communication'
      },
      'Market Opportunity': {
        'Market Size': 'Large and growing total addressable market',
        'Market Timing': 'Favorable market timing and adoption trends',
        'Competitive Landscape': 'Defensible competitive position'
      },
      'Product & Technology': {
        'Product Innovation': 'Clear product differentiation and innovation',
        'Technology Advantage': 'Sustainable technology moats and IP',
        'Product-Market Fit': 'Strong evidence of product-market fit'
      },
      'Business Traction': {
        'Revenue Growth': 'Strong and sustainable revenue growth',
        'Customer Metrics': 'Healthy customer acquisition and retention',
        'Market Validation': 'Clear market demand and adoption'
      },
      'Financial Health': {
        'Financial Performance': 'Strong financial metrics and KPIs',
        'Capital Efficiency': 'Efficient capital deployment and usage',
        'Financial Planning': 'Robust financial planning and controls'
      },
      'Strategic Fit': {
        'Portfolio Synergies': 'Clear synergies with existing investments',
        'Investment Thesis Alignment': 'Strong alignment with fund strategy',
        'Value Creation Potential': 'Clear opportunities for value addition'
      }
    };

    let requirement = baseRequirements[categoryName]?.[subcategoryName] || 'Standard requirements';

    // Enhance with sector-specific context
    if (sectors.length > 0) {
      const sectorRequirements = this.generateSectorSpecificRequirements(categoryName, subcategoryName, sectors);
      if (sectorRequirements) {
        requirement = `${requirement}. ${sectorRequirements}`;
      }
    }

    return requirement;
  }

  // Generate sector-specific requirements for subcategories
  private generateSectorSpecificRequirements(
    categoryName: string, 
    subcategoryName: string, 
    sectors: string[]
  ): string | null {
    const sectorSpecificRequirements: Record<string, Record<string, Record<string, string>>> = {
      'AI/ML': {
        'Team & Leadership': {
          'Founder Experience': 'AI/ML research background or successful AI product experience',
          'Team Composition': 'Strong AI/ML technical team with relevant PhDs or industry experience'
        },
        'Product & Technology': {
          'Technology Advantage': 'Proprietary AI algorithms, unique training data, or novel AI architectures'
        }
      },
      'SaaS': {
        'Business Traction': {
          'Revenue Growth': 'Strong ARR growth with healthy SaaS metrics (MRR, churn, NRR)',
          'Customer Metrics': 'Low churn rates and high net revenue retention'
        },
        'Financial Health': {
          'Financial Performance': 'Strong SaaS unit economics with clear LTV/CAC ratios'
        }
      }
    };

    for (const sector of sectors) {
      const sectorReqs = sectorSpecificRequirements[sector]?.[categoryName]?.[subcategoryName];
      if (sectorReqs) {
        return sectorReqs;
      }
    }

    return null;
  }
}

export const intelligentCriteriaService = new IntelligentCriteriaService();