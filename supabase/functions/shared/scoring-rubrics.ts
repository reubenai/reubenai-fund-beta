// Enhanced Scoring Rubrics for VC and PE Fund Analysis
// These rubrics supplement existing enhanced_criteria with detailed evaluation frameworks

export interface RubricCriteria {
  name: string;
  weight: number;
  questions: string[];
  scoreMapping: {
    excellent: { score: number; description: string };
    good: { score: number; description: string };
    fair: { score: number; description: string };
    poor: { score: number; description: string };
  };
}

export interface RubricCategory {
  name: string;
  weight: number;
  criteria: RubricCriteria[];
  fundTypeSpecific?: {
    vc?: Partial<RubricCategory>;
    pe?: Partial<RubricCategory>;
  };
}

export interface ScoringRubric {
  fundType: 'vc' | 'pe';
  categories: RubricCategory[];
  overallWeighting: {
    [categoryName: string]: number;
  };
}

// Venture Capital Rubric - Growth and Innovation Focused
export const VC_SCORING_RUBRIC: ScoringRubric = {
  fundType: 'vc',
  categories: [
    {
      name: 'Market Opportunity',
      weight: 25,
      criteria: [
        {
          name: 'Market Size & Growth',
          weight: 30,
          questions: [
            'What is the total addressable market (TAM) and how accurately is it calculated?',
            'What is the current market growth rate and what drives this growth?',
            'How sustainable is the projected market expansion?',
            'Are there emerging market segments or use cases that could expand the TAM?'
          ],
          scoreMapping: {
            excellent: { score: 90, description: 'Large TAM ($10B+), high growth (30%+ annually), well-researched market data' },
            good: { score: 75, description: 'Significant TAM ($1-10B), solid growth (15-30% annually), credible market research' },
            fair: { score: 60, description: 'Moderate TAM ($100M-1B), steady growth (5-15% annually), some market validation' },
            poor: { score: 40, description: 'Small or unclear TAM, low/negative growth, insufficient market research' }
          }
        },
        {
          name: 'Competitive Landscape',
          weight: 25,
          questions: [
            'Who are the main competitors and how entrenched are they?',
            'What barriers to entry exist and how defendable is the company\'s position?',
            'How does the competitive landscape impact pricing and market share potential?',
            'Are there signs of market consolidation or fragmentation?'
          ],
          scoreMapping: {
            excellent: { score: 90, description: 'Clear competitive advantages, strong barriers to entry, favorable competitive dynamics' },
            good: { score: 75, description: 'Some competitive advantages, moderate barriers, manageable competition' },
            fair: { score: 60, description: 'Limited differentiation, low barriers, significant competition' },
            poor: { score: 40, description: 'Commodity market, no barriers, intense competition' }
          }
        },
        {
          name: 'Market Timing',
          weight: 25,
          questions: [
            'Is this the right time for this solution in the market?',
            'What market trends and adoption cycles support this timing?',
            'How do regulatory changes or technology shifts impact market readiness?',
            'What evidence suggests market pull vs. technology push?'
          ],
          scoreMapping: {
            excellent: { score: 90, description: 'Perfect timing, strong market pull, favorable trends and regulations' },
            good: { score: 75, description: 'Good timing, some market pull, supportive trends' },
            fair: { score: 60, description: 'Acceptable timing, mixed signals, some adoption barriers' },
            poor: { score: 40, description: 'Poor timing, market not ready, unfavorable conditions' }
          }
        },
        {
          name: 'Customer Validation',
          weight: 20,
          questions: [
            'How strong is the evidence of customer demand and willingness to pay?',
            'What is the quality and depth of customer discovery and validation?',
            'How diverse and representative is the customer feedback?',
            'What proof points exist for product-market fit?'
          ],
          scoreMapping: {
            excellent: { score: 90, description: 'Strong customer validation, proven willingness to pay, clear product-market fit' },
            good: { score: 75, description: 'Good customer feedback, some paying customers, emerging product-market fit' },
            fair: { score: 60, description: 'Limited validation, interested prospects, product-market fit uncertain' },
            poor: { score: 40, description: 'Weak validation, no paying customers, no clear product-market fit' }
          }
        }
      ]
    },
    {
      name: 'Product & Technology',
      weight: 25,
      criteria: [
        {
          name: 'Innovation & Differentiation',
          weight: 30,
          questions: [
            'How innovative is the technology or approach compared to existing solutions?',
            'What unique value proposition does the product offer?',
            'How sustainable is the technological differentiation?',
            'What is the potential for the innovation to create new markets or transform existing ones?'
          ],
          scoreMapping: {
            excellent: { score: 90, description: 'Breakthrough innovation, unique approach, transformative potential' },
            good: { score: 75, description: 'Meaningful innovation, clear differentiation, competitive advantages' },
            fair: { score: 60, description: 'Incremental innovation, some differentiation, temporary advantages' },
            poor: { score: 40, description: 'Limited innovation, minimal differentiation, easily replicable' }
          }
        },
        {
          name: 'Technical Execution',
          weight: 25,
          questions: [
            'How strong is the technical execution and product quality?',
            'What is the architecture scalability and technical debt situation?',
            'How robust is the technology stack and development processes?',
            'What evidence exists of strong engineering practices and capability?'
          ],
          scoreMapping: {
            excellent: { score: 90, description: 'Excellent technical execution, scalable architecture, strong engineering practices' },
            good: { score: 75, description: 'Good technical quality, reasonable scalability, solid engineering' },
            fair: { score: 60, description: 'Acceptable quality, some scalability concerns, basic engineering practices' },
            poor: { score: 40, description: 'Poor technical execution, scalability issues, weak engineering' }
          }
        },
        {
          name: 'Intellectual Property',
          weight: 20,
          questions: [
            'What intellectual property protection exists or is planned?',
            'How defensible are the core technologies and innovations?',
            'What freedom to operate considerations exist?',
            'How does the IP strategy support competitive positioning?'
          ],
          scoreMapping: {
            excellent: { score: 90, description: 'Strong IP portfolio, defendable innovations, clear freedom to operate' },
            good: { score: 75, description: 'Some IP protection, reasonable defensibility, manageable IP risks' },
            fair: { score: 60, description: 'Limited IP, some defensibility, minor IP concerns' },
            poor: { score: 40, description: 'Weak or no IP, easily copied, significant IP risks' }
          }
        },
        {
          name: 'Development Roadmap',
          weight: 25,
          questions: [
            'How clear and achievable is the product development roadmap?',
            'What are the key technical milestones and how realistic are the timelines?',
            'How does the roadmap align with market needs and competitive pressures?',
            'What resources and capabilities are needed to execute the roadmap?'
          ],
          scoreMapping: {
            excellent: { score: 90, description: 'Clear roadmap, realistic milestones, strong market alignment' },
            good: { score: 75, description: 'Good roadmap, achievable goals, reasonable market fit' },
            fair: { score: 60, description: 'Basic roadmap, some uncertainty, partial market alignment' },
            poor: { score: 40, description: 'Unclear roadmap, unrealistic goals, poor market understanding' }
          }
        }
      ]
    },
    {
      name: 'Team & Leadership',
      weight: 25,
      criteria: [
        {
          name: 'Founder Quality',
          weight: 35,
          questions: [
            'What relevant experience and expertise do the founders bring?',
            'How strong is their track record of execution and leadership?',
            'What domain knowledge and industry connections do they possess?',
            'How coachable and adaptable are they to feedback and changing conditions?'
          ],
          scoreMapping: {
            excellent: { score: 90, description: 'Exceptional founders, proven track record, deep domain expertise, highly coachable' },
            good: { score: 75, description: 'Strong founders, relevant experience, good domain knowledge, receptive to feedback' },
            fair: { score: 60, description: 'Decent founders, some experience, basic domain knowledge, moderately coachable' },
            poor: { score: 40, description: 'Weak founders, limited experience, poor domain fit, resistant to feedback' }
          }
        },
        {
          name: 'Team Composition',
          weight: 25,
          questions: [
            'How well does the team composition match the business needs?',
            'What key roles are filled and what critical gaps exist?',
            'How complementary are the skills and backgrounds of team members?',
            'What is the quality and experience level of key executives?'
          ],
          scoreMapping: {
            excellent: { score: 90, description: 'Complete team, excellent skill match, complementary backgrounds, strong executives' },
            good: { score: 75, description: 'Good team coverage, relevant skills, some complementarity, decent executives' },
            fair: { score: 60, description: 'Basic team, some skill gaps, limited complementarity, average executives' },
            poor: { score: 40, description: 'Incomplete team, major gaps, poor skill match, weak executives' }
          }
        },
        {
          name: 'Execution Capability',
          weight: 25,
          questions: [
            'What evidence exists of the team\'s ability to execute and deliver results?',
            'How well do they prioritize and focus on key objectives?',
            'What is their track record of meeting milestones and commitments?',
            'How effectively do they adapt to challenges and pivot when necessary?'
          ],
          scoreMapping: {
            excellent: { score: 90, description: 'Proven execution, strong focus, consistent delivery, effective adaptation' },
            good: { score: 75, description: 'Good execution, reasonable focus, mostly meets commitments, adapts when needed' },
            fair: { score: 60, description: 'Basic execution, some focus issues, mixed track record, slow to adapt' },
            poor: { score: 40, description: 'Poor execution, lack of focus, missed commitments, resistant to change' }
          }
        },
        {
          name: 'Advisory & Network',
          weight: 15,
          questions: [
            'What quality of advisors and board members are involved?',
            'How relevant are their networks and industry connections?',
            'What strategic value do advisors bring beyond capital?',
            'How effectively does the team leverage advisory relationships?'
          ],
          scoreMapping: {
            excellent: { score: 90, description: 'Top-tier advisors, excellent networks, strategic value, effective leverage' },
            good: { score: 75, description: 'Quality advisors, good networks, some strategic value, decent leverage' },
            fair: { score: 60, description: 'Basic advisors, limited networks, minimal strategic value, poor leverage' },
            poor: { score: 40, description: 'No or weak advisors, no networks, no strategic value, no leverage' }
          }
        }
      ]
    },
    {
      name: 'Financial & Traction',
      weight: 25,
      criteria: [
        {
          name: 'Revenue & Growth',
          weight: 30,
          questions: [
            'What is the current revenue level and growth trajectory?',
            'How sustainable and predictable is the revenue stream?',
            'What drives revenue growth and how scalable are those drivers?',
            'How does revenue growth compare to industry benchmarks and competitors?'
          ],
          scoreMapping: {
            excellent: { score: 90, description: 'Strong revenue, high growth (100%+ annually), predictable and scalable' },
            good: { score: 75, description: 'Good revenue, solid growth (50-100% annually), mostly predictable' },
            fair: { score: 60, description: 'Moderate revenue, steady growth (20-50% annually), some predictability' },
            poor: { score: 40, description: 'Low revenue, slow growth (<20% annually), unpredictable' }
          }
        },
        {
          name: 'Unit Economics',
          weight: 25,
          questions: [
            'What are the unit economics (CAC, LTV, gross margins) and trends?',
            'How do unit economics compare to industry standards and benchmarks?',
            'What is the path to profitability and cash flow positive operations?',
            'How sensitive are unit economics to scale and market conditions?'
          ],
          scoreMapping: {
            excellent: { score: 90, description: 'Excellent unit economics, LTV:CAC >3:1, clear path to profitability' },
            good: { score: 75, description: 'Good unit economics, reasonable ratios, probable path to profitability' },
            fair: { score: 60, description: 'Acceptable unit economics, some concerns, uncertain profitability path' },
            poor: { score: 40, description: 'Poor unit economics, unfavorable ratios, no clear profitability path' }
          }
        },
        {
          name: 'Customer Metrics',
          weight: 25,
          questions: [
            'What are the key customer acquisition and retention metrics?',
            'How strong is customer engagement and product stickiness?',
            'What is the customer satisfaction and Net Promoter Score?',
            'How diverse is the customer base and what concentration risks exist?'
          ],
          scoreMapping: {
            excellent: { score: 90, description: 'Strong acquisition, high retention (>90%), excellent engagement, diverse base' },
            good: { score: 75, description: 'Good acquisition, decent retention (80-90%), good engagement, reasonably diverse' },
            fair: { score: 60, description: 'Moderate acquisition, average retention (70-80%), fair engagement, some concentration' },
            poor: { score: 40, description: 'Weak acquisition, poor retention (<70%), low engagement, high concentration' }
          }
        },
        {
          name: 'Funding Requirements',
          weight: 20,
          questions: [
            'How reasonable are the funding requirements and use of capital?',
            'What milestones will the funding enable and how realistic are they?',
            'How long will the funding last and what are the follow-on requirements?',
            'How does the valuation and terms compare to market standards?'
          ],
          scoreMapping: {
            excellent: { score: 90, description: 'Reasonable funding needs, clear milestones, adequate runway, fair valuation' },
            good: { score: 75, description: 'Justified funding, achievable milestones, sufficient runway, acceptable valuation' },
            fair: { score: 60, description: 'Higher funding needs, uncertain milestones, tight runway, elevated valuation' },
            poor: { score: 40, description: 'Excessive funding, unclear milestones, insufficient runway, unrealistic valuation' }
          }
        }
      ]
    }
  ],
  overallWeighting: {
    'Market Opportunity': 25,
    'Product & Technology': 25,
    'Team & Leadership': 25,
    'Financial & Traction': 25
  }
};

