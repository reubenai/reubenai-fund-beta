/**
 * PE Deal Analysis Blueprint - Phase 2
 * Comprehensive analysis framework for Private Equity investment evaluation
 * Defines systematic analysis logic for all 18 PE subcategories across 6 categories
 */

export interface PEDataSource {
  name: string;
  type: 'financial_statements' | 'operational_data' | 'market_research' | 'management_assessment' | 'customer_data' | 'competitive_intelligence' | 'regulatory_data' | 'industry_benchmarks';
  priority: 'critical' | 'high' | 'medium' | 'low';
  data_points: string[];
  collection_method: 'document_analysis' | 'api_integration' | 'web_scraping' | 'survey' | 'interview' | 'third_party_data';
  validation_required: boolean;
}

export interface PEAnalysisOutput {
  metrics: Record<string, any>;
  scores: Record<string, number>;
  trends: Record<string, 'positive' | 'negative' | 'neutral' | 'volatile'>;
  benchmarks: Record<string, any>;
  risk_factors: string[];
  opportunities: string[];
  key_insights: string[];
  confidence_level: number;
  data_completeness: number;
}

export interface PEUserInsights {
  dashboard_widgets: string[];
  key_alerts: string[];
  actionable_recommendations: string[];
  visual_components: string[];
  drill_down_capabilities: string[];
  comparison_benchmarks: string[];
}

export interface PESubcategoryBlueprint {
  name: string;
  description: string;
  weight: number;
  data_sources: PEDataSource[];
  analysis_output: PEAnalysisOutput;
  user_insights: PEUserInsights;
  engine_responsibility: string;
  regional_considerations: string[];
  data_quality_requirements: {
    minimum_data_age: number; // days
    required_data_points: string[];
    validation_rules: string[];
  };
}

export interface PECategoryBlueprint {
  name: string;
  description: string;
  total_weight: number;
  subcategories: PESubcategoryBlueprint[];
  category_insights: {
    summary_metrics: string[];
    risk_indicators: string[];
    value_creation_levers: string[];
  };
}

/**
 * CATEGORY 1: FINANCIAL PERFORMANCE (30% weight)
 * Focus: Revenue quality, profitability, cash generation, financial stability
 */
const PE_FINANCIAL_PERFORMANCE: PECategoryBlueprint = {
  name: "Financial Performance",
  description: "Comprehensive assessment of financial health, revenue quality, and cash generation capabilities",
  total_weight: 30,
  subcategories: [
    {
      name: "Revenue Quality",
      description: "Analysis of revenue sustainability, predictability, and growth patterns",
      weight: 35,
      data_sources: [
        {
          name: "Financial Statements Analysis",
          type: 'financial_statements',
          priority: 'critical',
          data_points: ['revenue_by_segment', 'recurring_revenue_percentage', 'customer_concentration', 'contract_terms', 'revenue_recognition_policies'],
          collection_method: 'document_analysis',
          validation_required: true
        },
        {
          name: "Customer Contract Analysis",
          type: 'customer_data',
          priority: 'high',
          data_points: ['contract_duration', 'renewal_rates', 'churn_analysis', 'pricing_power', 'payment_terms'],
          collection_method: 'document_analysis',
          validation_required: true
        },
        {
          name: "Revenue Cohort Analysis",
          type: 'operational_data',
          priority: 'high',
          data_points: ['cohort_retention', 'expansion_revenue', 'seasonal_patterns', 'geographic_distribution'],
          collection_method: 'api_integration',
          validation_required: false
        }
      ],
      analysis_output: {
        metrics: {
          recurring_revenue_percentage: 'number',
          revenue_growth_rate: 'number',
          customer_concentration_risk: 'number',
          contract_value_weighted_duration: 'number',
          revenue_predictability_score: 'number'
        },
        scores: {
          revenue_quality_score: 85,
          sustainability_score: 78,
          growth_consistency_score: 82
        },
        trends: {
          revenue_growth: 'positive',
          customer_retention: 'positive',
          pricing_power: 'neutral'
        },
        benchmarks: {
          industry_average_recurring_revenue: 'number',
          peer_growth_rates: 'array',
          sector_churn_benchmarks: 'number'
        },
        risk_factors: ['High customer concentration', 'Seasonal revenue volatility'],
        opportunities: ['Expand recurring revenue streams', 'Improve contract terms'],
        key_insights: ['Strong revenue predictability with 75% recurring base', 'Limited customer concentration risk'],
        confidence_level: 85,
        data_completeness: 90
      },
      user_insights: {
        dashboard_widgets: ['Revenue Quality Score', 'Recurring Revenue Trend', 'Customer Concentration Chart', 'Contract Duration Analysis'],
        key_alerts: ['Revenue concentration above 20% threshold', 'Declining renewal rates detected'],
        actionable_recommendations: ['Diversify customer base', 'Extend average contract duration', 'Implement usage-based pricing'],
        visual_components: ['Revenue composition pie chart', 'Cohort retention heatmap', 'Contract renewal timeline'],
        drill_down_capabilities: ['Revenue by customer segment', 'Geographic revenue breakdown', 'Product line revenue analysis'],
        comparison_benchmarks: ['Industry revenue quality metrics', 'Peer company comparisons', 'Historical performance trends']
      },
      engine_responsibility: 'financial-engine',
      regional_considerations: ['Local revenue recognition standards', 'Regional customer behavior patterns', 'Currency impact analysis'],
      data_quality_requirements: {
        minimum_data_age: 90,
        required_data_points: ['revenue_by_month_36m', 'customer_contracts', 'renewal_history'],
        validation_rules: ['Revenue figures must reconcile with audited statements', 'Contract data must be current within 30 days']
      }
    },
    {
      name: "Profitability Analysis",
      description: "EBITDA trends, margin analysis, and operational leverage assessment",
      weight: 35,
      data_sources: [
        {
          name: "P&L Statement Analysis",
          type: 'financial_statements',
          priority: 'critical',
          data_points: ['gross_margin_trends', 'ebitda_margin', 'operating_leverage', 'cost_structure_breakdown', 'margin_sustainability'],
          collection_method: 'document_analysis',
          validation_required: true
        },
        {
          name: "Cost Structure Analysis",
          type: 'operational_data',
          priority: 'high',
          data_points: ['fixed_vs_variable_costs', 'cost_per_acquisition', 'operational_efficiency_metrics', 'economies_of_scale'],
          collection_method: 'document_analysis',
          validation_required: true
        },
        {
          name: "Industry Benchmarking",
          type: 'industry_benchmarks',
          priority: 'medium',
          data_points: ['peer_margin_comparison', 'industry_cost_benchmarks', 'best_practice_metrics'],
          collection_method: 'third_party_data',
          validation_required: false
        }
      ],
      analysis_output: {
        metrics: {
          ebitda_margin: 'number',
          gross_margin_trend: 'number',
          operational_leverage: 'number',
          cost_efficiency_ratio: 'number',
          margin_stability_score: 'number'
        },
        scores: {
          profitability_score: 78,
          margin_quality_score: 82,
          cost_efficiency_score: 75
        },
        trends: {
          ebitda_margin: 'positive',
          gross_margin: 'neutral',
          operating_costs: 'positive'
        },
        benchmarks: {
          industry_ebitda_margin: 'number',
          peer_cost_ratios: 'array',
          best_in_class_margins: 'number'
        },
        risk_factors: ['Margin pressure from competition', 'Fixed cost leverage risk'],
        opportunities: ['Cost optimization initiatives', 'Pricing power improvement'],
        key_insights: ['EBITDA margins above industry average', 'Strong operational leverage potential'],
        confidence_level: 85,
        data_completeness: 95
      },
      user_insights: {
        dashboard_widgets: ['EBITDA Margin Trend', 'Cost Structure Breakdown', 'Operational Leverage Chart', 'Margin Waterfall Analysis'],
        key_alerts: ['Margin compression detected', 'Cost inflation above revenue growth'],
        actionable_recommendations: ['Implement cost reduction program', 'Optimize pricing strategy', 'Improve operational efficiency'],
        visual_components: ['Margin trend line chart', 'Cost structure pie chart', 'Benchmark comparison radar'],
        drill_down_capabilities: ['Cost center analysis', 'Product line profitability', 'Geographic margin breakdown'],
        comparison_benchmarks: ['Industry margin standards', 'Peer profitability metrics', 'Historical performance']
      },
      engine_responsibility: 'financial-engine',
      regional_considerations: ['Local cost structures', 'Regional wage inflation', 'Tax optimization opportunities'],
      data_quality_requirements: {
        minimum_data_age: 60,
        required_data_points: ['monthly_pnl_24m', 'cost_center_breakdown', 'margin_analysis'],
        validation_rules: ['P&L must be audited or reviewed', 'Cost allocations must be consistent']
      }
    },
    {
      name: "Cash Management",
      description: "Free cash flow generation, working capital efficiency, and liquidity analysis",
      weight: 30,
      data_sources: [
        {
          name: "Cash Flow Statement Analysis",
          type: 'financial_statements',
          priority: 'critical',
          data_points: ['free_cash_flow', 'operating_cash_flow', 'cash_conversion_cycle', 'working_capital_trends', 'capex_requirements'],
          collection_method: 'document_analysis',
          validation_required: true
        },
        {
          name: "Working Capital Analysis",
          type: 'operational_data',
          priority: 'high',
          data_points: ['days_sales_outstanding', 'inventory_turnover', 'days_payable_outstanding', 'cash_conversion_efficiency'],
          collection_method: 'document_analysis',
          validation_required: true
        },
        {
          name: "Liquidity Assessment",
          type: 'financial_statements',
          priority: 'high',
          data_points: ['cash_position', 'debt_capacity', 'credit_facilities', 'cash_runway', 'seasonal_working_capital'],
          collection_method: 'document_analysis',
          validation_required: true
        }
      ],
      analysis_output: {
        metrics: {
          free_cash_flow_margin: 'number',
          cash_conversion_cycle: 'number',
          working_capital_efficiency: 'number',
          cash_runway_months: 'number',
          liquidity_ratio: 'number'
        },
        scores: {
          cash_generation_score: 88,
          working_capital_score: 75,
          liquidity_score: 92
        },
        trends: {
          free_cash_flow: 'positive',
          working_capital: 'neutral',
          cash_position: 'positive'
        },
        benchmarks: {
          industry_cash_conversion: 'number',
          peer_working_capital: 'array',
          sector_liquidity_norms: 'number'
        },
        risk_factors: ['Working capital seasonality', 'Capex intensity risk'],
        opportunities: ['Working capital optimization', 'Cash flow acceleration'],
        key_insights: ['Strong free cash flow generation', 'Efficient working capital management'],
        confidence_level: 90,
        data_completeness: 88
      },
      user_insights: {
        dashboard_widgets: ['Free Cash Flow Trend', 'Working Capital Cycle', 'Liquidity Position', 'Cash Conversion Analysis'],
        key_alerts: ['Working capital deterioration', 'Low cash runway warning'],
        actionable_recommendations: ['Optimize payment terms', 'Improve inventory management', 'Accelerate collections'],
        visual_components: ['Cash flow waterfall', 'Working capital components', 'Liquidity bridge chart'],
        drill_down_capabilities: ['Monthly cash flow analysis', 'Working capital by component', 'Seasonal cash patterns'],
        comparison_benchmarks: ['Industry cash metrics', 'Working capital efficiency standards', 'Liquidity benchmarks']
      },
      engine_responsibility: 'financial-engine',
      regional_considerations: ['Local payment customs', 'Regional banking relationships', 'Currency hedging needs'],
      data_quality_requirements: {
        minimum_data_age: 30,
        required_data_points: ['monthly_cash_flow_24m', 'balance_sheet_components', 'working_capital_details'],
        validation_rules: ['Cash flow must reconcile with bank statements', 'Working capital components must be detailed']
      }
    }
  ],
  category_insights: {
    summary_metrics: ['Overall Financial Health Score', 'Cash Generation Capability', 'Margin Sustainability Index'],
    risk_indicators: ['Financial leverage risk', 'Cash flow volatility', 'Margin pressure indicators'],
    value_creation_levers: ['Operational efficiency improvements', 'Working capital optimization', 'Revenue quality enhancement']
  }
};

