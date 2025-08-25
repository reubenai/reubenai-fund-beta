// VC Deal Analysis Blueprint - Phase 1
// Systematic definition of Steps 1-3 for all 21 VC subcategories
// This blueprint decouples analysis design from AI execution

// ========================================
// CORE BLUEPRINT TYPES
// ========================================

export interface DataSource {
  source_type: 'company_data' | 'market_research' | 'financial_data' | 'team_research' | 'product_data' | 'competitive_intel' | 'external_api' | 'document_parsing';
  source_name: string;
  data_points: string[];
  reliability_score: number; // 1-10
  freshness_requirement: 'real_time' | 'daily' | 'weekly' | 'monthly' | 'historical';
  fallback_sources?: string[];
}

export interface AnalysisOutput {
  subcategory_id: string;
  score: number; // 0-100
  confidence: number; // 0-100
  reasoning: string;
  data_points: Record<string, any>;
  sources_used: string[];
  insights: string[];
  risk_flags: string[];
  recommendations: string[];
  last_updated: string;
}

export interface UIComponentMapping {
  component_name: string;
  data_binding: string;
  display_format: 'score_card' | 'detail_section' | 'chart' | 'list' | 'badge' | 'progress_bar';
  fallback_display: any;
  required_fields: string[];
}

export interface SubcategoryBlueprint {
  subcategory_id: string;
  subcategory_name: string;
  category: string;
  weight: number;
  step_1_data_sourcing: DataSource[];
  step_2_analysis_output: AnalysisOutput;
  step_3_ui_mapping: UIComponentMapping[];
  responsible_engines: string[];
  dependencies: string[];
}

// ========================================
// VC SUBCATEGORY BLUEPRINTS
// ========================================

