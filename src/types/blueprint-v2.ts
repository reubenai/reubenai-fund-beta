// Blueprint v2 Architecture - Enhanced Analysis Framework
// Supports both VC and PE fund types with dynamic workflow orchestration

export type FundType = 'venture_capital' | 'private_equity';
export type AnalysisEngine = 
  | 'market-research-engine'
  | 'team-research-engine' 
  | 'product-ip-engine'
  | 'financial-engine'
  | 'thesis-alignment-engine'
  | 'traction-analysis-engine'
  | 'governance-analysis-engine'
  | 'operations-analysis-engine'
  | 'value-creation-engine'
  | 'risk-analysis-engine'
  | 'exit-strategy-engine'
  | 'deal-structure-engine'
  | 'data-availability-engine'
  | 'market-dynamics-engine'
  | 'competitive-positioning-engine'
  | 'succession-planning-engine';

export interface DataSource {
  source_type: 'company_data' | 'market_research' | 'financial_data' | 'team_research' | 'product_data' | 'competitive_intel' | 'external_api' | 'document_parsing';
  source_name: string;
  data_points: string[];
  reliability_score: number; // 1-10
  freshness_requirement: 'real_time' | 'daily' | 'weekly' | 'monthly' | 'historical';
  fallback_sources?: string[];
}

export interface SubcategoryScore {
  subcategory_id: string;
  subcategory_name: string;
  score: number; // 0-100
  confidence: number; // 0-100
  weight: number;
  data_completeness: number; // 0-100
  reasoning: string;
  insights: string[];
  risk_flags: string[];
  recommendations: string[];
  data_points: Record<string, any>;
  sources_used: string[];
  last_updated: string;
  engine_responsible: AnalysisEngine;
}

export interface CategoryScore {
  category_id: string;
  category_name: string;
  fund_type: FundType;
  overall_score: number; // 0-100
  overall_confidence: number; // 0-100
  total_weight: number;
  subcategories: SubcategoryScore[];
  category_insights: string[];
  category_risks: string[];
  category_recommendations: string[];
  last_updated: string;
}

export interface BlueprintV2Scores {
  deal_id: string;
  fund_id: string;
  fund_type: FundType;
  overall_score: number; // 0-100
  overall_confidence: number; // 0-100
  categories: CategoryScore[];
  analysis_completeness: number; // 0-100 based on data availability
  quality_metrics: {
    data_freshness: number; // 0-100
    source_reliability: number; // 0-100
    analysis_depth: number; // 0-100
    cross_validation: number; // 0-100
  };
  execution_metadata: {
    analysis_version: string;
    workflow_type: string;
    execution_token: string;
    started_at: string;
    completed_at?: string;
    total_duration_ms?: number;
    engines_used: AnalysisEngine[];
  };
  fund_memory_integration: {
    pattern_matches: string[];
    historical_comparisons: any[];
    decision_context: any;
  };
}

export interface WorkflowDefinition {
  workflow_id: string;
  workflow_name: string;
  fund_type: FundType;
  description: string;
  steps: WorkflowStep[];
  execution_order: string[];
  parallel_execution_groups?: string[][];
  fallback_strategies: Record<string, string>;
}

export interface WorkflowStep {
  step_id: string;
  step_name: string;
  engine_name: AnalysisEngine;
  input_requirements: string[];
  output_schema: any;
  execution_timeout: number;
  retry_policy: {
    max_attempts: number;
    backoff_strategy: 'linear' | 'exponential';
  };
  depends_on?: string[];
  is_critical: boolean;
}

// VC-specific Blueprint Categories
export const VC_CATEGORIES = {
  TEAM_LEADERSHIP: {
    category_id: 'team-leadership',
    category_name: 'Team & Leadership', 
    weight: 20,
    subcategories: [
      'founder-market-fit',
      'team-composition', 
      'leadership-experience',
      'advisory-board',
      'hiring-capability'
    ]
  },
  MARKET_OPPORTUNITY: {
    category_id: 'market-opportunity',
    category_name: 'Market Opportunity',
    weight: 25,
    subcategories: [
      'market-size-tam',
      'market-growth-rate',
      'competitive-landscape',
      'market-timing',
      'customer-validation'
    ]
  },
  PRODUCT_TECHNOLOGY: {
    category_id: 'product-technology', 
    category_name: 'Product & Technology',
    weight: 20,
    subcategories: [
      'product-market-fit',
      'technology-differentiation',
      'scalability-architecture',
      'ip-protection',
      'development-roadmap'
    ]
  },
  BUSINESS_TRACTION: {
    category_id: 'business-traction',
    category_name: 'Business Traction',
    weight: 15,
    subcategories: [
      'revenue-model',
      'customer-acquisition', 
      'unit-economics',
      'growth-metrics',
      'retention-rates'
    ]
  },
  FINANCIAL_HEALTH: {
    category_id: 'financial-health',
    category_name: 'Financial Health',
    weight: 10,
    subcategories: [
      'burn-rate',
      'runway',
      'funding-efficiency',
      'financial-projections'
    ]
  },
  STRATEGIC_FIT: {
    category_id: 'strategic-fit',
    category_name: 'Strategic Fit',
    weight: 10,
    subcategories: [
      'fund-thesis-alignment',
      'portfolio-synergies',
      'investment-size-fit',
      'exit-potential'
    ]
  }
} as const;