/**
 * CATEGORY 2: OPERATIONAL EXCELLENCE (25% weight)
 * Focus: Management strength, operational efficiency, technology capabilities
 */
const PE_OPERATIONAL_EXCELLENCE: PECategoryBlueprint = {
  name: "Operational Excellence",
  description: "Assessment of operational capabilities, management quality, and efficiency potential",
  total_weight: 25,
  subcategories: [
    {
      name: "Management Team Strength",
      description: "Leadership assessment, track record analysis, and team capability evaluation",
      weight: 40,
      data_sources: [
        {
          name: "Leadership Assessment",
          type: 'management_assessment',
          priority: 'critical',
          data_points: ['executive_experience', 'industry_expertise', 'value_creation_history', 'leadership_style', 'team_dynamics'],
          collection_method: 'interview',
          validation_required: true
        },
        {
          name: "Track Record Analysis",
          type: 'management_assessment',
          priority: 'high',
          data_points: ['previous_company_performance', 'value_creation_initiatives', 'crisis_management', 'strategic_execution'],
          collection_method: 'third_party_data',
          validation_required: true
        },
        {
          name: "Team Retention Metrics",
          type: 'operational_data',
          priority: 'medium',
          data_points: ['executive_tenure', 'retention_rates', 'succession_planning', 'compensation_structure'],
          collection_method: 'document_analysis',
          validation_required: false
        }
      ],
      analysis_output: {
        metrics: {
          leadership_experience_score: 'number',
          track_record_rating: 'number',
          team_stability_index: 'number',
          succession_readiness: 'number',
          cultural_alignment_score: 'number'
        },
        scores: {
          management_quality_score: 85,
          execution_capability_score: 78,
          leadership_stability_score: 88
        },
        trends: {
          team_performance: 'positive',
          retention_rates: 'positive',
          leadership_development: 'neutral'
        },
        benchmarks: {
          industry_leadership_standards: 'number',
          peer_management_ratings: 'array',
          best_practice_metrics: 'number'
        },
        risk_factors: ['Key person dependency', 'Leadership transition risk'],
        opportunities: ['Management development programs', 'Succession planning enhancement'],
        key_insights: ['Strong experienced leadership team', 'Proven value creation track record'],
        confidence_level: 82,
        data_completeness: 75
      },
      user_insights: {
        dashboard_widgets: ['Management Quality Score', 'Leadership Experience Matrix', 'Team Stability Metrics', 'Succession Planning Status'],
        key_alerts: ['Key executive departure risk', 'Succession gap identified'],
        actionable_recommendations: ['Strengthen succession planning', 'Implement leadership development', 'Enhance retention programs'],
        visual_components: ['Leadership experience radar', 'Team stability timeline', 'Succession readiness matrix'],
        drill_down_capabilities: ['Individual executive profiles', 'Team performance metrics', 'Historical leadership changes'],
        comparison_benchmarks: ['Industry leadership standards', 'PE portfolio management quality', 'Best-in-class teams']
      },
      engine_responsibility: 'team-research-engine',
      regional_considerations: ['Local leadership styles', 'Regional talent markets', 'Cultural management approaches'],
      data_quality_requirements: {
        minimum_data_age: 180,
        required_data_points: ['executive_bios', 'performance_history', 'retention_data'],
        validation_rules: ['Leadership assessments must be recent', 'Track records must be verified']
      }
    },
    {
      name: "Operational Efficiency",
      description: "Process optimization, productivity metrics, and operational leverage analysis",
      weight: 35,
      data_sources: [
        {
          name: "Operational KPI Analysis",
          type: 'operational_data',
          priority: 'critical',
          data_points: ['productivity_metrics', 'efficiency_ratios', 'process_optimization', 'automation_level', 'operational_leverage'],
          collection_method: 'api_integration',
          validation_required: true
        },
        {
          name: "Process Assessment",
          type: 'operational_data',
          priority: 'high',
          data_points: ['process_maturity', 'standardization_level', 'quality_metrics', 'waste_reduction', 'continuous_improvement'],
          collection_method: 'survey',
          validation_required: false
        },
        {
          name: "Benchmarking Analysis",
          type: 'industry_benchmarks',
          priority: 'medium',
          data_points: ['industry_efficiency_standards', 'best_practice_comparisons', 'peer_productivity_metrics'],
          collection_method: 'third_party_data',
          validation_required: false
        }
      ],
      analysis_output: {
        metrics: {
          operational_efficiency_ratio: 'number',
          productivity_index: 'number',
          process_maturity_score: 'number',
          automation_percentage: 'number',
          waste_reduction_potential: 'number'
        },
        scores: {
          efficiency_score: 75,
          process_quality_score: 82,
          improvement_potential_score: 78
        },
        trends: {
          productivity: 'positive',
          efficiency_metrics: 'neutral',
          process_improvement: 'positive'
        },
        benchmarks: {
          industry_efficiency_norms: 'number',
          peer_productivity_levels: 'array',
          best_practice_standards: 'number'
        },
        risk_factors: ['Process dependency risks', 'Efficiency plateau risk'],
        opportunities: ['Automation implementation', 'Process standardization', 'Lean optimization'],
        key_insights: ['Solid operational foundation', 'Significant automation potential'],
        confidence_level: 80,
        data_completeness: 85
      },
      user_insights: {
        dashboard_widgets: ['Operational Efficiency Score', 'Productivity Trends', 'Process Maturity Matrix', 'Automation Roadmap'],
        key_alerts: ['Efficiency decline detected', 'Process bottleneck identified'],
        actionable_recommendations: ['Implement lean processes', 'Increase automation', 'Standardize operations'],
        visual_components: ['Efficiency trend charts', 'Process flow diagrams', 'Benchmark comparison radar'],
        drill_down_capabilities: ['Department efficiency analysis', 'Process-level metrics', 'Improvement initiative tracking'],
        comparison_benchmarks: ['Industry efficiency standards', 'Operational excellence benchmarks', 'PE portfolio comparisons']
      },
      engine_responsibility: 'operational-intelligence-engine',
      regional_considerations: ['Local operational practices', 'Regional efficiency standards', 'Cultural work patterns'],
      data_quality_requirements: {
        minimum_data_age: 90,
        required_data_points: ['operational_kpis_12m', 'process_documentation', 'efficiency_metrics'],
        validation_rules: ['KPIs must be consistently measured', 'Process data must be current']
      }
    },
    {
      name: "Technology & Systems",
      description: "Technology infrastructure, digital capabilities, and IT system assessment",
      weight: 25,
      data_sources: [
        {
          name: "Technology Stack Assessment",
          type: 'operational_data',
          priority: 'high',
          data_points: ['it_infrastructure', 'software_systems', 'digital_capabilities', 'technology_debt', 'scalability_assessment'],
          collection_method: 'survey',
          validation_required: true
        },
        {
          name: "Digital Transformation Analysis",
          type: 'operational_data',
          priority: 'medium',
          data_points: ['digitization_level', 'automation_systems', 'data_analytics_capability', 'digital_strategy'],
          collection_method: 'document_analysis',
          validation_required: false
        },
        {
          name: "IT Security & Compliance",
          type: 'regulatory_data',
          priority: 'high',
          data_points: ['cybersecurity_posture', 'compliance_status', 'data_governance', 'risk_management'],
          collection_method: 'survey',
          validation_required: true
        }
      ],
      analysis_output: {
        metrics: {
          technology_maturity_score: 'number',
          digital_capability_index: 'number',
          system_scalability_rating: 'number',
          security_compliance_score: 'number',
          it_investment_efficiency: 'number'
        },
        scores: {
          technology_score: 70,
          digital_readiness_score: 65,
          security_score: 85
        },
        trends: {
          technology_investment: 'positive',
          digital_adoption: 'positive',
          security_posture: 'neutral'
        },
        benchmarks: {
          industry_tech_standards: 'number',
          digital_maturity_benchmarks: 'array',
          security_compliance_norms: 'number'
        },
        risk_factors: ['Technology debt accumulation', 'Cybersecurity vulnerabilities'],
        opportunities: ['Digital transformation acceleration', 'System modernization', 'Data analytics enhancement'],
        key_insights: ['Solid IT foundation with modernization needs', 'Strong security compliance'],
        confidence_level: 75,
        data_completeness: 70
      },
      user_insights: {
        dashboard_widgets: ['Technology Maturity Score', 'Digital Readiness Index', 'Security Compliance Status', 'IT Investment ROI'],
        key_alerts: ['Technology debt accumulation', 'Security compliance gap'],
        actionable_recommendations: ['Modernize legacy systems', 'Enhance digital capabilities', 'Strengthen cybersecurity'],
        visual_components: ['Technology stack diagram', 'Digital maturity radar', 'Security compliance matrix'],
        drill_down_capabilities: ['System-by-system analysis', 'Digital capability assessment', 'Security risk breakdown'],
        comparison_benchmarks: ['Industry technology standards', 'Digital maturity benchmarks', 'Security best practices']
      },
      engine_responsibility: 'technology-assessment-engine',
      regional_considerations: ['Local technology ecosystems', 'Regional compliance requirements', 'Cultural digital adoption'],
      data_quality_requirements: {
        minimum_data_age: 120,
        required_data_points: ['technology_inventory', 'digital_strategy_docs', 'security_assessments'],
        validation_rules: ['Technology assessments must be current', 'Security evaluations must be recent']
      }
    }
  ],
  category_insights: {
    summary_metrics: ['Operational Excellence Index', 'Management Quality Rating', 'Technology Readiness Score'],
    risk_indicators: ['Operational dependency risks', 'Management continuity risks', 'Technology obsolescence risks'],
    value_creation_levers: ['Operational efficiency improvements', 'Management capability enhancement', 'Technology modernization']
  }
};