export const VC_SUBCATEGORY_BLUEPRINTS: SubcategoryBlueprint[] = [
  
  // ========================================
  // TEAM & LEADERSHIP CATEGORY
  // ========================================
  
  {
    subcategory_id: 'founder-market-fit',
    subcategory_name: 'Founder-Market Fit',
    category: 'Team & Leadership',
    weight: 30,
    step_1_data_sourcing: [
      {
        source_type: 'team_research',
        source_name: 'LinkedIn Professional Profiles',
        data_points: ['previous_roles', 'education', 'industry_experience', 'company_history'],
        reliability_score: 9,
        freshness_requirement: 'monthly',
        fallback_sources: ['company_about_page', 'crunchbase_team_data']
      },
      {
        source_type: 'market_research',
        source_name: 'Industry Domain Analysis',
        data_points: ['market_requirements', 'industry_expertise_needed', 'domain_complexity'],
        reliability_score: 8,
        freshness_requirement: 'weekly'
      }
    ],
    step_2_analysis_output: {
      subcategory_id: 'founder-market-fit',
      score: 0,
      confidence: 0,
      reasoning: '',
      data_points: {
        founder_experience_years: 0,
        relevant_industry_background: false,
        previous_startup_experience: false,
        domain_expertise_match: 0,
        market_understanding_score: 0
      },
      sources_used: [],
      insights: [],
      risk_flags: [],
      recommendations: [],
      last_updated: ''
    },
    step_3_ui_mapping: [
      {
        component_name: 'TeamAnalysisCard',
        data_binding: 'enhanced_analysis.rubric_breakdown.team_leadership.founder_market_fit',
        display_format: 'score_card',
        fallback_display: { score: 0, confidence: 50, reasoning: 'Analysis pending' },
        required_fields: ['score', 'confidence', 'reasoning', 'data_points.domain_expertise_match']
      },
      {
        component_name: 'FounderProfileSection',
        data_binding: 'enhanced_analysis.team_research.founder_profiles',
        display_format: 'detail_section',
        fallback_display: { profiles: [], insights: ['Founder analysis pending'] },
        required_fields: ['founder_experience_years', 'relevant_industry_background']
      }
    ],
    responsible_engines: ['team-research-engine'],
    dependencies: ['company_basic_info', 'industry_classification']
  },

  {
    subcategory_id: 'previous-experience',
    subcategory_name: 'Previous Experience',
    category: 'Team & Leadership',
    weight: 25,
    step_1_data_sourcing: [
      {
        source_type: 'team_research',
        source_name: 'Career History Analysis',
        data_points: ['previous_companies', 'roles_progression', 'achievements', 'exits_and_outcomes'],
        reliability_score: 9,
        freshness_requirement: 'monthly'
      },
      {
        source_type: 'external_api',
        source_name: 'Crunchbase Team Data',
        data_points: ['previous_funding_rounds', 'exit_history', 'board_positions'],
        reliability_score: 8,
        freshness_requirement: 'weekly'
      }
    ],
    step_2_analysis_output: {
      subcategory_id: 'previous-experience',
      score: 0,
      confidence: 0,
      reasoning: '',
      data_points: {
        startup_experience_count: 0,
        successful_exits: 0,
        leadership_roles_count: 0,
        industry_tenure_years: 0,
        notable_achievements: []
      },
      sources_used: [],
      insights: [],
      risk_flags: [],
      recommendations: [],
      last_updated: ''
    },
    step_3_ui_mapping: [
      {
        component_name: 'ExperienceBreakdown',
        data_binding: 'enhanced_analysis.team_research.experience_analysis',
        display_format: 'detail_section',
        fallback_display: { experience_score: 0, achievements: [] },
        required_fields: ['startup_experience_count', 'successful_exits', 'leadership_roles_count']
      }
    ],
    responsible_engines: ['team-research-engine'],
    dependencies: ['founder-market-fit']
  },

  {
    subcategory_id: 'technical-expertise',
    subcategory_name: 'Technical Expertise',
    category: 'Team & Leadership',
    weight: 25,
    step_1_data_sourcing: [
      {
        source_type: 'team_research',
        source_name: 'Technical Background Analysis',
        data_points: ['technical_roles', 'engineering_education', 'patents', 'open_source_contributions'],
        reliability_score: 8,
        freshness_requirement: 'monthly'
      },
      {
        source_type: 'product_data',
        source_name: 'Technology Stack Analysis',
        data_points: ['tech_complexity', 'innovation_level', 'technical_moat'],
        reliability_score: 7,
        freshness_requirement: 'weekly'
      }
    ],
    step_2_analysis_output: {
      subcategory_id: 'technical-expertise',
      score: 0,
      confidence: 0,
      reasoning: '',
      data_points: {
        technical_team_strength: 0,
        relevant_tech_experience: false,
        patent_portfolio_size: 0,
        technical_innovation_score: 0,
        engineering_quality_indicators: []
      },
      sources_used: [],
      insights: [],
      risk_flags: [],
      recommendations: [],
      last_updated: ''
    },
    step_3_ui_mapping: [
      {
        component_name: 'TechnicalExpertiseCard',
        data_binding: 'enhanced_analysis.team_research.technical_analysis',
        display_format: 'score_card',
        fallback_display: { score: 0, technical_strength: 'Analysis pending' },
        required_fields: ['technical_team_strength', 'technical_innovation_score']
      }
    ],
    responsible_engines: ['team-research-engine', 'product-ip-engine'],
    dependencies: ['company_basic_info']
  },

  {
    subcategory_id: 'execution-track-record',
    subcategory_name: 'Execution Track Record',
    category: 'Team & Leadership',
    weight: 20,
    step_1_data_sourcing: [
      {
        source_type: 'company_data',
        source_name: 'Company Milestone History',
        data_points: ['funding_rounds', 'product_launches', 'partnerships', 'growth_milestones'],
        reliability_score: 9,
        freshness_requirement: 'weekly'
      },
      {
        source_type: 'team_research',
        source_name: 'Historical Performance Analysis',
        data_points: ['delivery_track_record', 'timeline_adherence', 'goal_achievement'],
        reliability_score: 7,
        freshness_requirement: 'monthly'
      }
    ],
    step_2_analysis_output: {
      subcategory_id: 'execution-track-record',
      score: 0,
      confidence: 0,
      reasoning: '',
      data_points: {
        milestone_achievement_rate: 0,
        funding_progression: [],
        product_delivery_score: 0,
        timeline_adherence_score: 0,
        execution_risk_factors: []
      },
      sources_used: [],
      insights: [],
      risk_flags: [],
      recommendations: [],
      last_updated: ''
    },
    step_3_ui_mapping: [
      {
        component_name: 'ExecutionTrackRecordCard',
        data_binding: 'enhanced_analysis.team_research.execution_analysis',
        display_format: 'score_card',
        fallback_display: { score: 0, milestones: [] },
        required_fields: ['milestone_achievement_rate', 'product_delivery_score']
      }
    ],
    responsible_engines: ['team-research-engine'],
    dependencies: ['company_basic_info', 'funding_history']
  },

  // ========================================
  // MARKET OPPORTUNITY CATEGORY  
  // ========================================

  {
    subcategory_id: 'market-size-tam',
    subcategory_name: 'Market Size (TAM)',
    category: 'Market Opportunity',
    weight: 25,
    step_1_data_sourcing: [
      {
        source_type: 'market_research',
        source_name: 'Industry Market Research Reports',
        data_points: ['tam_size', 'sam_size', 'som_size', 'growth_projections', 'market_segments', 'geographic_breakdown'],
        reliability_score: 9,
        freshness_requirement: 'monthly',
        fallback_sources: ['gartner_reports', 'idc_data', 'forrester_research']
      },
      {
        source_type: 'competitive_intel',
        source_name: 'Competitive Market Analysis',
        data_points: ['competitor_revenues', 'market_share_data', 'pricing_analysis', 'funding_data'],
        reliability_score: 8,
        freshness_requirement: 'weekly',
        fallback_sources: ['crunchbase_market_data', 'pitchbook_analysis']
      },
      {
        source_type: 'external_api',
        source_name: 'Regional Market Intelligence',
        data_points: ['regional_market_size', 'local_penetration_rates', 'geographic_opportunities', 'regulatory_factors'],
        reliability_score: 8,
        freshness_requirement: 'monthly'
      }
    ],
    step_2_analysis_output: {
      subcategory_id: 'market-size-tam',
      score: 0,
      confidence: 0,
      reasoning: '',
      data_points: {
        tam_value_usd: 0,
        sam_value_usd: 0,
        som_value_usd: 0,
        cagr_projection: 0,
        addressable_market_score: 0,
        regional_analysis: {
          region_name: '',
          market_size_usd: 0,
          growth_rate: 0,
          vs_global_comparison: '',
          regional_drivers: [],
          market_maturity_stage: '',
          fund_geography_alignment: 0
        },
        local_analysis: {
          country_name: '',
          market_size_usd: 0,
          local_growth_rate: 0,
          penetration_opportunities: [],
          regulatory_environment: [],
          competitive_dynamics: [],
          market_barriers: []
        },
        market_sizing_methodology: '',
        data_quality_assessment: 0
      },
      sources_used: [],
      insights: [],
      risk_flags: [],
      recommendations: [],
      last_updated: ''
    },
    step_3_ui_mapping: [
      {
        component_name: 'EnhancedMarketSizing',
        data_binding: 'enhanced_analysis.market_intelligence.market_sizing',
        display_format: 'chart',
        fallback_display: { tam: '$0B', sam: '$0B', som: '$0M', cagr: 0 },
        required_fields: ['tam_value_usd', 'sam_value_usd', 'som_value_usd', 'cagr_projection']
      },
      {
        component_name: 'RegionalMarketBreakdown',
        data_binding: 'enhanced_analysis.market_intelligence.regional_analysis',
        display_format: 'detail_section',
        fallback_display: { region: 'Unknown', analysis: 'Pending' },
        required_fields: ['regional_analysis.region_name', 'regional_analysis.market_size_usd', 'regional_analysis.growth_rate']
      },
      {
        component_name: 'LocalMarketInsights',
        data_binding: 'enhanced_analysis.market_intelligence.local_analysis',
        display_format: 'detail_section',
        fallback_display: { country: 'Unknown', opportunities: [] },
        required_fields: ['local_analysis.country_name', 'local_analysis.penetration_opportunities']
      }
    ],
    responsible_engines: ['market-intelligence-engine'],
    dependencies: ['company_basic_info', 'industry_classification']
  },

  {
    subcategory_id: 'market-growth-rate',
    subcategory_name: 'Market Growth Rate',
    category: 'Market Opportunity',
    weight: 20,
    step_1_data_sourcing: [
      {
        source_type: 'market_research',
        source_name: 'Historical Market Growth Data',
        data_points: ['historical_growth_rates', 'growth_drivers', 'market_cycles', 'seasonal_patterns'],
        reliability_score: 9,
        freshness_requirement: 'monthly',
        fallback_sources: ['statista_data', 'industry_association_reports']
      },
      {
        source_type: 'external_api',
        source_name: 'Economic Growth Indicators',
        data_points: ['gdp_correlation', 'macroeconomic_factors', 'industry_multipliers'],
        reliability_score: 8,
        freshness_requirement: 'weekly'
      },
      {
        source_type: 'competitive_intel',
        source_name: 'Competitor Growth Analysis',
        data_points: ['competitor_growth_rates', 'market_expansion_data', 'segment_growth_variance'],
        reliability_score: 7,
        freshness_requirement: 'monthly'
      }
    ],
    step_2_analysis_output: {
      subcategory_id: 'market-growth-rate',
      score: 0,
      confidence: 0,
      reasoning: '',
      data_points: {
        current_growth_rate: 0,
        projected_5yr_cagr: 0,
        growth_acceleration_trend: '',
        growth_drivers: [],
        growth_headwinds: [],
        market_maturity_stage: '',
        growth_sustainability_score: 0,
        regional_growth_variance: {},
        cyclical_growth_patterns: [],
        growth_catalyst_timeline: []
      },
      sources_used: [],
      insights: [],
      risk_flags: [],
      recommendations: [],
      last_updated: ''
    },
    step_3_ui_mapping: [
      {
        component_name: 'MarketGrowthTrendChart',
        data_binding: 'enhanced_analysis.market_intelligence.growth_analysis',
        display_format: 'chart',
        fallback_display: { current_rate: 0, projected_cagr: 0 },
        required_fields: ['current_growth_rate', 'projected_5yr_cagr', 'growth_drivers']
      },
      {
        component_name: 'GrowthDriversAnalysis',
        data_binding: 'enhanced_analysis.market_intelligence.growth_factors',
        display_format: 'detail_section',
        fallback_display: { drivers: [], headwinds: [] },
        required_fields: ['growth_drivers', 'growth_headwinds', 'growth_sustainability_score']
      }
    ],
    responsible_engines: ['market-intelligence-engine'],
    dependencies: ['market-size-tam', 'industry_classification']
  },

  {
    subcategory_id: 'market-timing',
    subcategory_name: 'Market Timing',
    category: 'Market Opportunity',
    weight: 15,
    step_1_data_sourcing: [
      {
        source_type: 'market_research',
        source_name: 'Market Maturity Analysis',
        data_points: ['adoption_curves', 'technology_readiness', 'customer_awareness', 'regulatory_timeline'],
        reliability_score: 8,
        freshness_requirement: 'weekly',
        fallback_sources: ['gartner_hype_cycle', 'technology_adoption_studies']
      },
      {
        source_type: 'external_api',
        source_name: 'Trend Intelligence',
        data_points: ['search_trends', 'social_sentiment', 'media_coverage', 'investor_interest'],
        reliability_score: 7,
        freshness_requirement: 'daily'
      },
      {
        source_type: 'competitive_intel',
        source_name: 'Competitive Entry Analysis',
        data_points: ['new_entrants', 'market_consolidation', 'funding_activity', 'strategic_moves'],
        reliability_score: 8,
        freshness_requirement: 'weekly'
      }
    ],
    step_2_analysis_output: {
      subcategory_id: 'market-timing',
      score: 0,
      confidence: 0,
      reasoning: '',
      data_points: {
        market_timing_score: 0,
        adoption_stage: '',
        technology_readiness_level: 0,
        customer_readiness_indicators: [],
        regulatory_environment_readiness: 0,
        competitive_window_assessment: '',
        market_catalysts: [],
        timing_risk_factors: [],
        optimal_entry_timeline: '',
        market_momentum_score: 0
      },
      sources_used: [],
      insights: [],
      risk_flags: [],
      recommendations: [],
      last_updated: ''
    },
    step_3_ui_mapping: [
      {
        component_name: 'MarketTimingScoreCard',
        data_binding: 'enhanced_analysis.market_intelligence.timing_analysis',
        display_format: 'score_card',
        fallback_display: { timing_score: 0, stage: 'Unknown' },
        required_fields: ['market_timing_score', 'adoption_stage', 'competitive_window_assessment']
      },
      {
        component_name: 'MarketReadinessIndicators',
        data_binding: 'enhanced_analysis.market_intelligence.readiness_factors',
        display_format: 'detail_section',
        fallback_display: { readiness: [], catalysts: [] },
        required_fields: ['customer_readiness_indicators', 'market_catalysts', 'timing_risk_factors']
      }
    ],
    responsible_engines: ['market-intelligence-engine'],
    dependencies: ['market-growth-rate', 'competitive-landscape']
  },

  {
    subcategory_id: 'competitive-landscape',
    subcategory_name: 'Competitive Landscape',
    category: 'Market Opportunity',
    weight: 20,
    step_1_data_sourcing: [
      {
        source_type: 'competitive_intel',
        source_name: 'Direct Competitor Analysis',
        data_points: ['competitor_list', 'market_positions', 'funding_rounds', 'product_offerings', 'pricing_strategies'],
        reliability_score: 9,
        freshness_requirement: 'weekly',
        fallback_sources: ['crunchbase_competitive_data', 'similarweb_traffic']
      },
      {
        source_type: 'market_research',
        source_name: 'Competitive Dynamics Research',
        data_points: ['market_concentration', 'barriers_to_entry', 'switching_costs', 'competitive_moats'],
        reliability_score: 8,
        freshness_requirement: 'monthly'
      },
      {
        source_type: 'external_api',
        source_name: 'Competitive Intelligence APIs',
        data_points: ['web_traffic_data', 'app_rankings', 'patent_filings', 'hiring_patterns'],
        reliability_score: 7,
        freshness_requirement: 'weekly'
      }
    ],
    step_2_analysis_output: {
      subcategory_id: 'competitive-landscape',
      score: 0,
      confidence: 0,
      reasoning: '',
      data_points: {
        competitive_intensity_score: 0,
        market_concentration_ratio: 0,
        direct_competitors: [],
        indirect_competitors: [],
        competitive_positioning: '',
        barriers_to_entry_score: 0,
        competitive_advantages: [],
        competitive_threats: [],
        market_share_opportunity: 0,
        competitive_response_likelihood: 0
      },
      sources_used: [],
      insights: [],
      risk_flags: [],
      recommendations: [],
      last_updated: ''
    },
    step_3_ui_mapping: [
      {
        component_name: 'CompetitiveLandscapeMap',
        data_binding: 'enhanced_analysis.market_intelligence.competitive_analysis',
        display_format: 'chart',
        fallback_display: { competitors: [], positioning: 'Unknown' },
        required_fields: ['direct_competitors', 'indirect_competitors', 'competitive_positioning']
      },
      {
        component_name: 'CompetitiveAdvantageAnalysis',
        data_binding: 'enhanced_analysis.market_intelligence.competitive_position',
        display_format: 'detail_section',
        fallback_display: { advantages: [], threats: [] },
        required_fields: ['competitive_advantages', 'competitive_threats', 'barriers_to_entry_score']
      }
    ],
    responsible_engines: ['market-intelligence-engine'],
    dependencies: ['market-size-tam', 'product-market-fit']
  },

  {
    subcategory_id: 'customer-acquisition',
    subcategory_name: 'Customer Acquisition',
    category: 'Market Opportunity',
    weight: 12,
    step_1_data_sourcing: [
      {
        source_type: 'market_research',
        source_name: 'Customer Acquisition Channel Analysis',
        data_points: ['acquisition_channels', 'channel_effectiveness', 'customer_journey_mapping', 'acquisition_costs'],
        reliability_score: 8,
        freshness_requirement: 'weekly',
        fallback_sources: ['marketing_benchmarks', 'industry_acquisition_data']
      },
      {
        source_type: 'competitive_intel',
        source_name: 'Competitor Acquisition Strategy',
        data_points: ['competitor_channels', 'marketing_spend', 'customer_acquisition_tactics'],
        reliability_score: 7,
        freshness_requirement: 'monthly'
      },
      {
        source_type: 'company_data',
        source_name: 'Current Acquisition Performance',
        data_points: ['cac_by_channel', 'conversion_rates', 'acquisition_funnel_metrics'],
        reliability_score: 9,
        freshness_requirement: 'daily'
      }
    ],
    step_2_analysis_output: {
      subcategory_id: 'customer-acquisition',
      score: 0,
      confidence: 0,
      reasoning: '',
      data_points: {
        acquisition_difficulty_score: 0,
        available_channels: [],
        channel_effectiveness_ranking: [],
        estimated_cac_by_channel: {},
        scalability_assessment: 0,
        acquisition_timeline_estimate: '',
        market_saturation_risk: 0,
        customer_acquisition_barriers: [],
        acquisition_strategy_viability: 0,
        channel_diversification_score: 0
      },
      sources_used: [],
      insights: [],
      risk_flags: [],
      recommendations: [],
      last_updated: ''
    },
    step_3_ui_mapping: [
      {
        component_name: 'CustomerAcquisitionChannels',
        data_binding: 'enhanced_analysis.market_intelligence.acquisition_analysis',
        display_format: 'chart',
        fallback_display: { channels: [], effectiveness: {} },
        required_fields: ['available_channels', 'channel_effectiveness_ranking', 'estimated_cac_by_channel']
      },
      {
        component_name: 'AcquisitionScalabilityCard',
        data_binding: 'enhanced_analysis.market_intelligence.acquisition_scalability',
        display_format: 'score_card',
        fallback_display: { scalability: 0, timeline: 'Unknown' },
        required_fields: ['scalability_assessment', 'acquisition_timeline_estimate', 'acquisition_strategy_viability']
      }
    ],
    responsible_engines: ['market-intelligence-engine', 'financial-engine'],
    dependencies: ['market-size-tam', 'competitive-landscape']
  },

  {
    subcategory_id: 'market-barriers-regulation',
    subcategory_name: 'Market Barriers & Regulation',
    category: 'Market Opportunity',
    weight: 8,
    step_1_data_sourcing: [
      {
        source_type: 'market_research',
        source_name: 'Regulatory Environment Analysis',
        data_points: ['regulatory_requirements', 'compliance_costs', 'regulatory_timeline', 'policy_changes'],
        reliability_score: 9,
        freshness_requirement: 'weekly',
        fallback_sources: ['government_databases', 'regulatory_news', 'legal_research']
      },
      {
        source_type: 'external_api',
        source_name: 'Regulatory Intelligence APIs',
        data_points: ['regulatory_updates', 'policy_sentiment', 'enforcement_patterns'],
        reliability_score: 8,
        freshness_requirement: 'daily'
      },
      {
        source_type: 'competitive_intel',
        source_name: 'Regulatory Competitor Analysis',
        data_points: ['competitor_compliance', 'regulatory_challenges', 'approval_timelines'],
        reliability_score: 7,
        freshness_requirement: 'monthly'
      }
    ],
    step_2_analysis_output: {
      subcategory_id: 'market-barriers-regulation',
      score: 0,
      confidence: 0,
      reasoning: '',
      data_points: {
        regulatory_complexity_score: 0,
        key_regulatory_barriers: [],
        compliance_cost_estimate: 0,
        regulatory_timeline_risk: 0,
        policy_change_likelihood: 0,
        regulatory_moat_potential: 0,
        market_entry_barriers: [],
        regulatory_competitive_advantage: 0,
        enforcement_risk_level: 0,
        regulatory_strategy_requirements: []
      },
      sources_used: [],
      insights: [],
      risk_flags: [],
      recommendations: [],
      last_updated: ''
    },
    step_3_ui_mapping: [
      {
        component_name: 'RegulatoryBarriersCard',
        data_binding: 'enhanced_analysis.market_intelligence.regulatory_analysis',
        display_format: 'score_card',
        fallback_display: { complexity: 0, barriers: [] },
        required_fields: ['regulatory_complexity_score', 'key_regulatory_barriers', 'compliance_cost_estimate']
      },
      {
        component_name: 'RegulatoryRiskAssessment',
        data_binding: 'enhanced_analysis.market_intelligence.regulatory_risks',
        display_format: 'detail_section',
        fallback_display: { risks: [], timeline: 'Unknown' },
        required_fields: ['regulatory_timeline_risk', 'policy_change_likelihood', 'enforcement_risk_level']
      }
    ],
    responsible_engines: ['market-intelligence-engine'],
    dependencies: ['market-timing', 'competitive-landscape']
  },

  // ========================================
  // PRODUCT & TECHNOLOGY CATEGORY
  // ========================================

  {
    subcategory_id: 'product-market-fit',
    subcategory_name: 'Product-Market Fit',
    category: 'Product & Technology',
    weight: 40,
    step_1_data_sourcing: [
      {
        source_type: 'company_data',
        source_name: 'Product Usage Analytics',
        data_points: ['user_engagement', 'retention_rates', 'feature_adoption', 'usage_patterns'],
        reliability_score: 9,
        freshness_requirement: 'daily',
        fallback_sources: ['customer_interviews', 'survey_data']
      },
      {
        source_type: 'market_research',
        source_name: 'Customer Validation Research',
        data_points: ['customer_feedback', 'nps_scores', 'churn_reasons', 'feature_requests'],
        reliability_score: 8,
        freshness_requirement: 'weekly'
      },
      {
        source_type: 'competitive_intel',
        source_name: 'Product Positioning Analysis',
        data_points: ['feature_comparison', 'pricing_positioning', 'customer_reviews'],
        reliability_score: 7,
        freshness_requirement: 'monthly'
      }
    ],
    step_2_analysis_output: {
      subcategory_id: 'product-market-fit',
      score: 0,
      confidence: 0,
      reasoning: '',
      data_points: {
        pmf_score: 0,
        customer_satisfaction_score: 0,
        product_usage_intensity: 0,
        retention_rate_benchmark: 0,
        customer_acquisition_organic_rate: 0,
        feature_adoption_rates: {},
        customer_pain_point_solution_fit: 0,
        market_demand_validation: 0,
        product_differentiation_score: 0,
        customer_willingness_to_pay: 0
      },
      sources_used: [],
      insights: [],
      risk_flags: [],
      recommendations: [],
      last_updated: ''
    },
    step_3_ui_mapping: [
      {
        component_name: 'ProductMarketFitScoreCard',
        data_binding: 'enhanced_analysis.product_analysis.pmf_analysis',
        display_format: 'score_card',
        fallback_display: { pmf_score: 0, satisfaction: 0 },
        required_fields: ['pmf_score', 'customer_satisfaction_score', 'retention_rate_benchmark']
      },
      {
        component_name: 'CustomerValidationMetrics',
        data_binding: 'enhanced_analysis.product_analysis.validation_metrics',
        display_format: 'detail_section',
        fallback_display: { metrics: {}, insights: [] },
        required_fields: ['product_usage_intensity', 'feature_adoption_rates', 'customer_pain_point_solution_fit']
      }
    ],
    responsible_engines: ['product-ip-engine', 'market-intelligence-engine'],
    dependencies: ['market-size-tam', 'customer-acquisition']
  },

  {
    subcategory_id: 'technology-moat',
    subcategory_name: 'Technology Moat',
    category: 'Product & Technology',
    weight: 35,
    step_1_data_sourcing: [
      {
        source_type: 'product_data',
        source_name: 'Technology Architecture Analysis',
        data_points: ['tech_stack', 'architectural_complexity', 'proprietary_algorithms', 'data_advantages'],
        reliability_score: 8,
        freshness_requirement: 'monthly',
        fallback_sources: ['patent_filings', 'technical_documentation']
      },
      {
        source_type: 'competitive_intel',
        source_name: 'Technology Competitive Analysis',
        data_points: ['competitor_tech_stack', 'technology_gaps', 'innovation_timeline'],
        reliability_score: 7,
        freshness_requirement: 'monthly'
      },
      {
        source_type: 'external_api',
        source_name: 'Patent and IP Intelligence',
        data_points: ['patent_portfolio', 'ip_landscape', 'technology_trends'],
        reliability_score: 8,
        freshness_requirement: 'weekly'
      }
    ],
    step_2_analysis_output: {
      subcategory_id: 'technology-moat',
      score: 0,
      confidence: 0,
      reasoning: '',
      data_points: {
        technology_moat_strength: 0,
        proprietary_technology_score: 0,
        patent_protection_level: 0,
        data_network_effects: 0,
        technology_complexity_barrier: 0,
        innovation_velocity: 0,
        technology_defensibility: 0,
        competitive_technology_gap: 0,
        technology_switching_costs: 0,
        ip_portfolio_strength: 0
      },
      sources_used: [],
      insights: [],
      risk_flags: [],
      recommendations: [],
      last_updated: ''
    },
    step_3_ui_mapping: [
      {
        component_name: 'TechnologyMoatCard',
        data_binding: 'enhanced_analysis.product_analysis.tech_moat',
        display_format: 'score_card',
        fallback_display: { moat_strength: 0, defensibility: 0 },
        required_fields: ['technology_moat_strength', 'proprietary_technology_score', 'technology_defensibility']
      },
      {
        component_name: 'IPPortfolioAnalysis',
        data_binding: 'enhanced_analysis.product_analysis.ip_analysis',
        display_format: 'detail_section',
        fallback_display: { patents: 0, protection: 0 },
        required_fields: ['patent_protection_level', 'ip_portfolio_strength', 'competitive_technology_gap']
      }
    ],
    responsible_engines: ['product-ip-engine'],
    dependencies: ['technical-expertise', 'competitive-landscape']
  },

  {
    subcategory_id: 'scalability',
    subcategory_name: 'Scalability',
    category: 'Product & Technology',
    weight: 25,
    step_1_data_sourcing: [
      {
        source_type: 'product_data',
        source_name: 'Technical Scalability Assessment',
        data_points: ['architecture_scalability', 'performance_metrics', 'infrastructure_capacity', 'bottleneck_analysis'],
        reliability_score: 8,
        freshness_requirement: 'weekly',
        fallback_sources: ['technical_interviews', 'system_documentation']
      },
      {
        source_type: 'company_data',
        source_name: 'Operational Scalability Data',
        data_points: ['user_growth_handling', 'transaction_volume_capacity', 'cost_scaling_patterns'],
        reliability_score: 9,
        freshness_requirement: 'daily'
      },
      {
        source_type: 'market_research',
        source_name: 'Market Scalability Requirements',
        data_points: ['market_size_requirements', 'geographic_expansion_needs', 'scale_benchmarks'],
        reliability_score: 7,
        freshness_requirement: 'monthly'
      }
    ],
    step_2_analysis_output: {
      subcategory_id: 'scalability',
      score: 0,
      confidence: 0,
      reasoning: '',
      data_points: {
        technical_scalability_score: 0,
        operational_scalability_score: 0,
        market_scalability_score: 0,
        infrastructure_readiness: 0,
        scalability_bottlenecks: [],
        scale_cost_efficiency: 0,
        geographic_scalability: 0,
        team_scalability_readiness: 0,
        technology_scale_limitations: [],
        scalability_investment_requirements: 0
      },
      sources_used: [],
      insights: [],
      risk_flags: [],
      recommendations: [],
      last_updated: ''
    },
    step_3_ui_mapping: [
      {
        component_name: 'ScalabilityScoreCard',
        data_binding: 'enhanced_analysis.product_analysis.scalability_analysis',
        display_format: 'score_card',
        fallback_display: { technical: 0, operational: 0, market: 0 },
        required_fields: ['technical_scalability_score', 'operational_scalability_score', 'market_scalability_score']
      },
      {
        component_name: 'ScalabilityBottlenecks',
        data_binding: 'enhanced_analysis.product_analysis.scalability_constraints',
        display_format: 'detail_section',
        fallback_display: { bottlenecks: [], investment: 0 },
        required_fields: ['scalability_bottlenecks', 'technology_scale_limitations', 'scalability_investment_requirements']
      }
    ],
    responsible_engines: ['product-ip-engine', 'financial-engine'],
    dependencies: ['technology-moat', 'market-size-tam']
  },

  // ========================================
  // BUSINESS MODEL & TRACTION CATEGORY
  // ========================================

  {
    subcategory_id: 'revenue-model',
    subcategory_name: 'Revenue Model',
    category: 'Business Model & Traction',
    weight: 60,
    step_1_data_sourcing: [
      {
        source_type: 'financial_data',
        source_name: 'Revenue Structure Analysis',
        data_points: ['revenue_streams', 'pricing_model', 'revenue_mix', 'monetization_strategy'],
        reliability_score: 9,
        freshness_requirement: 'daily',
        fallback_sources: ['company_presentations', 'investor_materials']
      },
      {
        source_type: 'market_research',
        source_name: 'Revenue Model Benchmarking',
        data_points: ['industry_revenue_models', 'pricing_benchmarks', 'monetization_best_practices'],
        reliability_score: 8,
        freshness_requirement: 'monthly'
      },
      {
        source_type: 'competitive_intel',
        source_name: 'Competitor Revenue Analysis',
        data_points: ['competitor_pricing', 'revenue_model_comparison', 'monetization_strategies'],
        reliability_score: 7,
        freshness_requirement: 'weekly'
      }
    ],
    step_2_analysis_output: {
      subcategory_id: 'revenue-model',
      score: 0,
      confidence: 0,
      reasoning: '',
      data_points: {
        revenue_model_viability: 0,
        pricing_strategy_effectiveness: 0,
        revenue_diversification_score: 0,
        monetization_maturity: 0,
        revenue_predictability: 0,
        pricing_power_assessment: 0,
        revenue_model_scalability: 0,
        customer_lifetime_value_potential: 0,
        revenue_stream_sustainability: 0,
        competitive_pricing_position: 0
      },
      sources_used: [],
      insights: [],
      risk_flags: [],
      recommendations: [],
      last_updated: ''
    },
    step_3_ui_mapping: [
      {
        component_name: 'RevenueModelCard',
        data_binding: 'enhanced_analysis.business_model.revenue_analysis',
        display_format: 'score_card',
        fallback_display: { viability: 0, scalability: 0 },
        required_fields: ['revenue_model_viability', 'revenue_model_scalability', 'pricing_strategy_effectiveness']
      },
      {
        component_name: 'RevenueStreamBreakdown',
        data_binding: 'enhanced_analysis.business_model.revenue_streams',
        display_format: 'chart',
        fallback_display: { streams: [], diversification: 0 },
        required_fields: ['revenue_diversification_score', 'revenue_predictability', 'customer_lifetime_value_potential']
      }
    ],
    responsible_engines: ['financial-engine', 'market-intelligence-engine'],
    dependencies: ['product-market-fit', 'competitive-landscape']
  },

  {
    subcategory_id: 'customer-traction',
    subcategory_name: 'Customer Traction',
    category: 'Business Model & Traction',
    weight: 40,
    step_1_data_sourcing: [
      {
        source_type: 'company_data',
        source_name: 'Customer Growth Metrics',
        data_points: ['customer_count', 'customer_growth_rate', 'customer_segments', 'acquisition_metrics'],
        reliability_score: 9,
        freshness_requirement: 'daily',
        fallback_sources: ['public_announcements', 'press_releases']
      },
      {
        source_type: 'market_research',
        source_name: 'Traction Benchmarking',
        data_points: ['industry_traction_benchmarks', 'stage_appropriate_metrics', 'traction_quality_indicators'],
        reliability_score: 8,
        freshness_requirement: 'monthly'
      },
      {
        source_type: 'external_api',
        source_name: 'Customer Validation Signals',
        data_points: ['customer_testimonials', 'case_studies', 'reference_customers', 'customer_success_stories'],
        reliability_score: 7,
        freshness_requirement: 'weekly'
      }
    ],
    step_2_analysis_output: {
      subcategory_id: 'customer-traction',
      score: 0,
      confidence: 0,
      reasoning: '',
      data_points: {
        customer_traction_score: 0,
        customer_growth_momentum: 0,
        customer_quality_score: 0,
        traction_stage_appropriateness: 0,
        customer_concentration_risk: 0,
        customer_retention_strength: 0,
        customer_advocacy_level: 0,
        traction_acceleration_trend: 0,
        customer_expansion_potential: 0,
        traction_sustainability_score: 0
      },
      sources_used: [],
      insights: [],
      risk_flags: [],
      recommendations: [],
      last_updated: ''
    },
    step_3_ui_mapping: [
      {
        component_name: 'CustomerTractionCard',
        data_binding: 'enhanced_analysis.business_model.traction_analysis',
        display_format: 'score_card',
        fallback_display: { traction_score: 0, growth_momentum: 0 },
        required_fields: ['customer_traction_score', 'customer_growth_momentum', 'customer_quality_score']
      },
      {
        component_name: 'TractionMetricsChart',
        data_binding: 'enhanced_analysis.business_model.traction_metrics',
        display_format: 'chart',
        fallback_display: { metrics: {}, trend: 'flat' },
        required_fields: ['traction_stage_appropriateness', 'traction_acceleration_trend', 'customer_retention_strength']
      }
    ],
    responsible_engines: ['market-intelligence-engine', 'financial-engine'],
    dependencies: ['product-market-fit', 'customer-acquisition']
  },

  // ========================================
  // FINANCIAL HEALTH CATEGORY
  // ========================================

  {
    subcategory_id: 'revenue-growth',
    subcategory_name: 'Revenue Growth',
    category: 'Financial Health',
    weight: 25,
    step_1_data_sourcing: [
      {
        source_type: 'financial_data',
        source_name: 'Revenue Performance Data',
        data_points: ['historical_revenue', 'revenue_growth_rates', 'revenue_projections', 'seasonal_patterns'],
        reliability_score: 9,
        freshness_requirement: 'daily',
        fallback_sources: ['financial_statements', 'investor_updates']
      },
      {
        source_type: 'market_research',
        source_name: 'Growth Benchmarking',
        data_points: ['industry_growth_benchmarks', 'stage_appropriate_growth', 'growth_sustainability_factors'],
        reliability_score: 8,
        freshness_requirement: 'monthly'
      },
      {
        source_type: 'competitive_intel',
        source_name: 'Competitive Growth Analysis',
        data_points: ['competitor_growth_rates', 'market_share_trends', 'growth_strategy_comparison'],
        reliability_score: 7,
        freshness_requirement: 'weekly'
      }
    ],
    step_2_analysis_output: {
      subcategory_id: 'revenue-growth',
      score: 0,
      confidence: 0,
      reasoning: '',
      data_points: {
        revenue_growth_score: 0,
        growth_rate_consistency: 0,
        growth_quality_score: 0,
        growth_sustainability_assessment: 0,
        revenue_acceleration_trend: 0,
        growth_benchmark_comparison: 0,
        growth_driver_strength: 0,
        growth_headwind_impact: 0,
        projected_growth_trajectory: 0,
        growth_investment_efficiency: 0
      },
      sources_used: [],
      insights: [],
      risk_flags: [],
      recommendations: [],
      last_updated: ''
    },
    step_3_ui_mapping: [
      {
        component_name: 'RevenueGrowthCard',
        data_binding: 'enhanced_analysis.financial_health.revenue_growth',
        display_format: 'score_card',
        fallback_display: { growth_score: 0, trend: 'flat' },
        required_fields: ['revenue_growth_score', 'growth_rate_consistency', 'growth_quality_score']
      },
      {
        component_name: 'GrowthTrendChart',
        data_binding: 'enhanced_analysis.financial_health.growth_trends',
        display_format: 'chart',
        fallback_display: { historical: [], projected: [] },
        required_fields: ['revenue_acceleration_trend', 'projected_growth_trajectory', 'growth_benchmark_comparison']
      }
    ],
    responsible_engines: ['financial-engine'],
    dependencies: ['revenue-model', 'customer-traction']
  },

  {
    subcategory_id: 'unit-economics',
    subcategory_name: 'Unit Economics',
    category: 'Financial Health',
    weight: 20,
    step_1_data_sourcing: [
      {
        source_type: 'financial_data',
        source_name: 'Unit Economics Data',
        data_points: ['customer_acquisition_cost', 'lifetime_value', 'gross_margins', 'contribution_margins'],
        reliability_score: 9,
        freshness_requirement: 'daily',
        fallback_sources: ['management_presentations', 'board_reports']
      },
      {
        source_type: 'market_research',
        source_name: 'Unit Economics Benchmarks',
        data_points: ['industry_cac_benchmarks', 'ltv_benchmarks', 'margin_benchmarks'],
        reliability_score: 8,
        freshness_requirement: 'monthly'
      },
      {
        source_type: 'company_data',
        source_name: 'Operational Metrics',
        data_points: ['cohort_analysis', 'retention_curves', 'expansion_revenue', 'churn_analysis'],
        reliability_score: 9,
        freshness_requirement: 'weekly'
      }
    ],
    step_2_analysis_output: {
      subcategory_id: 'unit-economics',
      score: 0,
      confidence: 0,
      reasoning: '',
      data_points: {
        unit_economics_health_score: 0,
        ltv_cac_ratio: 0,
        gross_margin_strength: 0,
        contribution_margin_score: 0,
        payback_period_months: 0,
        unit_economics_improvement_trend: 0,
        cohort_performance_consistency: 0,
        unit_economics_scalability: 0,
        margin_expansion_potential: 0,
        unit_economics_benchmark_comparison: 0
      },
      sources_used: [],
      insights: [],
      risk_flags: [],
      recommendations: [],
      last_updated: ''
    },
    step_3_ui_mapping: [
      {
        component_name: 'UnitEconomicsCard',
        data_binding: 'enhanced_analysis.financial_health.unit_economics',
        display_format: 'score_card',
        fallback_display: { health_score: 0, ltv_cac: 0 },
        required_fields: ['unit_economics_health_score', 'ltv_cac_ratio', 'payback_period_months']
      },
      {
        component_name: 'CohortAnalysisChart',
        data_binding: 'enhanced_analysis.financial_health.cohort_data',
        display_format: 'chart',
        fallback_display: { cohorts: [], performance: 'stable' },
        required_fields: ['cohort_performance_consistency', 'margin_expansion_potential', 'unit_economics_scalability']
      }
    ],
    responsible_engines: ['financial-engine'],
    dependencies: ['customer-acquisition', 'revenue-model']
  },

  {
    subcategory_id: 'burn-rate-runway',
    subcategory_name: 'Burn Rate & Runway',
    category: 'Financial Health',
    weight: 20,
    step_1_data_sourcing: [
      {
        source_type: 'financial_data',
        source_name: 'Cash Flow Analysis',
        data_points: ['monthly_burn_rate', 'cash_balance', 'runway_months', 'cash_flow_projections'],
        reliability_score: 9,
        freshness_requirement: 'daily',
        fallback_sources: ['financial_statements', 'cash_flow_statements']
      },
      {
        source_type: 'company_data',
        source_name: 'Operational Burn Drivers',
        data_points: ['personnel_costs', 'marketing_spend', 'operational_expenses', 'capital_expenditures'],
        reliability_score: 8,
        freshness_requirement: 'weekly'
      },
      {
        source_type: 'market_research',
        source_name: 'Burn Rate Benchmarks',
        data_points: ['industry_burn_benchmarks', 'stage_appropriate_burn', 'efficiency_benchmarks'],
        reliability_score: 7,
        freshness_requirement: 'monthly'
      }
    ],
    step_2_analysis_output: {
      subcategory_id: 'burn-rate-runway',
      score: 0,
      confidence: 0,
      reasoning: '',
      data_points: {
        burn_efficiency_score: 0,
        runway_adequacy_score: 0,
        burn_rate_trend: 0,
        cash_management_quality: 0,
        funding_urgency_score: 0,
        burn_optimization_opportunities: 0,
        scenario_planning_robustness: 0,
        burn_milestone_alignment: 0,
        capital_allocation_efficiency: 0,
        burn_predictability_score: 0
      },
      sources_used: [],
      insights: [],
      risk_flags: [],
      recommendations: [],
      last_updated: ''
    },
    step_3_ui_mapping: [
      {
        component_name: 'BurnRateRunwayCard',
        data_binding: 'enhanced_analysis.financial_health.burn_analysis',
        display_format: 'score_card',
        fallback_display: { efficiency: 0, runway: 0 },
        required_fields: ['burn_efficiency_score', 'runway_adequacy_score', 'funding_urgency_score']
      },
      {
        component_name: 'CashRunwayChart',
        data_binding: 'enhanced_analysis.financial_health.cash_projections',
        display_format: 'chart',
        fallback_display: { runway_months: 0, projections: [] },
        required_fields: ['burn_rate_trend', 'cash_management_quality', 'burn_milestone_alignment']
      }
    ],
    responsible_engines: ['financial-engine'],
    dependencies: ['revenue-growth', 'unit-economics']
  },

  {
    subcategory_id: 'capital-efficiency',
    subcategory_name: 'Capital Efficiency',
    category: 'Financial Health',
    weight: 20,
    step_1_data_sourcing: [
      {
        source_type: 'financial_data',
        source_name: 'Capital Deployment Analysis',
        data_points: ['capital_invested', 'revenue_per_dollar_invested', 'asset_utilization', 'return_on_invested_capital'],
        reliability_score: 9,
        freshness_requirement: 'weekly',
        fallback_sources: ['investor_reports', 'board_materials']
      },
      {
        source_type: 'company_data',
        source_name: 'Operational Efficiency Metrics',
        data_points: ['productivity_metrics', 'asset_turnover', 'working_capital_efficiency'],
        reliability_score: 8,
        freshness_requirement: 'weekly'
      },
      {
        source_type: 'market_research',
        source_name: 'Capital Efficiency Benchmarks',
        data_points: ['industry_efficiency_benchmarks', 'capital_intensity_comparison', 'efficiency_best_practices'],
        reliability_score: 7,
        freshness_requirement: 'monthly'
      }
    ],
    step_2_analysis_output: {
      subcategory_id: 'capital-efficiency',
      score: 0,
      confidence: 0,
      reasoning: '',
      data_points: {
        capital_efficiency_score: 0,
        capital_productivity_ratio: 0,
        asset_utilization_score: 0,
        capital_deployment_effectiveness: 0,
        working_capital_management: 0,
        capital_allocation_discipline: 0,
        efficiency_improvement_trend: 0,
        capital_intensity_assessment: 0,
        return_on_capital_quality: 0,
        capital_efficiency_benchmark_comparison: 0
      },
      sources_used: [],
      insights: [],
      risk_flags: [],
      recommendations: [],
      last_updated: ''
    },
    step_3_ui_mapping: [
      {
        component_name: 'CapitalEfficiencyCard',
        data_binding: 'enhanced_analysis.financial_health.capital_efficiency',
        display_format: 'score_card',
        fallback_display: { efficiency: 0, productivity: 0 },
        required_fields: ['capital_efficiency_score', 'capital_productivity_ratio', 'asset_utilization_score']
      },
      {
        component_name: 'CapitalAllocationAnalysis',
        data_binding: 'enhanced_analysis.financial_health.capital_allocation',
        display_format: 'detail_section',
        fallback_display: { allocation: {}, effectiveness: 0 },
        required_fields: ['capital_deployment_effectiveness', 'capital_allocation_discipline', 'return_on_capital_quality']
      }
    ],
    responsible_engines: ['financial-engine'],
    dependencies: ['burn-rate-runway', 'revenue-growth']
  },

  {
    subcategory_id: 'financial-controls',
    subcategory_name: 'Financial Controls',
    category: 'Financial Health',
    weight: 15,
    step_1_data_sourcing: [
      {
        source_type: 'financial_data',
        source_name: 'Financial Systems Assessment',
        data_points: ['financial_reporting_quality', 'control_systems', 'audit_findings', 'compliance_status'],
        reliability_score: 8,
        freshness_requirement: 'monthly',
        fallback_sources: ['management_assessments', 'advisor_feedback']
      },
      {
        source_type: 'company_data',
        source_name: 'Operational Control Data',
        data_points: ['budget_variance', 'forecasting_accuracy', 'approval_processes', 'financial_governance'],
        reliability_score: 9,
        freshness_requirement: 'weekly'
      },
      {
        source_type: 'external_api',
        source_name: 'Compliance and Risk Data',
        data_points: ['regulatory_compliance', 'financial_risk_indicators', 'control_framework_maturity'],
        reliability_score: 7,
        freshness_requirement: 'monthly'
      }
    ],
    step_2_analysis_output: {
      subcategory_id: 'financial-controls',
      score: 0,
      confidence: 0,
      reasoning: '',
      data_points: {
        financial_controls_maturity: 0,
        reporting_quality_score: 0,
        control_system_effectiveness: 0,
        compliance_risk_score: 0,
        budgeting_forecasting_accuracy: 0,
        financial_governance_strength: 0,
        risk_management_sophistication: 0,
        audit_readiness_score: 0,
        control_scalability_assessment: 0,
        financial_transparency_level: 0
      },
      sources_used: [],
      insights: [],
      risk_flags: [],
      recommendations: [],
      last_updated: ''
    },
    step_3_ui_mapping: [
      {
        component_name: 'FinancialControlsCard',
        data_binding: 'enhanced_analysis.financial_health.financial_controls',
        display_format: 'score_card',
        fallback_display: { maturity: 0, effectiveness: 0 },
        required_fields: ['financial_controls_maturity', 'control_system_effectiveness', 'reporting_quality_score']
      },
      {
        component_name: 'ComplianceRiskAssessment',
        data_binding: 'enhanced_analysis.financial_health.compliance_assessment',
        display_format: 'detail_section',
        fallback_display: { risks: [], governance: 0 },
        required_fields: ['compliance_risk_score', 'financial_governance_strength', 'audit_readiness_score']
      }
    ],
    responsible_engines: ['financial-engine'],
    dependencies: ['burn-rate-runway', 'capital-efficiency']
  },

  // ========================================
  // STRATEGIC FIT CATEGORY
  // ========================================

  {
    subcategory_id: 'thesis-alignment',
    subcategory_name: 'Thesis Alignment',
    category: 'Strategic Fit',
    weight: 50,
    step_1_data_sourcing: [
      {
        source_type: 'company_data',
        source_name: 'Fund Strategy Analysis',
        data_points: ['fund_thesis_criteria', 'investment_strategy', 'sector_focus', 'stage_preference'],
        reliability_score: 9,
        freshness_requirement: 'monthly',
        fallback_sources: ['fund_documentation', 'investment_committee_materials']
      },
      {
        source_type: 'market_research',
        source_name: 'Strategic Alignment Assessment',
        data_points: ['thesis_market_fit', 'strategic_timing', 'thesis_validation_signals'],
        reliability_score: 8,
        freshness_requirement: 'weekly'
      },
      {
        source_type: 'external_api',
        source_name: 'Portfolio Alignment Data',
        data_points: ['portfolio_company_alignment', 'investment_pattern_analysis', 'thesis_evolution_tracking'],
        reliability_score: 7,
        freshness_requirement: 'monthly'
      }
    ],
    step_2_analysis_output: {
      subcategory_id: 'thesis-alignment',
      score: 0,
      confidence: 0,
      reasoning: '',
      data_points: {
        thesis_alignment_score: 0,
        strategic_fit_assessment: 0,
        investment_criteria_match: 0,
        thesis_conviction_level: 0,
        strategic_timing_alignment: 0,
        fund_focus_consistency: 0,
        thesis_validation_strength: 0,
        strategic_risk_alignment: 0,
        investment_rationale_strength: 0,
        thesis_differentiation_potential: 0
      },
      sources_used: [],
      insights: [],
      risk_flags: [],
      recommendations: [],
      last_updated: ''
    },
    step_3_ui_mapping: [
      {
        component_name: 'ThesisAlignmentCard',
        data_binding: 'enhanced_analysis.strategic_fit.thesis_analysis',
        display_format: 'score_card',
        fallback_display: { alignment: 0, conviction: 0 },
        required_fields: ['thesis_alignment_score', 'strategic_fit_assessment', 'thesis_conviction_level']
      },
      {
        component_name: 'StrategicFitAnalysis',
        data_binding: 'enhanced_analysis.strategic_fit.fit_assessment',
        display_format: 'detail_section',
        fallback_display: { criteria: {}, rationale: [] },
        required_fields: ['investment_criteria_match', 'investment_rationale_strength', 'fund_focus_consistency']
      }
    ],
    responsible_engines: ['thesis-alignment-engine'],
    dependencies: ['market-size-tam', 'revenue-model']
  },

  {
    subcategory_id: 'portfolio-synergies',
    subcategory_name: 'Portfolio Synergies',
    category: 'Strategic Fit',
    weight: 30,
    step_1_data_sourcing: [
      {
        source_type: 'company_data',
        source_name: 'Portfolio Company Analysis',
        data_points: ['existing_portfolio', 'synergy_opportunities', 'cross_selling_potential', 'strategic_partnerships'],
        reliability_score: 9,
        freshness_requirement: 'weekly',
        fallback_sources: ['portfolio_company_data', 'partnership_databases']
      },
      {
        source_type: 'market_research',
        source_name: 'Synergy Assessment Research',
        data_points: ['market_synergies', 'value_chain_integration', 'competitive_advantages_from_synergies'],
        reliability_score: 8,
        freshness_requirement: 'monthly'
      },
      {
        source_type: 'external_api',
        source_name: 'Network Effect Analysis',
        data_points: ['network_effects', 'ecosystem_benefits', 'platform_synergies'],
        reliability_score: 7,
        freshness_requirement: 'weekly'
      }
    ],
    step_2_analysis_output: {
      subcategory_id: 'portfolio-synergies',
      score: 0,
      confidence: 0,
      reasoning: '',
      data_points: {
        portfolio_synergy_potential: 0,
        cross_selling_opportunities: 0,
        strategic_partnership_value: 0,
        network_effect_benefits: 0,
        value_chain_integration_score: 0,
        synergy_realization_likelihood: 0,
        portfolio_diversification_benefit: 0,
        competitive_advantage_amplification: 0,
        ecosystem_value_creation: 0,
        synergy_timeline_assessment: 0
      },
      sources_used: [],
      insights: [],
      risk_flags: [],
      recommendations: [],
      last_updated: ''
    },
    step_3_ui_mapping: [
      {
        component_name: 'PortfolioSynergiesCard',
        data_binding: 'enhanced_analysis.strategic_fit.portfolio_synergies',
        display_format: 'score_card',
        fallback_display: { synergy_potential: 0, realization: 0 },
        required_fields: ['portfolio_synergy_potential', 'synergy_realization_likelihood', 'cross_selling_opportunities']
      },
      {
        component_name: 'SynergyOpportunityMap',
        data_binding: 'enhanced_analysis.strategic_fit.synergy_mapping',
        display_format: 'detail_section',
        fallback_display: { opportunities: [], partnerships: [] },
        required_fields: ['strategic_partnership_value', 'network_effect_benefits', 'ecosystem_value_creation']
      }
    ],
    responsible_engines: ['thesis-alignment-engine'],
    dependencies: ['thesis-alignment', 'competitive-landscape']
  },

  {
    subcategory_id: 'value-add-opportunity',
    subcategory_name: 'Value-Add Opportunity',
    category: 'Strategic Fit',
    weight: 20,
    step_1_data_sourcing: [
      {
        source_type: 'company_data',
        source_name: 'Fund Value-Add Capabilities',
        data_points: ['fund_expertise', 'advisory_capabilities', 'network_strength', 'value_creation_track_record'],
        reliability_score: 9,
        freshness_requirement: 'monthly',
        fallback_sources: ['fund_materials', 'lp_reports']
      },
      {
        source_type: 'market_research',
        source_name: 'Value-Add Need Assessment',
        data_points: ['company_needs_analysis', 'gap_identification', 'value_creation_priorities'],
        reliability_score: 8,
        freshness_requirement: 'weekly'
      },
      {
        source_type: 'external_api',
        source_name: 'Value Creation Benchmarks',
        data_points: ['value_add_benchmarks', 'best_practice_analysis', 'outcome_tracking'],
        reliability_score: 7,
        freshness_requirement: 'monthly'
      }
    ],
    step_2_analysis_output: {
      subcategory_id: 'value-add-opportunity',
      score: 0,
      confidence: 0,
      reasoning: '',
      data_points: {
        value_add_potential_score: 0,
        capability_company_need_match: 0,
        value_creation_opportunity_size: 0,
        fund_expertise_relevance: 0,
        network_value_potential: 0,
        advisory_impact_assessment: 0,
        value_add_differentiation: 0,
        implementation_feasibility: 0,
        value_creation_timeline: 0,
        measurable_value_outcomes: 0
      },
      sources_used: [],
      insights: [],
      risk_flags: [],
      recommendations: [],
      last_updated: ''
    },
    step_3_ui_mapping: [
      {
        component_name: 'ValueAddOpportunityCard',
        data_binding: 'enhanced_analysis.strategic_fit.value_add_analysis',
        display_format: 'score_card',
        fallback_display: { potential: 0, match: 0 },
        required_fields: ['value_add_potential_score', 'capability_company_need_match', 'fund_expertise_relevance']
      },
      {
        component_name: 'ValueCreationPlan',
        data_binding: 'enhanced_analysis.strategic_fit.value_creation',
        display_format: 'detail_section',
        fallback_display: { plan: [], timeline: 'TBD' },
        required_fields: ['value_creation_opportunity_size', 'implementation_feasibility', 'measurable_value_outcomes']
      }
    ],
    responsible_engines: ['thesis-alignment-engine'],
    dependencies: ['thesis-alignment', 'portfolio-synergies']
  }
];