// Private Equity Rubric - Operational Excellence and Value Creation Focused
export const PE_SCORING_RUBRIC: ScoringRubric = {
  fundType: 'pe',
  categories: [
    {
      name: 'Financial Performance',
      weight: 25,
      criteria: [
        {
          name: 'Revenue Quality & Growth',
          weight: 30,
          questions: [
            'How consistent and predictable is the revenue stream?',
            'What is the revenue growth trajectory over the past 3-5 years?',
            'How diversified is the revenue base across customers, products, and geographies?',
            'What are the revenue recognition policies and quality of earnings?'
          ],
          scoreMapping: {
            excellent: { score: 90, description: 'Predictable revenue, consistent growth (15%+ annually), well diversified, high quality' },
            good: { score: 75, description: 'Mostly predictable, good growth (10-15% annually), reasonably diversified, good quality' },
            fair: { score: 60, description: 'Some predictability, moderate growth (5-10% annually), some diversification, acceptable quality' },
            poor: { score: 40, description: 'Unpredictable revenue, slow growth (<5% annually), concentrated, quality concerns' }
          }
        },
        {
          name: 'Profitability & Margins',
          weight: 25,
          questions: [
            'What are the current profitability levels (EBITDA, operating margins)?',
            'How do margins compare to industry peers and best-in-class companies?',
            'What are the trends in profitability and what drives margin expansion/compression?',
            'How sustainable are current margin levels given competitive and cost pressures?'
          ],
          scoreMapping: {
            excellent: { score: 90, description: 'High profitability, industry-leading margins, improving trends, sustainable' },
            good: { score: 75, description: 'Good profitability, above-average margins, stable trends, mostly sustainable' },
            fair: { score: 60, description: 'Acceptable profitability, average margins, mixed trends, some sustainability concerns' },
            poor: { score: 40, description: 'Low profitability, below-average margins, declining trends, unsustainable' }
          }
        },
        {
          name: 'Cash Flow Generation',
          weight: 25,
          questions: [
            'How strong is the free cash flow generation and conversion from earnings?',
            'What are the working capital requirements and seasonal patterns?',
            'How predictable is the cash flow and what are the key drivers?',
            'What capital expenditure requirements exist for maintenance and growth?'
          ],
          scoreMapping: {
            excellent: { score: 90, description: 'Strong cash generation, high conversion, predictable, low capex needs' },
            good: { score: 75, description: 'Good cash flow, decent conversion, mostly predictable, moderate capex' },
            fair: { score: 60, description: 'Adequate cash flow, some conversion issues, somewhat predictable, higher capex' },
            poor: { score: 40, description: 'Weak cash flow, poor conversion, unpredictable, high capex requirements' }
          }
        },
        {
          name: 'Financial Controls & Reporting',
          weight: 20,
          questions: [
            'How robust are the financial controls and reporting systems?',
            'What is the quality of financial management and accounting practices?',
            'How timely and accurate is financial reporting and forecasting?',
            'What improvements are needed in financial infrastructure and processes?'
          ],
          scoreMapping: {
            excellent: { score: 90, description: 'Excellent controls, high-quality reporting, accurate forecasting, robust systems' },
            good: { score: 75, description: 'Good controls, reliable reporting, decent forecasting, adequate systems' },
            fair: { score: 60, description: 'Basic controls, acceptable reporting, mixed forecasting, some system needs' },
            poor: { score: 40, description: 'Weak controls, poor reporting, inaccurate forecasting, significant system gaps' }
          }
        }
      ]
    },
    {
      name: 'Market Position',
      weight: 25,
      criteria: [
        {
          name: 'Market Share & Position',
          weight: 30,
          questions: [
            'What is the company\'s market share and competitive position?',
            'How defensible is the market position and what are the competitive moats?',
            'What are the barriers to entry and how do they protect market share?',
            'How has the competitive position evolved over time?'
          ],
          scoreMapping: {
            excellent: { score: 90, description: 'Leading market position, strong moats, high barriers, improving position' },
            good: { score: 75, description: 'Strong position, some moats, moderate barriers, stable position' },
            fair: { score: 60, description: 'Decent position, limited moats, low barriers, mixed position trends' },
            poor: { score: 40, description: 'Weak position, no moats, no barriers, declining position' }
          }
        },
        {
          name: 'Brand Strength & Customer Loyalty',
          weight: 25,
          questions: [
            'How strong is the brand recognition and customer loyalty?',
            'What is the customer retention rate and switching costs?',
            'How does the brand compare to competitors in terms of preference and pricing power?',
            'What investments in brand building and customer experience have been made?'
          ],
          scoreMapping: {
            excellent: { score: 90, description: 'Strong brand, high loyalty, high switching costs, pricing power' },
            good: { score: 75, description: 'Good brand, decent loyalty, some switching costs, some pricing power' },
            fair: { score: 60, description: 'Average brand, moderate loyalty, low switching costs, limited pricing power' },
            poor: { score: 40, description: 'Weak brand, low loyalty, no switching costs, no pricing power' }
          }
        },
        {
          name: 'Customer Base Quality',
          weight: 25,
          questions: [
            'How diverse and stable is the customer base?',
            'What is the customer concentration and key account dependencies?',
            'How satisfied are customers and what is the Net Promoter Score?',
            'What are the customer acquisition costs and lifetime value metrics?'
          ],
          scoreMapping: {
            excellent: { score: 90, description: 'Diverse, stable base, low concentration, high satisfaction, strong metrics' },
            good: { score: 75, description: 'Good diversity, mostly stable, moderate concentration, good satisfaction' },
            fair: { score: 60, description: 'Some diversity, somewhat stable, some concentration, acceptable satisfaction' },
            poor: { score: 40, description: 'Concentrated, unstable, high dependencies, poor satisfaction' }
          }
        },
        {
          name: 'Market Dynamics',
          weight: 20,
          questions: [
            'How attractive are the overall market dynamics and growth prospects?',
            'What are the key market trends and how do they impact the business?',
            'How cyclical or defensive is the market and business model?',
            'What regulatory or technological changes could impact the market?'
          ],
          scoreMapping: {
            excellent: { score: 90, description: 'Attractive dynamics, positive trends, defensive characteristics, favorable changes' },
            good: { score: 75, description: 'Good dynamics, mostly positive trends, balanced cyclicality, manageable changes' },
            fair: { score: 60, description: 'Mixed dynamics, some positive trends, somewhat cyclical, uncertain changes' },
            poor: { score: 40, description: 'Poor dynamics, negative trends, highly cyclical, unfavorable changes' }
          }
        }
      ]
    },
    {
      name: 'Operational Excellence',
      weight: 25,
      criteria: [
        {
          name: 'Management Team Quality',
          weight: 30,
          questions: [
            'How experienced and capable is the management team?',
            'What is their track record of execution and value creation?',
            'How aligned are management incentives with value creation?',
            'What depth and succession planning exists for key roles?'
          ],
          scoreMapping: {
            excellent: { score: 90, description: 'Exceptional management, proven track record, well-aligned incentives, strong depth' },
            good: { score: 75, description: 'Strong management, good track record, reasonable alignment, adequate depth' },
            fair: { score: 60, description: 'Decent management, mixed track record, some alignment, limited depth' },
            poor: { score: 40, description: 'Weak management, poor track record, misaligned incentives, no depth' }
          }
        },
        {
          name: 'Operational Efficiency',
          weight: 25,
          questions: [
            'How efficient are the core operations and business processes?',
            'What opportunities exist for operational improvement and cost reduction?',
            'How do operational metrics compare to industry benchmarks?',
            'What technology and automation opportunities could improve efficiency?'
          ],
          scoreMapping: {
            excellent: { score: 90, description: 'Highly efficient, limited improvement needs, above-benchmark, advanced technology' },
            good: { score: 75, description: 'Good efficiency, some improvement opportunities, at benchmark, decent technology' },
            fair: { score: 60, description: 'Adequate efficiency, clear improvement needs, below benchmark, basic technology' },
            poor: { score: 40, description: 'Poor efficiency, major improvement needs, well below benchmark, outdated technology' }
          }
        },
        {
          name: 'Organizational Capabilities',
          weight: 25,
          questions: [
            'How strong are the organizational capabilities and culture?',
            'What is the quality of the workforce and talent management practices?',
            'How effective are the organizational structure and decision-making processes?',
            'What investments in people development and retention have been made?'
          ],
          scoreMapping: {
            excellent: { score: 90, description: 'Strong capabilities, quality workforce, effective structure, good investments' },
            good: { score: 75, description: 'Good capabilities, decent workforce, reasonable structure, some investments' },
            fair: { score: 60, description: 'Basic capabilities, average workforce, adequate structure, limited investments' },
            poor: { score: 40, description: 'Weak capabilities, poor workforce, ineffective structure, no investments' }
          }
        },
        {
          name: 'Technology & Systems',
          weight: 20,
          questions: [
            'How modern and effective are the technology systems and infrastructure?',
            'What technology investments are needed to support growth and efficiency?',
            'How well integrated are the core business systems?',
            'What cybersecurity and data management capabilities exist?'
          ],
          scoreMapping: {
            excellent: { score: 90, description: 'Modern systems, minimal investment needs, well integrated, strong security' },
            good: { score: 75, description: 'Decent systems, some investment needs, mostly integrated, adequate security' },
            fair: { score: 60, description: 'Basic systems, significant investment needs, partially integrated, basic security' },
            poor: { score: 40, description: 'Outdated systems, major investment needs, poorly integrated, weak security' }
          }
        }
      ]
    },
    {
      name: 'Growth Potential',
      weight: 25,
      criteria: [
        {
          name: 'Organic Growth Opportunities',
          weight: 30,
          questions: [
            'What organic growth opportunities exist in core markets and segments?',
            'How realistic are the growth plans and what execution capabilities are required?',
            'What new products, services, or markets could drive growth?',
            'How scalable is the business model and what constraints exist?'
          ],
          scoreMapping: {
            excellent: { score: 90, description: 'Significant organic opportunities, realistic plans, strong execution capability, highly scalable' },
            good: { score: 75, description: 'Good organic opportunities, achievable plans, decent execution, reasonably scalable' },
            fair: { score: 60, description: 'Some organic opportunities, uncertain plans, limited execution, somewhat scalable' },
            poor: { score: 40, description: 'Limited organic opportunities, unrealistic plans, poor execution, not scalable' }
          }
        },
        {
          name: 'Market Expansion Potential',
          weight: 25,
          questions: [
            'What opportunities exist for geographic or market segment expansion?',
            'How attractive are adjacent markets and what entry strategies are viable?',
            'What partnerships or channels could accelerate market expansion?',
            'What regulatory or competitive barriers exist to expansion?'
          ],
          scoreMapping: {
            excellent: { score: 90, description: 'Strong expansion opportunities, viable strategies, good partnerships, minimal barriers' },
            good: { score: 75, description: 'Good expansion potential, reasonable strategies, some partnerships, manageable barriers' },
            fair: { score: 60, description: 'Limited expansion opportunities, uncertain strategies, few partnerships, significant barriers' },
            poor: { score: 40, description: 'No expansion opportunities, no viable strategies, no partnerships, major barriers' }
          }
        },
        {
          name: 'Value Creation Initiatives',
          weight: 25,
          questions: [
            'What specific value creation initiatives have been identified?',
            'How quantified are the value creation opportunities and timelines?',
            'What resources and capabilities are needed to execute the initiatives?',
            'How have similar initiatives performed at comparable companies?'
          ],
          scoreMapping: {
            excellent: { score: 90, description: 'Clear initiatives, well quantified, adequate resources, proven track record' },
            good: { score: 75, description: 'Good initiatives, mostly quantified, sufficient resources, good track record' },
            fair: { score: 60, description: 'Some initiatives, partially quantified, limited resources, mixed track record' },
            poor: { score: 40, description: 'Unclear initiatives, not quantified, insufficient resources, poor track record' }
          }
        },
        {
          name: 'Exit Strategy Potential',
          weight: 20,
          questions: [
            'What are the potential exit strategies and how realistic are they?',
            'How attractive would the company be to strategic or financial buyers?',
            'What is the likelihood of an IPO and what market conditions would support it?',
            'What value multiples are achievable and how do they compare to entry multiples?'
          ],
          scoreMapping: {
            excellent: { score: 90, description: 'Multiple exit options, highly attractive to buyers, IPO potential, strong multiples' },
            good: { score: 75, description: 'Good exit options, attractive to buyers, possible IPO, decent multiples' },
            fair: { score: 60, description: 'Limited exit options, moderately attractive, unlikely IPO, fair multiples' },
            poor: { score: 40, description: 'Few exit options, not attractive to buyers, no IPO potential, poor multiples' }
          }
        }
      ]
    }
  ],
  overallWeighting: {
    'Financial Performance': 25,
    'Market Position': 25,
    'Operational Excellence': 25,
    'Growth Potential': 25
  }
};