/**
 * CATEGORY 3: MARKET POSITION (20% weight)
 * Focus: Market share, competitive advantages, customer relationships
 */
const PE_MARKET_POSITION: PECategoryBlueprint = {
  name: "Market Position",
  description: "Analysis of competitive positioning, market share, and customer relationship strength",
  total_weight: 20,
  subcategories: [
    {
      name: "Market Share & Position",
      description: "Market ranking, share trends, and competitive positioning analysis",
      weight: 35,
      data_sources: [
        {
          name: "Market Research Analysis",
          type: 'market_research',
          priority: 'critical',
          data_points: ['market_share', 'market_ranking', 'share_trends', 'geographic_presence', 'segment_leadership'],
          collection_method: 'third_party_data',
          validation_required: true
        },
        {
          name: "Competitive Intelligence",
          type: 'competitive_intelligence',
          priority: 'high',
          data_points: ['competitor_analysis', 'market_dynamics', 'competitive_threats', 'market_opportunities'],
          collection_method: 'web_scraping',
          validation_required: false
        },
        {
          name: "Customer Perception Analysis",
          type: 'customer_data',
          priority: 'medium',
          data_points: ['brand_recognition', 'customer_satisfaction', 'market_reputation', 'thought_leadership'],
          collection_method: 'survey',
          validation_required: false
        }
      ],
      analysis_output: {
        metrics: {
          market_share_percentage: 'number',
          market_ranking: 'number',
          share_growth_rate: 'number',
          geographic_coverage: 'number',
          brand_strength_index: 'number'
        },
        scores: {
          market_position_score: 78,
          competitive_strength_score: 82,
          market_presence_score: 75
        },
        trends: {
          market_share: 'positive',
          competitive_position: 'neutral',
          brand_recognition: 'positive'
        },
        benchmarks: {
          industry_concentration_ratios: 'number',
          market_leader_metrics: 'array',
          competitive_benchmarks: 'number'
        },
        risk_factors: ['Market share vulnerability', 'Competitive displacement risk'],
        opportunities: ['Market expansion potential', 'Share gain opportunities'],
        key_insights: ['Strong market position in core segments', 'Opportunity for geographic expansion'],
        confidence_level: 85,
        data_completeness: 80
      },
      user_insights: {
        dashboard_widgets: ['Market Share Trend', 'Competitive Position Map', 'Geographic Presence', 'Brand Strength Metrics'],
        key_alerts: ['Market share decline detected', 'New competitive threat emerged'],
        actionable_recommendations: ['Defend market position', 'Expand geographic presence', 'Strengthen competitive moats'],
        visual_components: ['Market share pie chart', 'Competitive positioning matrix', 'Geographic heat map'],
        drill_down_capabilities: ['Segment-wise market analysis', 'Regional market positions', 'Competitor benchmarking'],
        comparison_benchmarks: ['Industry market share norms', 'Competitive positioning standards', 'Market leadership metrics']
      },
      engine_responsibility: 'market-intelligence-engine',
      regional_considerations: ['Local market dynamics', 'Regional competitive landscapes', 'Cultural market preferences'],
      data_quality_requirements: {
        minimum_data_age: 90,
        required_data_points: ['market_share_data', 'competitive_analysis', 'customer_research'],
        validation_rules: ['Market data must be from credible sources', 'Competitive intelligence must be current']
      }
    },
    {
      name: "Competitive Advantages",
      description: "Sustainable moats, differentiation factors, and competitive defensibility",
      weight: 35,
      data_sources: [
        {
          name: "Competitive Moat Analysis",
          type: 'competitive_intelligence',
          priority: 'critical',
          data_points: ['moat_strength', 'differentiation_factors', 'barriers_to_entry', 'switching_costs', 'network_effects'],
          collection_method: 'document_analysis',
          validation_required: true
        },
        {
          name: "Intellectual Property Assessment",
          type: 'regulatory_data',
          priority: 'high',
          data_points: ['patent_portfolio', 'trademark_strength', 'trade_secrets', 'ip_protection'],
          collection_method: 'document_analysis',
          validation_required: true
        },
        {
          name: "Value Proposition Analysis",
          type: 'customer_data',
          priority: 'medium',
          data_points: ['value_differentiation', 'customer_switching_costs', 'loyalty_drivers', 'competitive_responses'],
          collection_method: 'survey',
          validation_required: false
        }
      ],
      analysis_output: {
        metrics: {
          moat_strength_score: 'number',
          differentiation_index: 'number',
          switching_cost_rating: 'number',
          ip_protection_score: 'number',
          competitive_defensibility: 'number'
        },
        scores: {
          competitive_advantage_score: 85,
          moat_sustainability_score: 78,
          differentiation_score: 88
        },
        trends: {
          competitive_moats: 'positive',
          differentiation_strength: 'neutral',
          market_defensibility: 'positive'
        },
        benchmarks: {
          industry_moat_standards: 'number',
          competitive_advantage_norms: 'array',
          differentiation_benchmarks: 'number'
        },
        risk_factors: ['Moat erosion risk', 'Competitive commoditization'],
        opportunities: ['Strengthen competitive moats', 'Enhance differentiation'],
        key_insights: ['Strong sustainable competitive advantages', 'Well-protected market position'],
        confidence_level: 82,
        data_completeness: 85
      },
      user_insights: {
        dashboard_widgets: ['Competitive Moat Strength', 'Differentiation Matrix', 'IP Protection Status', 'Switching Cost Analysis'],
        key_alerts: ['Moat weakening detected', 'Competitive threat to differentiation'],
        actionable_recommendations: ['Strengthen competitive moats', 'Enhance IP protection', 'Increase switching costs'],
        visual_components: ['Moat strength radar', 'Competitive advantage matrix', 'IP portfolio visualization'],
        drill_down_capabilities: ['Moat-by-moat analysis', 'Competitive response scenarios', 'IP asset breakdown'],
        comparison_benchmarks: ['Industry moat standards', 'Competitive advantage benchmarks', 'Best-in-class differentiation']
      },
      engine_responsibility: 'competitive-intelligence-engine',
      regional_considerations: ['Local competitive dynamics', 'Regional IP laws', 'Cultural competitive factors'],
      data_quality_requirements: {
        minimum_data_age: 120,
        required_data_points: ['competitive_analysis', 'ip_documentation', 'differentiation_evidence'],
        validation_rules: ['Competitive advantages must be documented', 'IP assets must be verified']
      }
    },
    {
      name: "Customer Base Quality",
      description: "Customer concentration, loyalty, lifetime value, and relationship strength",
      weight: 30,
      data_sources: [
        {
          name: "Customer Analytics",
          type: 'customer_data',
          priority: 'critical',
          data_points: ['customer_concentration', 'customer_lifetime_value', 'retention_rates', 'loyalty_metrics', 'satisfaction_scores'],
          collection_method: 'api_integration',
          validation_required: true
        },
        {
          name: "Customer Relationship Assessment",
          type: 'customer_data',
          priority: 'high',
          data_points: ['relationship_depth', 'engagement_levels', 'cross_selling_success', 'referral_rates'],
          collection_method: 'survey',
          validation_required: false
        },
        {
          name: "Customer Segmentation Analysis",
          type: 'customer_data',
          priority: 'medium',
          data_points: ['segment_profitability', 'growth_potential', 'risk_profiles', 'strategic_value'],
          collection_method: 'api_integration',
          validation_required: false
        }
      ],
      analysis_output: {
        metrics: {
          customer_concentration_ratio: 'number',
          average_customer_lifetime_value: 'number',
          customer_retention_rate: 'number',
          net_promoter_score: 'number',
          customer_acquisition_cost: 'number'
        },
        scores: {
          customer_quality_score: 88,
          relationship_strength_score: 85,
          customer_diversification_score: 75
        },
        trends: {
          customer_retention: 'positive',
          customer_satisfaction: 'positive',
          customer_concentration: 'neutral'
        },
        benchmarks: {
          industry_retention_rates: 'number',
          customer_satisfaction_norms: 'array',
          ltv_benchmarks: 'number'
        },
        risk_factors: ['Customer concentration risk', 'Customer churn vulnerability'],
        opportunities: ['Customer base diversification', 'Loyalty program enhancement'],
        key_insights: ['High-quality customer relationships', 'Strong customer loyalty and retention'],
        confidence_level: 88,
        data_completeness: 92
      },
      user_insights: {
        dashboard_widgets: ['Customer Quality Score', 'Retention Rate Trend', 'Customer Concentration', 'LTV Analysis'],
        key_alerts: ['Customer concentration above threshold', 'Declining satisfaction scores'],
        actionable_recommendations: ['Diversify customer base', 'Enhance loyalty programs', 'Improve customer experience'],
        visual_components: ['Customer concentration chart', 'Retention cohort analysis', 'Satisfaction trend graph'],
        drill_down_capabilities: ['Customer segment analysis', 'Individual customer profiles', 'Churn risk assessment'],
        comparison_benchmarks: ['Industry customer metrics', 'Best-in-class retention rates', 'Customer satisfaction standards']
      },
      engine_responsibility: 'customer-intelligence-engine',
      regional_considerations: ['Local customer behaviors', 'Regional loyalty patterns', 'Cultural relationship factors'],
      data_quality_requirements: {
        minimum_data_age: 60,
        required_data_points: ['customer_database', 'retention_history', 'satisfaction_surveys'],
        validation_rules: ['Customer data must be current', 'Satisfaction metrics must be validated']
      }
    }
  ],
  category_insights: {
    summary_metrics: ['Market Position Strength', 'Competitive Advantage Index', 'Customer Relationship Quality'],
    risk_indicators: ['Market position vulnerability', 'Competitive displacement risk', 'Customer concentration risk'],
    value_creation_levers: ['Market share expansion', 'Competitive moat strengthening', 'Customer relationship enhancement']
  }
};