// PE-specific Blueprint Categories  
export const PE_CATEGORIES = {
  FINANCIAL_PERFORMANCE: {
    category_id: 'financial-performance',
    category_name: 'Financial Performance',
    weight: 15,
    subcategories: [
      'revenue-quality',
      'profitability-analysis', 
      'cash-flow-generation',
      'capital-efficiency',
      'financial-stability'
    ]
  },
  MARKET_DYNAMICS: {
    category_id: 'market-dynamics',
    category_name: 'Market Dynamics',
    weight: 10,
    subcategories: [
      'market-trends',
      'industry-cycles',
      'regulatory-environment',
      'economic-factors',
      'disruption-risks'
    ]
  },
  COMPETITIVE_POSITIONING: {
    category_id: 'competitive-positioning',
    category_name: 'Competitive Positioning',
    weight: 12,
    subcategories: [
      'competitive-moats',
      'market-differentiation',
      'switching-costs',
      'network-effects',
      'scale-advantages'
    ]
  },
  MANAGEMENT_SUCCESSION: {
    category_id: 'management-succession',
    category_name: 'Management & Succession',
    weight: 12,
    subcategories: [
      'leadership-bench',
      'key-person-risk',
      'management-transition',
      'knowledge-transfer',
      'retention-strategies'
    ]
  },
  OPERATIONAL_LEVERS: {
    category_id: 'operational-levers',
    category_name: 'Operational Levers',
    weight: 10,
    subcategories: [
      'process-optimization',
      'cost-management',
      'technology-systems',
      'operational-efficiency',
      'productivity-improvements'
    ]
  },
  DEAL_STRUCTURE: {
    category_id: 'deal-structure',
    category_name: 'Deal Structure',
    weight: 8,
    subcategories: [
      'transaction-structure',
      'governance-terms',
      'liquidation-preferences',
      'board-composition',
      'investor-rights'
    ]
  },
  EXIT_PATH_TIMING: {
    category_id: 'exit-path-timing',
    category_name: 'Exit Path & Timing',
    weight: 10,
    subcategories: [
      'exit-timeline',
      'valuation-multiples',
      'strategic-buyers',
      'ipo-readiness',
      'market-conditions'
    ]
  },
  STRATEGIC_FIT: {
    category_id: 'strategic-fit',
    category_name: 'Strategic Fit',
    weight: 8,
    subcategories: [
      'fund-strategy-alignment',
      'portfolio-synergies',
      'investment-size-fit',
      'value-creation-plan',
      'thesis-alignment'
    ]
  },
  RISK_PROFILE: {
    category_id: 'risk-profile',
    category_name: 'Risk Profile',
    weight: 10,
    subcategories: [
      'risk-assessment',
      'mitigation-strategies',
      'scenario-analysis',
      'regulatory-risks',
      'market-risks'
    ]
  },
  DATA_AVAILABILITY: {
    category_id: 'data-availability',
    category_name: 'Data Availability',
    weight: 5,
    subcategories: [
      'data-completeness',
      'information-quality',
      'due-diligence-gaps',
      'management-reporting',
      'financial-transparency'
    ]
  }
} as const;