// ========================================
// ENGINE RESPONSIBILITY MAPPING
// ========================================

export const ENGINE_SUBCATEGORY_MAPPING = {
  'team-research-engine': [
    'founder-market-fit',
    'previous-experience', 
    'technical-expertise',
    'execution-track-record'
  ],
  'market-intelligence-engine': [
    'market-size-tam',
    'market-growth-rate',
    'market-timing',
    'competitive-landscape',
    'customer-acquisition',
    'market-barriers-regulation',
    'customer-traction' // Business Model & Traction category overlap
  ],
  'product-ip-engine': [
    'product-market-fit',
    'technology-moat',
    'scalability'
  ],
  'financial-engine': [
    'revenue-model',
    'revenue-growth',
    'unit-economics',
    'burn-rate-runway',
    'capital-efficiency',
    'financial-controls'
  ],
  'thesis-alignment-engine': [
    'thesis-alignment',
    'portfolio-synergies',
    'value-add-opportunity'
  ]
};

// ========================================
// VALIDATION UTILITIES
// ========================================

export const validateBlueprint = (blueprint: SubcategoryBlueprint): boolean => {
  try {
    // Check required fields
    if (!blueprint.subcategory_id || !blueprint.subcategory_name || !blueprint.category) {
      return false;
    }
    
    // Check data sourcing
    if (!blueprint.step_1_data_sourcing || blueprint.step_1_data_sourcing.length === 0) {
      return false;
    }
    
    // Check analysis output schema
    if (!blueprint.step_2_analysis_output) {
      return false;
    }
    
    // Check UI mapping
    if (!blueprint.step_3_ui_mapping || blueprint.step_3_ui_mapping.length === 0) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Blueprint validation error:', error);
    return false;
  }
};