/**
 * CATEGORY 4: MANAGEMENT QUALITY (15% weight)
 * Focus: Leadership track record, organizational strength, strategic vision
 */
const PE_MANAGEMENT_QUALITY: PECategoryBlueprint = {
  name: "Management Quality",
  description: "Leadership assessment, organizational capabilities, and strategic execution strength",
  total_weight: 15,
  subcategories: [
    {
      name: "Leadership Track Record",
      description: "Executive performance history, value creation experience, and proven leadership",
      weight: 40,
      data_sources: [
        {
          name: "Executive History Analysis",
          type: 'management_assessment',
          priority: 'critical',
          data_points: ['career_progression', 'value_creation_history', 'crisis_leadership', 'strategic_execution', 'team_building'],
          collection_method: 'interview',
          validation_required: true
        },
        {
          name: "Reference Verification",
          type: 'management_assessment',
          priority: 'high',
          data_points: ['peer_references', 'board_feedback', 'employee_feedback', 'customer_testimonials'],
          collection_method: 'interview',
          validation_required: true
        },
        {
          name: "Performance Metrics",
          type: 'operational_data',
          priority: 'medium',
          data_points: ['financial_performance_under_leadership', 'operational_improvements', 'growth_achievements'],
          collection_method: 'document_analysis',
          validation_required: false
        }
      ],
      analysis_output: {
        metrics: {
          leadership_experience_years: 'number',
          value_creation_track_record: 'number',
          crisis_management_score: 'number',
          strategic_execution_rating: 'number',
          team_development_index: 'number'
        },
        scores: {
          leadership_track_record_score: 88,
          execution_capability_score: 85,
          value_creation_score: 92
        },
        trends: {
          leadership_performance: 'positive',
          strategic_execution: 'positive',
          team_development: 'neutral'
        },
        benchmarks: {
          industry_leadership_standards: 'number',
          pe_management_benchmarks: 'array',
          executive_performance_norms: 'number'
        },
        risk_factors: ['Key person dependency', 'Leadership succession risk'],
        opportunities: ['Leadership development programs', 'Strategic capability enhancement'],
        key_insights: ['Proven track record of value creation', 'Strong crisis management capabilities'],
        confidence_level: 90,
        data_completeness: 85
      },
      user_insights: {
        dashboard_widgets: ['Leadership Track Record Score', 'Value Creation History', 'Executive Performance Timeline', 'Reference Validation'],
        key_alerts: ['Leadership transition risk', 'Performance trend concerns'],
        actionable_recommendations: ['Strengthen succession planning', 'Document leadership processes', 'Enhance strategic capabilities'],
        visual_components: ['Leadership timeline chart', 'Performance track record graph', 'Reference validation matrix'],
        drill_down_capabilities: ['Individual executive analysis', 'Performance period breakdown', 'Reference detail view'],
        comparison_benchmarks: ['Industry leadership standards', 'PE executive benchmarks', 'Best-in-class leadership']
      },
      engine_responsibility: 'leadership-assessment-engine',
      regional_considerations: ['Local leadership styles', 'Regional business practices', 'Cultural leadership expectations'],
      data_quality_requirements: {
        minimum_data_age: 360,
        required_data_points: ['executive_history', 'performance_records', 'reference_validations'],
        validation_rules: ['Leadership history must be verified', 'References must be contacted directly']
      }
    },
    {
      name: "Organizational Strength",
      description: "Team depth, talent quality, culture assessment, and organizational capabilities",
      weight: 30,
      data_sources: [
        {
          name: "Organizational Assessment",
          type: 'operational_data',
          priority: 'high',
          data_points: ['organizational_structure', 'team_depth', 'talent_quality', 'succession_planning', 'culture_strength'],
          collection_method: 'survey',
          validation_required: true
        },
        {
          name: "Talent Metrics",
          type: 'operational_data',
          priority: 'medium',
          data_points: ['retention_rates', 'employee_satisfaction', 'development_programs', 'recruitment_effectiveness'],
          collection_method: 'api_integration',
          validation_required: false
        },
        {
          name: "Culture Assessment",
          type: 'management_assessment',
          priority: 'medium',
          data_points: ['cultural_values', 'employee_engagement', 'change_readiness', 'innovation_culture'],
          collection_method: 'survey',
          validation_required: false
        }
      ],
      analysis_output: {
        metrics: {
          organizational_depth_score: 'number',
          talent_quality_index: 'number',
          culture_strength_rating: 'number',
          retention_rate: 'number',
          succession_readiness: 'number'
        },
        scores: {
          organizational_strength_score: 78,
          talent_quality_score: 82,
          culture_score: 75
        },
        trends: {
          organizational_development: 'positive',
          talent_retention: 'neutral',
          culture_evolution: 'positive'
        },
        benchmarks: {
          industry_organizational_norms: 'number',
          talent_benchmarks: 'array',
          culture_standards: 'number'
        },
        risk_factors: ['Organizational dependency risks', 'Talent retention challenges'],
        opportunities: ['Organizational development', 'Talent enhancement programs'],
        key_insights: ['Strong organizational foundation', 'Good talent retention and development'],
        confidence_level: 75,
        data_completeness: 80
      },
      user_insights: {
        dashboard_widgets: ['Organizational Strength Score', 'Talent Quality Index', 'Culture Assessment', 'Succession Planning Status'],
        key_alerts: ['High turnover in key positions', 'Culture misalignment detected'],
        actionable_recommendations: ['Strengthen organizational depth', 'Enhance talent development', 'Improve culture alignment'],
        visual_components: ['Organizational chart visualization', 'Talent pipeline diagram', 'Culture assessment radar'],
        drill_down_capabilities: ['Department-level analysis', 'Individual talent assessment', 'Culture dimension breakdown'],
        comparison_benchmarks: ['Industry organizational standards', 'Talent management benchmarks', 'Culture best practices']
      },
      engine_responsibility: 'organizational-assessment-engine',
      regional_considerations: ['Local talent markets', 'Regional organizational practices', 'Cultural organizational norms'],
      data_quality_requirements: {
        minimum_data_age: 180,
        required_data_points: ['org_charts', 'talent_metrics', 'culture_surveys'],
        validation_rules: ['Organizational data must be current', 'Culture assessments must be comprehensive']
      }
    },
    {
      name: "Strategic Vision",
      description: "Strategic planning capability, vision clarity, and execution track record",
      weight: 30,
      data_sources: [
        {
          name: "Strategic Planning Assessment",
          type: 'management_assessment',
          priority: 'high',
          data_points: ['strategic_planning_process', 'vision_clarity', 'goal_setting', 'strategic_thinking', 'adaptation_capability'],
          collection_method: 'document_analysis',
          validation_required: true
        },
        {
          name: "Execution Track Record",
          type: 'operational_data',
          priority: 'high',
          data_points: ['strategic_initiative_success', 'goal_achievement_rate', 'timeline_adherence', 'resource_allocation'],
          collection_method: 'document_analysis',
          validation_required: true
        },
        {
          name: "Innovation Assessment",
          type: 'management_assessment',
          priority: 'medium',
          data_points: ['innovation_mindset', 'change_management', 'future_planning', 'market_anticipation'],
          collection_method: 'interview',
          validation_required: false
        }
      ],
      analysis_output: {
        metrics: {
          strategic_vision_clarity: 'number',
          planning_quality_score: 'number',
          execution_success_rate: 'number',
          innovation_index: 'number',
          adaptability_rating: 'number'
        },
        scores: {
          strategic_vision_score: 85,
          planning_execution_score: 88,
          innovation_score: 75
        },
        trends: {
          strategic_execution: 'positive',
          planning_quality: 'positive',
          innovation_capability: 'neutral'
        },
        benchmarks: {
          strategic_planning_standards: 'number',
          execution_benchmarks: 'array',
          innovation_norms: 'number'
        },
        risk_factors: ['Strategic execution risks', 'Vision-reality gap'],
        opportunities: ['Strategic planning enhancement', 'Innovation capability development'],
        key_insights: ['Clear strategic vision with strong execution', 'Good strategic planning capabilities'],
        confidence_level: 82,
        data_completeness: 78
      },
      user_insights: {
        dashboard_widgets: ['Strategic Vision Score', 'Execution Success Rate', 'Planning Quality Index', 'Innovation Capability'],
        key_alerts: ['Strategic initiative delays', 'Vision clarity concerns'],
        actionable_recommendations: ['Enhance strategic planning', 'Improve execution processes', 'Strengthen innovation capabilities'],
        visual_components: ['Strategic vision dashboard', 'Execution timeline chart', 'Innovation capability radar'],
        drill_down_capabilities: ['Strategic initiative tracking', 'Planning process analysis', 'Innovation project details'],
        comparison_benchmarks: ['Strategic planning best practices', 'Execution excellence standards', 'Innovation benchmarks']
      },
      engine_responsibility: 'strategic-assessment-engine',
      regional_considerations: ['Local strategic practices', 'Regional market dynamics', 'Cultural strategic approaches'],
      data_quality_requirements: {
        minimum_data_age: 180,
        required_data_points: ['strategic_plans', 'execution_records', 'innovation_initiatives'],
        validation_rules: ['Strategic documents must be recent', 'Execution data must be verified']
      }
    }
  ],
  category_insights: {
    summary_metrics: ['Management Quality Index', 'Leadership Effectiveness Score', 'Organizational Capability Rating'],
    risk_indicators: ['Leadership transition risks', 'Organizational dependency risks', 'Strategic execution risks'],
    value_creation_levers: ['Leadership development', 'Organizational strengthening', 'Strategic capability enhancement']
  }
};