// Workflow Definitions
export const VC_DEAL_ANALYSIS_WORKFLOW: WorkflowDefinition = {
  workflow_id: 'vc-deal-analysis-v2',
  workflow_name: 'VC Deal Analysis v2',
  fund_type: 'venture_capital',
  description: 'Comprehensive VC deal analysis using Blueprint v2',
  steps: [
    {
      step_id: 'entity-canonicalisation',
      step_name: 'Entity Canonicalisation',
      engine_name: 'market-research-engine',
      input_requirements: ['deal_id', 'company_name'],
      output_schema: { canonical_entities: 'object' },
      execution_timeout: 30000,
      retry_policy: { max_attempts: 3, backoff_strategy: 'exponential' },
      is_critical: true
    },
    {
      step_id: 'team-leadership-analysis',
      step_name: 'Team & Leadership Analysis', 
      engine_name: 'team-research-engine',
      input_requirements: ['canonical_entities'],
      output_schema: { team_analysis: 'object' },
      execution_timeout: 45000,
      retry_policy: { max_attempts: 3, backoff_strategy: 'exponential' },
      depends_on: ['entity-canonicalisation'],
      is_critical: false
    },
    {
      step_id: 'market-opportunity-analysis',
      step_name: 'Market Opportunity Analysis',
      engine_name: 'market-research-engine',
      input_requirements: ['canonical_entities', 'market_context'],
      output_schema: { market_analysis: 'object' },
      execution_timeout: 60000,
      retry_policy: { max_attempts: 2, backoff_strategy: 'linear' },
      depends_on: ['entity-canonicalisation'],
      is_critical: true
    },
    {
      step_id: 'product-technology-analysis',
      step_name: 'Product & Technology Analysis',
      engine_name: 'product-ip-engine',
      input_requirements: ['canonical_entities', 'product_data'],
      output_schema: { product_analysis: 'object' },
      execution_timeout: 50000,
      retry_policy: { max_attempts: 2, backoff_strategy: 'linear' },
      depends_on: ['entity-canonicalisation'],
      is_critical: false
    },
    {
      step_id: 'traction-analysis',
      step_name: 'Business Traction Analysis',
      engine_name: 'traction-analysis-engine',
      input_requirements: ['canonical_entities', 'growth_metrics'],
      output_schema: { traction_analysis: 'object' },
      execution_timeout: 40000,
      retry_policy: { max_attempts: 3, backoff_strategy: 'exponential' },
      depends_on: ['entity-canonicalisation'],
      is_critical: false
    },
    {
      step_id: 'financial-health-analysis',
      step_name: 'Financial Health Analysis',
      engine_name: 'financial-engine',
      input_requirements: ['canonical_entities', 'financial_data'],
      output_schema: { financial_analysis: 'object' },
      execution_timeout: 55000,
      retry_policy: { max_attempts: 2, backoff_strategy: 'linear' },
      depends_on: ['entity-canonicalisation'],
      is_critical: false
    },
    {
      step_id: 'strategic-fit-analysis',
      step_name: 'Strategic Fit Analysis',
      engine_name: 'thesis-alignment-engine',
      input_requirements: ['all_previous_outputs', 'fund_strategy'],
      output_schema: { strategic_analysis: 'object' },
      execution_timeout: 35000,
      retry_policy: { max_attempts: 3, backoff_strategy: 'exponential' },
      depends_on: ['team-leadership-analysis', 'market-opportunity-analysis', 'product-technology-analysis', 'traction-analysis', 'financial-health-analysis'],
      is_critical: true
    }
  ],
  execution_order: [
    'entity-canonicalisation',
    'team-leadership-analysis',
    'market-opportunity-analysis', 
    'product-technology-analysis',
    'traction-analysis',
    'financial-health-analysis',
    'strategic-fit-analysis'
  ],
  parallel_execution_groups: [
    ['team-leadership-analysis', 'market-opportunity-analysis', 'product-technology-analysis', 'traction-analysis', 'financial-health-analysis']
  ],
  fallback_strategies: {
    'team-research-engine': 'use-cached-data',
    'product-ip-engine': 'degraded-analysis',
    'traction-analysis-engine': 'basic-metrics-only'
  }
};