// Rubric Application Functions
export function getRubricForFundType(fundType: 'vc' | 'pe'): ScoringRubric {
  return fundType === 'vc' ? VC_SCORING_RUBRIC : PE_SCORING_RUBRIC;
}

export function mapRubricToEnhancedCriteria(
  rubric: ScoringRubric,
  enhancedCriteria: any
): any {
  // Map rubric categories to enhanced_criteria subcategories
  // This ensures rubrics supplement existing criteria without duplication
  const mapping = {
    vc: {
      'Market Opportunity': 'Market Opportunity',
      'Product & Technology': 'Product & Technology', 
      'Team & Leadership': 'Team & Leadership',
      'Financial & Traction': 'Financial & Traction'
    },
    pe: {
      'Financial Performance': 'Financial & Traction',
      'Market Position': 'Market Opportunity',
      'Operational Excellence': 'Team & Leadership',
      'Growth Potential': 'Product & Technology'
    }
  };

  return mapping[rubric.fundType] || {};
}

export function calculateRubricScore(
  category: RubricCategory,
  responses: { [criteriaName: string]: number }
): {
  categoryScore: number;
  criteriaScores: { [criteriaName: string]: number };
  weightedTotal: number;
} {
  let totalWeightedScore = 0;
  let totalWeight = 0;
  const criteriaScores: { [criteriaName: string]: number } = {};

  for (const criteria of category.criteria) {
    const score = responses[criteria.name] || 0;
    const weightedScore = score * (criteria.weight / 100);
    
    criteriaScores[criteria.name] = score;
    totalWeightedScore += weightedScore;
    totalWeight += criteria.weight;
  }

  const categoryScore = totalWeight > 0 ? (totalWeightedScore / totalWeight) * 100 : 0;
  
  return {
    categoryScore,
    criteriaScores,
    weightedTotal: totalWeightedScore
  };
}