/**
 * CATEGORY 5: GROWTH POTENTIAL (5% weight)
 * Focus: Market expansion, value creation initiatives, exit strategy potential
 */
const PE_GROWTH_POTENTIAL: PECategoryBlueprint = {
  name: "Growth Potential",
  description: "Assessment of growth opportunities, value creation levers, and expansion potential",
  total_weight: 5,
  subcategories: [
    {
      name: "Market Expansion Opportunities",
      description: "Geographic expansion, new market entry, and growth runway analysis",
      weight: 35,
      data_sources: [
        {
          name: "Market Expansion Analysis",
          type: 'market_research',
          priority: 'high',
          data_points: ['geographic_expansion_potential', 'new_market_opportunities', 'market_size_analysis', 'entry_barriers', 'competitive_landscape'],
          collection_method: 'third_party_data',
          validation_required: false
        },
        {
          name: "Growth Strategy Assessment",
          type: 'management_assessment',
          priority: 'medium',
          data_points: ['expansion_plans', 'growth_strategy', 'resource_requirements', 'timeline_feasibility'],
          collection_method: 'document_analysis',
          validation_required: false
        },
        {
          name: "Market Entry Feasibility",
          type: 'market_research',
          priority: 'medium',
          data_points: ['regulatory_requirements', 'market_readiness', 'customer_demand', 'infrastructure_needs'],
          collection_method: 'web_scraping',
          validation_required: false
        }
      ],
      analysis_output: {
        metrics: {
          market_expansion_potential: 'number',
          addressable_market_size: 'number',
          entry_barrier_score: 'number',
          expansion_timeline: 'number',
          resource_requirement_estimate: 'number'
        },
        scores: {
          expansion_opportunity_score: 75,
          market_attractiveness_score: 82,
          execution_feasibility_score: 70
        },
        trends: {
          market_growth: 'positive',
          expansion_readiness: 'neutral',
          competitive_dynamics: 'neutral'
        },
        benchmarks: {
          industry_expansion_rates: 'number',
          market_entry_success_rates: 'array',
          expansion_investment_norms: 'number'
        },
        risk_factors: ['Market entry execution risk', 'Competitive response risk'],
        opportunities: ['Geographic market expansion', 'Adjacent market entry'],
        key_insights: ['Significant expansion opportunities identified', 'Strong market demand in target regions'],
        confidence_level: 70,
        data_completeness: 75
      },
      user_insights: {
        dashboard_widgets: ['Market Expansion Score', 'Opportunity Pipeline', 'Market Attractiveness Matrix', 'Expansion Timeline'],
        key_alerts: ['New market opportunity identified', 'Expansion window closing'],
        actionable_recommendations: ['Develop expansion strategy', 'Assess market entry requirements', 'Evaluate competitive positioning'],
        visual_components: ['Market opportunity map', 'Expansion feasibility matrix', 'Growth timeline chart'],
        drill_down_capabilities: ['Market-by-market analysis', 'Expansion scenario modeling', 'Competitive response scenarios'],
        comparison_benchmarks: ['Industry expansion benchmarks', 'Market entry success rates', 'Growth investment standards']
      },
      engine_responsibility: 'growth-opportunity-engine',
      regional_considerations: ['Local market conditions', 'Regional expansion patterns', 'Cultural market factors'],
      data_quality_requirements: {
        minimum_data_age: 180,
        required_data_points: ['market_research', 'expansion_plans', 'competitive_analysis'],
        validation_rules: ['Market data must be current', 'Expansion plans must be documented']
      }
    },
    {
      name: "Value Creation Initiatives",
      description: "Operational improvements, cost optimization, and value enhancement opportunities",
      weight: 35,
      data_sources: [
        {
          name: "Value Creation Assessment",
          type: 'operational_data',
          priority: 'high',
          data_points: ['operational_improvement_potential', 'cost_optimization_opportunities', 'revenue_enhancement', 'efficiency_gains'],
          collection_method: 'document_analysis',
          validation_required: true
        },
        {
          name: "Operational Leverage Analysis",
          type: 'operational_data',
          priority: 'medium',
          data_points: ['scalability_potential', 'automation_opportunities', 'process_optimization', 'technology_leverage'],
          collection_method: 'survey',
          validation_required: false
        },
        {
          name: "Financial Engineering Assessment",
          type: 'financial_statements',
          priority: 'medium',
          data_points: ['capital_structure_optimization', 'working_capital_improvement', 'tax_optimization', 'cash_flow_enhancement'],
          collection_method: 'document_analysis',
          validation_required: false
        }
      ],
      analysis_output: {
        metrics: {
          value_creation_potential: 'number',
          operational_improvement_score: 'number',
          cost_reduction_opportunity: 'number',
          revenue_enhancement_potential: 'number',
          efficiency_gain_estimate: 'number'
        },
        scores: {
          value_creation_score: 85,
          operational_leverage_score: 78,
          financial_optimization_score: 82
        },
        trends: {
          value_creation_progress: 'positive',
          operational_efficiency: 'positive',
          financial_optimization: 'neutral'
        },
        benchmarks: {
          pe_value_creation_norms: 'number',
          operational_improvement_standards: 'array',
          financial_optimization_benchmarks: 'number'
        },
        risk_factors: ['Execution complexity risk', 'Value creation timeline risk'],
        opportunities: ['Operational efficiency programs', 'Revenue optimization initiatives'],
        key_insights: ['Significant value creation potential identified', 'Multiple operational improvement levers available'],
        confidence_level: 85,
        data_completeness: 88
      },
      user_insights: {
        dashboard_widgets: ['Value Creation Score', 'Improvement Opportunity Pipeline', 'Operational Leverage Index', 'ROI Projections'],
        key_alerts: ['Value creation opportunity identified', 'Implementation timeline critical'],
        actionable_recommendations: ['Prioritize high-impact initiatives', 'Develop implementation roadmap', 'Allocate resources for value creation'],
        visual_components: ['Value creation waterfall', 'Opportunity prioritization matrix', 'Implementation timeline'],
        drill_down_capabilities: ['Initiative-by-initiative analysis', 'ROI scenario modeling', 'Implementation risk assessment'],
        comparison_benchmarks: ['PE value creation standards', 'Operational improvement benchmarks', 'Financial optimization norms']
      },
      engine_responsibility: 'value-creation-engine',
      regional_considerations: ['Local operational practices', 'Regional cost structures', 'Cultural change management'],
      data_quality_requirements: {
        minimum_data_age: 90,
        required_data_points: ['operational_data', 'financial_statements', 'improvement_assessments'],
        validation_rules: ['Value creation assessments must be detailed', 'Financial data must be current']
      }
    },
    {
      name: "Exit Strategy Potential",
      description: "Exit pathway analysis, valuation potential, and timing optimization",
      weight: 30,
      data_sources: [
        {
          name: "Exit Strategy Analysis",
          type: 'market_research',
          priority: 'high',
          data_points: ['exit_pathways', 'strategic_buyer_landscape', 'ipo_feasibility', 'market_timing', 'valuation_potential'],
          collection_method: 'third_party_data',
          validation_required: false
        },
        {
          name: "Valuation Assessment",
          type: 'financial_statements',
          priority: 'high',
          data_points: ['comparable_transactions', 'valuation_multiples', 'growth_trajectory', 'profitability_trends'],
          collection_method: 'third_party_data',
          validation_required: true
        },
        {
          name: "Market Conditions Analysis",
          type: 'market_research',
          priority: 'medium',
          data_points: ['market_sentiment', 'industry_dynamics', 'regulatory_environment', 'competitive_landscape'],
          collection_method: 'web_scraping',
          validation_required: false
        }
      ],
      analysis_output: {
        metrics: {
          exit_pathway_viability: 'number',
          valuation_multiple_potential: 'number',
          market_timing_score: 'number',
          exit_readiness_rating: 'number',
          buyer_interest_level: 'number'
        },
        scores: {
          exit_potential_score: 82,
          valuation_attractiveness_score: 88,
          market_timing_score: 75
        },
        trends: {
          exit_market_conditions: 'positive',
          valuation_multiples: 'positive',
          buyer_interest: 'neutral'
        },
        benchmarks: {
          industry_exit_multiples: 'number',
          comparable_exit_timelines: 'array',
          market_exit_success_rates: 'number'
        },
        risk_factors: ['Market timing risk', 'Valuation volatility risk'],
        opportunities: ['Strategic exit optimization', 'Value maximization initiatives'],
        key_insights: ['Multiple viable exit pathways identified', 'Strong valuation potential in current market'],
        confidence_level: 78,
        data_completeness: 80
      },
      user_insights: {
        dashboard_widgets: ['Exit Potential Score', 'Valuation Multiple Trend', 'Exit Timeline Optimizer', 'Buyer Landscape Map'],
        key_alerts: ['Optimal exit window identified', 'Market conditions deteriorating'],
        actionable_recommendations: ['Optimize exit strategy', 'Prepare for strategic alternatives', 'Maximize valuation potential'],
        visual_components: ['Exit pathway comparison', 'Valuation trend analysis', 'Market timing dashboard'],
        drill_down_capabilities: ['Exit scenario modeling', 'Buyer-by-buyer analysis', 'Valuation sensitivity analysis'],
        comparison_benchmarks: ['Industry exit benchmarks', 'Comparable transaction analysis', 'Market timing indicators']
      },
      engine_responsibility: 'exit-strategy-engine',
      regional_considerations: ['Local exit markets', 'Regional buyer preferences', 'Cultural exit practices'],
      data_quality_requirements: {
        minimum_data_age: 60,
        required_data_points: ['market_data', 'comparable_transactions', 'buyer_landscape'],
        validation_rules: ['Market data must be current', 'Transaction comps must be relevant']
      }
    }
  ],
  category_insights: {
    summary_metrics: ['Growth Potential Index', 'Value Creation Score', 'Exit Readiness Rating'],
    risk_indicators: ['Growth execution risks', 'Value creation timeline risks', 'Exit market risks'],
    value_creation_levers: ['Market expansion initiatives', 'Operational improvement programs', 'Exit optimization strategies']
  }
};