export const PE_DEAL_ANALYSIS_WORKFLOW: WorkflowDefinition = {
  workflow_id: 'pe-deal-analysis-v2',
  workflow_name: 'PE Deal Analysis v2',
  fund_type: 'private_equity',
  description: 'Comprehensive PE deal analysis using Blueprint v2',
  steps: [
    {
      step_id: 'entity-canonicalisation',
      step_name: 'Entity Canonicalisation',
      engine_name: 'market-research-engine',
      input_requirements: ['deal_id', 'company_name'],
      output_schema: { canonical_entities: 'object' },
      execution_timeout: 30000,
      retry_policy: { max_attempts: 3, backoff_strategy: 'exponential' },
      is_critical: true
    },
    {
      step_id: 'financial-performance-analysis',
      step_name: 'Financial Performance Analysis',
      engine_name: 'financial-engine',
      input_requirements: ['canonical_entities', 'financial_statements'],
      output_schema: { financial_performance: 'object' },
      execution_timeout: 60000,
      retry_policy: { max_attempts: 2, backoff_strategy: 'linear' },
      depends_on: ['entity-canonicalisation'],
      is_critical: true
    },
    {
      step_id: 'market-dynamics-analysis',
      step_name: 'Market Dynamics Analysis',
      engine_name: 'market-dynamics-engine',
      input_requirements: ['canonical_entities', 'market_data'],
      output_schema: { market_dynamics: 'object' },
      execution_timeout: 50000,
      retry_policy: { max_attempts: 2, backoff_strategy: 'linear' },
      depends_on: ['entity-canonicalisation'],
      is_critical: false
    },
    {
      step_id: 'competitive-positioning-analysis',
      step_name: 'Competitive Positioning Analysis',
      engine_name: 'competitive-positioning-engine',
      input_requirements: ['canonical_entities', 'competitive_landscape'],
      output_schema: { competitive_positioning: 'object' },
      execution_timeout: 55000,
      retry_policy: { max_attempts: 3, backoff_strategy: 'exponential' },
      depends_on: ['entity-canonicalisation'],
      is_critical: false
    },
    {
      step_id: 'management-succession-analysis',
      step_name: 'Management & Succession Analysis',
      engine_name: 'succession-planning-engine',
      input_requirements: ['canonical_entities', 'management_team'],
      output_schema: { management_succession: 'object' },
      execution_timeout: 45000,
      retry_policy: { max_attempts: 3, backoff_strategy: 'exponential' },
      depends_on: ['entity-canonicalisation'],
      is_critical: false
    },
    {
      step_id: 'operational-levers-analysis',
      step_name: 'Operational Levers Analysis',
      engine_name: 'operations-analysis-engine',
      input_requirements: ['financial_performance', 'operational_data'],
      output_schema: { operational_levers: 'object' },
      execution_timeout: 60000,
      retry_policy: { max_attempts: 2, backoff_strategy: 'linear' },
      depends_on: ['financial-performance-analysis'],
      is_critical: false
    },
    {
      step_id: 'deal-structure-analysis',
      step_name: 'Deal Structure Analysis',
      engine_name: 'deal-structure-engine',
      input_requirements: ['canonical_entities', 'transaction_terms'],
      output_schema: { deal_structure: 'object' },
      execution_timeout: 40000,
      retry_policy: { max_attempts: 2, backoff_strategy: 'linear' },
      depends_on: ['entity-canonicalisation'],
      is_critical: false
    },
    {
      step_id: 'exit-path-timing-analysis',
      step_name: 'Exit Path & Timing Analysis',
      engine_name: 'exit-strategy-engine',
      input_requirements: ['financial_performance', 'market_dynamics'],
      output_schema: { exit_analysis: 'object' },
      execution_timeout: 50000,
      retry_policy: { max_attempts: 2, backoff_strategy: 'linear' },
      depends_on: ['financial-performance-analysis', 'market-dynamics-analysis'],
      is_critical: false
    },
    {
      step_id: 'risk-profile-analysis',
      step_name: 'Risk Profile Analysis',
      engine_name: 'risk-analysis-engine',
      input_requirements: ['all_previous_outputs'],
      output_schema: { risk_profile: 'object' },
      execution_timeout: 45000,
      retry_policy: { max_attempts: 3, backoff_strategy: 'exponential' },
      depends_on: ['financial-performance-analysis', 'market-dynamics-analysis', 'competitive-positioning-analysis'],
      is_critical: false
    },
    {
      step_id: 'data-availability-analysis',
      step_name: 'Data Availability Analysis',
      engine_name: 'data-availability-engine',
      input_requirements: ['all_previous_outputs'],
      output_schema: { data_availability: 'object' },
      execution_timeout: 30000,
      retry_policy: { max_attempts: 2, backoff_strategy: 'linear' },
      depends_on: ['entity-canonicalisation'],
      is_critical: false
    },
    {
      step_id: 'strategic-fit-analysis',
      step_name: 'Strategic Fit Analysis',
      engine_name: 'thesis-alignment-engine',
      input_requirements: ['all_previous_outputs', 'fund_strategy'],
      output_schema: { strategic_analysis: 'object' },
      execution_timeout: 35000,
      retry_policy: { max_attempts: 3, backoff_strategy: 'exponential' },
      depends_on: ['financial-performance-analysis', 'market-dynamics-analysis', 'competitive-positioning-analysis', 'management-succession-analysis', 'operational-levers-analysis', 'deal-structure-analysis', 'exit-path-timing-analysis', 'risk-profile-analysis', 'data-availability-analysis'],
      is_critical: true
    }
  ],
  execution_order: [
    'entity-canonicalisation',
    'financial-performance-analysis',
    'market-dynamics-analysis',
    'competitive-positioning-analysis',
    'management-succession-analysis',
    'operational-levers-analysis',
    'deal-structure-analysis',
    'exit-path-timing-analysis',
    'risk-profile-analysis',
    'data-availability-analysis',
    'strategic-fit-analysis'
  ],
  parallel_execution_groups: [
    ['market-dynamics-analysis', 'competitive-positioning-analysis', 'management-succession-analysis', 'deal-structure-analysis', 'data-availability-analysis'],
    ['operational-levers-analysis', 'exit-path-timing-analysis', 'risk-profile-analysis']
  ],
  fallback_strategies: {
    'market-dynamics-engine': 'basic-market-analysis',
    'competitive-positioning-engine': 'simplified-competitive-analysis',
    'succession-planning-engine': 'basic-management-assessment',
    'operations-analysis-engine': 'basic-operational-metrics',
    'deal-structure-engine': 'standard-structure-analysis',
    'exit-strategy-engine': 'basic-exit-assessment',
    'risk-analysis-engine': 'simplified-risk-model',
    'data-availability-engine': 'basic-data-assessment'
  }
};