export function generateRubricPrompt(
  rubric: ScoringRubric,
  category: RubricCategory,
  dealData: any,
  documentData?: any,
  notesData?: any
): string {
  const questions = category.criteria.flatMap(c => c.questions);
  
  return `
# ${category.name} Analysis - ${rubric.fundType.toUpperCase()} Fund Rubric

## Company: ${dealData.company_name}
## Industry: ${dealData.industry || 'Not specified'}
## Stage: ${dealData.stage || 'Not specified'}

## Evaluation Framework
You are evaluating this ${rubric.fundType === 'vc' ? 'venture capital' : 'private equity'} investment opportunity using a structured rubric approach.

## Available Information
**Deal Data**: ${JSON.stringify(dealData, null, 2)}
${documentData ? `**Document Intelligence**: ${JSON.stringify(documentData, null, 2)}` : ''}
${notesData ? `**Notes Intelligence**: ${JSON.stringify(notesData, null, 2)}` : ''}

## Evaluation Questions for ${category.name}
${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

## Scoring Instructions
For each criteria in this category, provide:
1. **Score** (0-100): Based on the scoring rubric provided
2. **Rationale**: Detailed explanation supporting the score
3. **Evidence**: Specific data points or insights that inform the score
4. **Risk Factors**: Any concerns or red flags identified
5. **Upside Potential**: Any particularly strong aspects or opportunities

## Response Format
Return a JSON object with the following structure:
{
  "category": "${category.name}",
  "overall_category_score": number,
  "criteria_scores": {
    ${category.criteria.map(c => `"${c.name}": { "score": number, "rationale": "string", "evidence": ["string"], "risk_factors": ["string"], "upside_potential": ["string"] }`).join(',\n    ')}
  },
  "category_insights": "string",
  "key_recommendations": ["string"]
}

Ensure your analysis is thorough, evidence-based, and tailored to ${rubric.fundType === 'vc' ? 'venture capital' : 'private equity'} investment criteria.
`;
}