/**
 * CATEGORY 6: STRATEGIC FIT (5% weight)
 * Focus: Fund alignment, portfolio synergies, risk-return profile
 */
const PE_STRATEGIC_FIT: PECategoryBlueprint = {
  name: "Strategic Fit",
  description: "Assessment of investment alignment with fund strategy, portfolio synergies, and risk-return profile",
  total_weight: 5,
  subcategories: [
    {
      name: "Fund Strategy Alignment",
      description: "Investment thesis alignment, mandate fit, and strategic objective matching",
      weight: 40,
      data_sources: [
        {
          name: "Fund Strategy Assessment",
          type: 'management_assessment',
          priority: 'critical',
          data_points: ['investment_thesis_alignment', 'fund_mandate_fit', 'strategic_objectives', 'investment_criteria_match', 'risk_appetite_alignment'],
          collection_method: 'document_analysis',
          validation_required: true
        },
        {
          name: "Investment Criteria Analysis",
          type: 'management_assessment',
          priority: 'high',
          data_points: ['sector_focus_alignment', 'size_criteria_fit', 'geography_match', 'stage_appropriateness'],
          collection_method: 'document_analysis',
          validation_required: true
        },
        {
          name: "Strategic Objective Mapping",
          type: 'management_assessment',
          priority: 'medium',
          data_points: ['value_creation_approach', 'hold_period_alignment', 'return_expectations', 'exit_strategy_fit'],
          collection_method: 'document_analysis',
          validation_required: false
        }
      ],
      analysis_output: {
        metrics: {
          thesis_alignment_score: 'number',
          mandate_fit_rating: 'number',
          criteria_match_percentage: 'number',
          strategic_alignment_index: 'number',
          risk_appetite_match: 'number'
        },
        scores: {
          fund_alignment_score: 92,
          strategic_fit_score: 88,
          investment_criteria_score: 95
        },
        trends: {
          strategic_alignment: 'positive',
          mandate_adherence: 'positive',
          criteria_evolution: 'neutral'
        },
        benchmarks: {
          fund_strategy_standards: 'number',
          investment_criteria_norms: 'array',
          strategic_alignment_benchmarks: 'number'
        },
        risk_factors: ['Strategy drift risk', 'Mandate deviation risk'],
        opportunities: ['Strategic positioning optimization', 'Value creation alignment'],
        key_insights: ['Strong alignment with fund investment thesis', 'Excellent fit with investment mandate'],
        confidence_level: 95,
        data_completeness: 92
      },
      user_insights: {
        dashboard_widgets: ['Fund Alignment Score', 'Mandate Fit Analysis', 'Criteria Match Dashboard', 'Strategic Alignment Matrix'],
        key_alerts: ['Strategy misalignment detected', 'Mandate deviation risk'],
        actionable_recommendations: ['Optimize strategic positioning', 'Align value creation approach', 'Enhance mandate fit'],
        visual_components: ['Alignment scorecard', 'Mandate fit radar', 'Strategic positioning map'],
        drill_down_capabilities: ['Criteria-by-criteria analysis', 'Strategic dimension breakdown', 'Alignment trend analysis'],
        comparison_benchmarks: ['Fund strategy standards', 'Investment mandate benchmarks', 'Strategic fit best practices']
      },
      engine_responsibility: 'fund-alignment-engine',
      regional_considerations: ['Local fund strategies', 'Regional investment preferences', 'Cultural strategic approaches'],
      data_quality_requirements: {
        minimum_data_age: 90,
        required_data_points: ['fund_strategy_documents', 'investment_criteria', 'mandate_specifications'],
        validation_rules: ['Strategy alignment must be documented', 'Criteria match must be quantified']
      }
    },
    {
      name: "Portfolio Synergies",
      description: "Cross-portfolio value creation, operational synergies, and strategic leverage opportunities",
      weight: 30,
      data_sources: [
        {
          name: "Portfolio Synergy Analysis",
          type: 'operational_data',
          priority: 'high',
          data_points: ['portfolio_company_synergies', 'cross_selling_opportunities', 'operational_leverage', 'shared_services', 'knowledge_transfer'],
          collection_method: 'document_analysis',
          validation_required: false
        },
        {
          name: "Strategic Leverage Assessment",
          type: 'management_assessment',
          priority: 'medium',
          data_points: ['platform_building_potential', 'bolt_on_opportunities', 'market_consolidation', 'competitive_advantages'],
          collection_method: 'document_analysis',
          validation_required: false
        },
        {
          name: "Cross-Portfolio Value Creation",
          type: 'operational_data',
          priority: 'medium',
          data_points: ['best_practice_sharing', 'talent_exchange', 'technology_leverage', 'market_intelligence_sharing'],
          collection_method: 'survey',
          validation_required: false
        }
      ],
      analysis_output: {
        metrics: {
          synergy_potential_score: 'number',
          cross_selling_opportunity: 'number',
          operational_leverage_rating: 'number',
          knowledge_transfer_potential: 'number',
          platform_building_score: 'number'
        },
        scores: {
          portfolio_synergy_score: 75,
          strategic_leverage_score: 82,
          cross_value_creation_score: 78
        },
        trends: {
          synergy_development: 'positive',
          leverage_utilization: 'neutral',
          value_creation: 'positive'
        },
        benchmarks: {
          portfolio_synergy_norms: 'number',
          cross_value_standards: 'array',
          strategic_leverage_benchmarks: 'number'
        },
        risk_factors: ['Synergy execution risk', 'Portfolio integration complexity'],
        opportunities: ['Cross-portfolio initiatives', 'Strategic leverage optimization'],
        key_insights: ['Significant synergy potential with existing portfolio', 'Strong platform building opportunity'],
        confidence_level: 72,
        data_completeness: 70
      },
      user_insights: {
        dashboard_widgets: ['Portfolio Synergy Score', 'Cross-Selling Pipeline', 'Strategic Leverage Map', 'Value Creation Opportunities'],
        key_alerts: ['Synergy opportunity identified', 'Integration complexity warning'],
        actionable_recommendations: ['Develop synergy roadmap', 'Implement cross-portfolio initiatives', 'Optimize strategic leverage'],
        visual_components: ['Portfolio synergy network', 'Value creation flowchart', 'Strategic leverage matrix'],
        drill_down_capabilities: ['Company-by-company synergy analysis', 'Initiative tracking', 'Value quantification'],
        comparison_benchmarks: ['Portfolio synergy standards', 'Cross-value creation benchmarks', 'Strategic leverage norms']
      },
      engine_responsibility: 'portfolio-synergy-engine',
      regional_considerations: ['Local portfolio dynamics', 'Regional synergy patterns', 'Cultural integration factors'],
      data_quality_requirements: {
        minimum_data_age: 120,
        required_data_points: ['portfolio_company_data', 'synergy_assessments', 'value_creation_plans'],
        validation_rules: ['Portfolio data must be comprehensive', 'Synergy potential must be quantified']
      }
    },
    {
      name: "Risk-Return Profile",
      description: "Investment risk assessment, return potential, and portfolio balance optimization",
      weight: 30,
      data_sources: [
        {
          name: "Risk Assessment",
          type: 'financial_statements',
          priority: 'critical',
          data_points: ['investment_risk_profile', 'volatility_metrics', 'downside_protection', 'risk_factors', 'mitigation_strategies'],
          collection_method: 'document_analysis',
          validation_required: true
        },
        {
          name: "Return Analysis",
          type: 'financial_statements',
          priority: 'critical',
          data_points: ['return_potential', 'cash_flow_projections', 'exit_value_scenarios', 'irr_projections', 'multiple_expectations'],
          collection_method: 'document_analysis',
          validation_required: true
        },
        {
          name: "Portfolio Balance Assessment",
          type: 'management_assessment',
          priority: 'medium',
          data_points: ['portfolio_diversification', 'correlation_analysis', 'concentration_risk', 'balance_optimization'],
          collection_method: 'document_analysis',
          validation_required: false
        }
      ],
      analysis_output: {
        metrics: {
          risk_adjusted_return: 'number',
          volatility_score: 'number',
          downside_protection_rating: 'number',
          return_potential_score: 'number',
          portfolio_balance_index: 'number'
        },
        scores: {
          risk_return_score: 85,
          risk_management_score: 88,
          return_potential_score: 82
        },
        trends: {
          risk_profile: 'neutral',
          return_expectations: 'positive',
          portfolio_balance: 'positive'
        },
        benchmarks: {
          pe_risk_return_standards: 'number',
          fund_return_benchmarks: 'array',
          portfolio_balance_norms: 'number'
        },
        risk_factors: ['Market volatility risk', 'Concentration risk'],
        opportunities: ['Risk-adjusted return optimization', 'Portfolio balance enhancement'],
        key_insights: ['Attractive risk-adjusted return profile', 'Good portfolio diversification contribution'],
        confidence_level: 88,
        data_completeness: 85
      },
      user_insights: {
        dashboard_widgets: ['Risk-Return Score', 'Volatility Analysis', 'Portfolio Balance', 'Return Projections'],
        key_alerts: ['Risk threshold exceeded', 'Portfolio concentration warning'],
        actionable_recommendations: ['Optimize risk-return balance', 'Enhance downside protection', 'Improve portfolio diversification'],
        visual_components: ['Risk-return scatter plot', 'Portfolio balance chart', 'Return scenario analysis'],
        drill_down_capabilities: ['Risk factor analysis', 'Return scenario modeling', 'Portfolio impact assessment'],
        comparison_benchmarks: ['PE risk-return standards', 'Fund performance benchmarks', 'Portfolio balance norms']
      },
      engine_responsibility: 'risk-return-engine',
      regional_considerations: ['Local risk factors', 'Regional return expectations', 'Cultural risk preferences'],
      data_quality_requirements: {
        minimum_data_age: 90,
        required_data_points: ['risk_assessments', 'return_projections', 'portfolio_data'],
        validation_rules: ['Risk analysis must be comprehensive', 'Return projections must be detailed']
      }
    }
  ],
  category_insights: {
    summary_metrics: ['Strategic Fit Index', 'Fund Alignment Score', 'Portfolio Contribution Rating'],
    risk_indicators: ['Strategic misalignment risks', 'Portfolio concentration risks', 'Risk-return imbalance'],
    value_creation_levers: ['Strategic alignment optimization', 'Portfolio synergy realization', 'Risk-return enhancement']
  }
};