// Blueprint Engine Mapping
export const BLUEPRINT_ENGINE_MAPPING: Record<AnalysisEngine, string[]> = {
  'market-research-engine': [
    'market-size-tam', 'market-growth-rate', 'competitive-landscape', 
    'market-timing', 'customer-validation', 'market-share', 'competitive-advantage',
    'brand-strength', 'customer-relationships', 'pricing-power'
  ],
  'team-research-engine': [
    'founder-market-fit', 'team-composition', 'leadership-experience',
    'advisory-board', 'hiring-capability', 'leadership-capability',
    'track-record', 'strategic-vision', 'execution-ability', 'cultural-fit'
  ],
  'product-ip-engine': [
    'product-market-fit', 'technology-differentiation', 'scalability-architecture',
    'ip-protection', 'development-roadmap'
  ],
  'financial-engine': [
    'burn-rate', 'runway', 'funding-efficiency', 'financial-projections',
    'revenue-quality', 'profitability-analysis', 'cash-flow-generation',
    'capital-efficiency', 'financial-stability'
  ],
  'thesis-alignment-engine': [
    'fund-thesis-alignment', 'portfolio-synergies', 'investment-size-fit',
    'exit-potential', 'fund-strategy-alignment', 'risk-return-profile',
    'exit-readiness', 'value-creation-plan'
  ],
  'traction-analysis-engine': [
    'revenue-model', 'customer-acquisition', 'unit-economics',
    'growth-metrics', 'retention-rates'
  ],
  'governance-analysis-engine': [
    'governance-structure', 'compliance-metrics', 'risk-management'
  ],
  'operations-analysis-engine': [
    'management-team-strength', 'operational-efficiency', 'technology-systems',
    'process-optimization', 'cost-management'
  ],
  'value-creation-engine': [
    'organic-growth', 'acquisition-opportunities', 'new-market-expansion',
    'product-extension', 'operational-leverage'
  ],
  'risk-analysis-engine': [
    'risk-assessment', 'mitigation-strategies', 'scenario-analysis'
  ],
  'exit-strategy-engine': [
    'exit-timeline', 'valuation-multiples', 'strategic-buyers'
  ],
  'deal-structure-engine': [
    'transaction-structure', 'governance-terms', 'liquidation-preferences',
    'board-composition', 'investor-rights'
  ],
  'data-availability-engine': [
    'data-completeness', 'information-quality', 'due-diligence-gaps',
    'management-reporting', 'financial-transparency'
  ],
  'market-dynamics-engine': [
    'market-trends', 'industry-cycles', 'regulatory-environment',
    'economic-factors', 'disruption-risks'
  ],
  'competitive-positioning-engine': [
    'competitive-moats', 'market-differentiation', 'switching-costs',
    'network-effects', 'scale-advantages'
  ],
  'succession-planning-engine': [
    'leadership-bench', 'key-person-risk', 'management-transition',
    'knowledge-transfer', 'retention-strategies'
  ]
};