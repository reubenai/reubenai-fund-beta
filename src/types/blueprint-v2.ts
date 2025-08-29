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
  | 'exit-strategy-engine';

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
    category_name: 'Business Model & Traction',
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
    weight: 25,
    subcategories: [
      'revenue-quality',
      'profitability-analysis', 
      'cash-flow-generation',
      'capital-efficiency',
      'financial-stability'
    ]
  },
  OPERATIONAL_EXCELLENCE: {
    category_id: 'operational-excellence', 
    category_name: 'Operational Excellence',
    weight: 20,
    subcategories: [
      'management-team-strength',
      'operational-efficiency',
      'technology-systems',
      'process-optimization',
      'cost-management'
    ]
  },
  MARKET_POSITION: {
    category_id: 'market-position',
    category_name: 'Market Position',
    weight: 20,
    subcategories: [
      'market-share',
      'competitive-advantage', 
      'brand-strength',
      'customer-relationships',
      'pricing-power'
    ]
  },
  MANAGEMENT_QUALITY: {
    category_id: 'management-quality',
    category_name: 'Management Quality', 
    weight: 15,
    subcategories: [
      'leadership-capability',
      'track-record',
      'strategic-vision',
      'execution-ability',
      'cultural-fit'
    ]
  },
  GROWTH_POTENTIAL: {
    category_id: 'growth-potential',
    category_name: 'Growth Potential',
    weight: 10,
    subcategories: [
      'organic-growth',
      'acquisition-opportunities',
      'new-market-expansion',
      'product-extension',
      'operational-leverage'
    ]
  },
  STRATEGIC_FIT: {
    category_id: 'strategic-fit',
    category_name: 'Strategic Fit',
    weight: 10,
    subcategories: [
      'fund-strategy-alignment',
      'portfolio-synergies', 
      'risk-return-profile',
      'exit-readiness',
      'value-creation-plan'
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
      step_id: 'operational-excellence-analysis',
      step_name: 'Operational Excellence Analysis',
      engine_name: 'operations-analysis-engine',
      input_requirements: ['canonical_entities', 'operational_data'],
      output_schema: { operational_analysis: 'object' },
      execution_timeout: 50000,
      retry_policy: { max_attempts: 2, backoff_strategy: 'linear' },
      depends_on: ['entity-canonicalisation'],
      is_critical: false
    },
    {
      step_id: 'market-position-analysis',
      step_name: 'Market Position Analysis',
      engine_name: 'market-research-engine',
      input_requirements: ['canonical_entities', 'competitive_landscape'],
      output_schema: { market_position: 'object' },
      execution_timeout: 55000,
      retry_policy: { max_attempts: 3, backoff_strategy: 'exponential' },
      depends_on: ['entity-canonicalisation'],
      is_critical: false
    },
    {
      step_id: 'management-quality-analysis',
      step_name: 'Management Quality Analysis',
      engine_name: 'team-research-engine',
      input_requirements: ['canonical_entities', 'management_team'],
      output_schema: { management_analysis: 'object' },
      execution_timeout: 45000,
      retry_policy: { max_attempts: 3, backoff_strategy: 'exponential' },
      depends_on: ['entity-canonicalisation'],
      is_critical: false
    },
    {
      step_id: 'growth-potential-analysis',
      step_name: 'Growth Potential Analysis',
      engine_name: 'value-creation-engine',
      input_requirements: ['financial_performance', 'operational_analysis'],
      output_schema: { growth_analysis: 'object' },
      execution_timeout: 60000,
      retry_policy: { max_attempts: 2, backoff_strategy: 'linear' },
      depends_on: ['financial-performance-analysis', 'operational-excellence-analysis'],
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
      depends_on: ['financial-performance-analysis', 'operational-excellence-analysis', 'market-position-analysis', 'management-quality-analysis', 'growth-potential-analysis'],
      is_critical: true
    }
  ],
  execution_order: [
    'entity-canonicalisation',
    'financial-performance-analysis',
    'operational-excellence-analysis',
    'market-position-analysis',
    'management-quality-analysis',
    'growth-potential-analysis',
    'strategic-fit-analysis'
  ],
  parallel_execution_groups: [
    ['operational-excellence-analysis', 'market-position-analysis', 'management-quality-analysis']
  ],
  fallback_strategies: {
    'operations-analysis-engine': 'basic-operational-metrics',
    'team-research-engine': 'use-cached-data',
    'value-creation-engine': 'simplified-growth-model'
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
  ]
};