/**
 * COMPLETE PE DEAL ANALYSIS BLUEPRINT
 */
export const PE_DEAL_ANALYSIS_BLUEPRINT: PECategoryBlueprint[] = [
  PE_FINANCIAL_PERFORMANCE,
  PE_OPERATIONAL_EXCELLENCE, 
  PE_MARKET_POSITION,
  PE_MANAGEMENT_QUALITY,
  PE_GROWTH_POTENTIAL,
  PE_STRATEGIC_FIT
];

/**
 * ENGINE RESPONSIBILITY MAPPING FOR PE ANALYSIS
 */
export const PE_ENGINE_SUBCATEGORY_MAPPING: Record<string, string[]> = {
  'financial-engine': [
    'Revenue Quality',
    'Profitability Analysis', 
    'Cash Management'
  ],
  'team-research-engine': [
    'Management Team Strength'
  ],
  'operational-intelligence-engine': [
    'Operational Efficiency'
  ],
  'technology-assessment-engine': [
    'Technology & Systems'
  ],
  'market-intelligence-engine': [
    'Market Share & Position'
  ],
  'competitive-intelligence-engine': [
    'Competitive Advantages'
  ],
  'customer-intelligence-engine': [
    'Customer Base Quality'
  ],
  'leadership-assessment-engine': [
    'Leadership Track Record'
  ],
  'organizational-assessment-engine': [
    'Organizational Strength'
  ],
  'strategic-assessment-engine': [
    'Strategic Vision'
  ],
  'growth-opportunity-engine': [
    'Market Expansion Opportunities'
  ],
  'value-creation-engine': [
    'Value Creation Initiatives'
  ],
  'exit-strategy-engine': [
    'Exit Strategy Potential'
  ],
  'fund-alignment-engine': [
    'Fund Strategy Alignment'
  ],
  'portfolio-synergy-engine': [
    'Portfolio Synergies'
  ],
  'risk-return-engine': [
    'Risk-Return Profile'
  ]
};