export const getBlueprintBySubcategory = (subcategoryId: string): SubcategoryBlueprint | undefined => {
  return VC_SUBCATEGORY_BLUEPRINTS.find(bp => bp.subcategory_id === subcategoryId);
};

export const getBlueprintsByEngine = (engineName: string): SubcategoryBlueprint[] => {
  return VC_SUBCATEGORY_BLUEPRINTS.filter(bp => bp.responsible_engines.includes(engineName));
};

export const getBlueprintsByCategory = (category: string): SubcategoryBlueprint[] => {
  return VC_SUBCATEGORY_BLUEPRINTS.filter(bp => bp.category === category);
};

// ========================================
// SUMMARY OF BLUEPRINT COVERAGE
// ========================================

/**
 * PHASE 1 COMPLETE: VC Deal Analysis Blueprint
 * 
 * ✅ SYSTEMATIC BLUEPRINT DEFINITION:
 * - 21 VC subcategories mapped across 6 main categories
 * - Each subcategory defines Steps 1-3 (not Step 4 - AI execution)
 * - Data sourcing, analysis output structure, and UI mapping defined
 * 
 * ✅ COMPLETE CATEGORY COVERAGE:
 * 
 * 🏢 TEAM & LEADERSHIP (4 subcategories):
 * - Founder-Market Fit, Previous Experience, Technical Expertise, Execution Track Record
 * 
 * 📈 MARKET OPPORTUNITY (6 subcategories):
 * - Market Size (TAM), Market Growth Rate, Market Timing, Competitive Landscape, 
 *   Customer Acquisition, Market Barriers & Regulation
 * 
 * 🛠️ PRODUCT & TECHNOLOGY (3 subcategories):
 * - Product-Market Fit, Technology Moat, Scalability
 * 
 * 💼 BUSINESS MODEL & TRACTION (2 subcategories):
 * - Revenue Model, Customer Traction
 * 
 * 💰 FINANCIAL HEALTH (5 subcategories):
 * - Revenue Growth, Unit Economics, Burn Rate & Runway, Capital Efficiency, Financial Controls
 * 
 * 🎯 STRATEGIC FIT (3 subcategories):
 * - Thesis Alignment, Portfolio Synergies, Value-Add Opportunity
 * 
 * ✅ STEP 1 - DATA SOURCING STRATEGY:
 * - 8 source types: company_data, market_research, financial_data, team_research, 
 *   product_data, competitive_intel, external_api, document_parsing
 * - Reliability scores (1-10) and freshness requirements defined
 * - Fallback sources identified for critical data points
 * 
 * ✅ STEP 2 - ANALYSIS OUTPUT STRUCTURE:
 * - Standardized AnalysisOutput interface for all subcategories
 * - Consistent scoring (0-100), confidence levels, reasoning
 * - Structured data_points specific to each subcategory
 * - Regional/local analysis included for market sizing and geography-sensitive metrics
 * 
 * ✅ STEP 3 - UI COMPONENT ALIGNMENT:
 * - Component names mapped to data binding paths
 * - Display formats defined (score_card, detail_section, chart, etc.)
 * - Fallback displays for when analysis is pending
 * - Required fields specified for each UI component
 * 
 * ✅ ENGINE RESPONSIBILITY MAPPING:
 * - 5 analysis engines with clear subcategory ownership
 * - Dependencies mapped between subcategories
 * - No overlapping responsibilities (except strategic cross-engine collaborations)
 * 
 * 🎯 RESULT: Complete VC blueprint decouples analysis preparation from AI execution
 * 
 * NEXT STEPS:
 * - Phase 2: PE Deal Analysis Blueprint (18 subcategories) 
 * - Phase 3: Engine Configuration Templates
 * - Phase 4: Integration Testing with sample data
 * - Phase 5: Enable Analysis Engines (Step 4)
 */