/**
 * PE ANALYSIS QUALITY FRAMEWORK
 */
export const PE_DATA_QUALITY_FRAMEWORK = {
  minimum_data_completeness: 75,
  critical_data_age_threshold: 90, // days
  validation_requirements: {
    financial_data: 'audited_or_reviewed',
    management_assessment: 'verified_references',
    market_data: 'credible_sources',
    operational_data: 'current_systems'
  },
  confidence_thresholds: {
    high: 85,
    medium: 70,
    low: 50
  }
};

/**
 * REGIONAL ANALYSIS CONSIDERATIONS FOR PE
 */
export const PE_REGIONAL_FACTORS = {
  north_america: ['SEC compliance', 'GAAP standards', 'US market dynamics'],
  europe: ['IFRS standards', 'GDPR compliance', 'EU market regulations'],
  asia_pacific: ['Local accounting standards', 'Regulatory variations', 'Cultural factors'],
  emerging_markets: ['Currency volatility', 'Political risk', 'Market development']
};

/**
 * PE BLUEPRINT UTILITY FUNCTIONS
 */

export function getPESubcategoryBlueprint(categoryName: string, subcategoryName: string): PESubcategoryBlueprint | undefined {
  const category = PE_DEAL_ANALYSIS_BLUEPRINT.find(cat => cat.name === categoryName);
  return category?.subcategories.find(sub => sub.name === subcategoryName);
}

export function getPECategoryBlueprint(categoryName: string): PECategoryBlueprint | undefined {
  return PE_DEAL_ANALYSIS_BLUEPRINT.find(cat => cat.name === categoryName);
}

export function getPEEngineResponsibilities(engineName: string): string[] {
  return PE_ENGINE_SUBCATEGORY_MAPPING[engineName] || [];
}

export function validatePEAnalysisCompleteness(analysisData: any): {
  completeness_score: number;
  missing_subcategories: string[];
  data_quality_issues: string[];
} {
  const allSubcategories = PE_DEAL_ANALYSIS_BLUEPRINT.flatMap(cat => 
    cat.subcategories.map(sub => sub.name)
  );
  
  const providedSubcategories = Object.keys(analysisData);
  const missingSubcategories = allSubcategories.filter(sub => 
    !providedSubcategories.includes(sub)
  );
  
  const completenessScore = (providedSubcategories.length / allSubcategories.length) * 100;
  
  const dataQualityIssues: string[] = [];
  // Add data quality validation logic here
  
  return {
    completeness_score: completenessScore,
    missing_subcategories: missingSubcategories,
    data_quality_issues: dataQualityIssues
  };
}

/**
 * PE ANALYSIS BLUEPRINT EXPORT
 */
export default {
  blueprint: PE_DEAL_ANALYSIS_BLUEPRINT,
  engine_mapping: PE_ENGINE_SUBCATEGORY_MAPPING,
  quality_framework: PE_DATA_QUALITY_FRAMEWORK,
  regional_factors: PE_REGIONAL_FACTORS,
  utilities: {
    getPESubcategoryBlueprint,
    getPECategoryBlueprint,
    getPEEngineResponsibilities,
    validatePEAnalysisCompleteness
  }
};