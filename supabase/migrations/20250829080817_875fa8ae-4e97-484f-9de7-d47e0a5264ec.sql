-- Create centralized data points tables for VC and PE analysis

-- VC Data Points Table
CREATE TABLE public.deal_analysis_datapoints_vc (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL,
  fund_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  
  -- Market Opportunity Data Points
  geography TEXT,
  industry_focus TEXT,
  investment_size BIGINT,
  quality_score INTEGER,
  key_signals TEXT[],
  tam BIGINT,
  sam BIGINT,
  som BIGINT,
  cagr NUMERIC,
  growth_drivers TEXT[],
  market_share_distribution JSONB,
  key_market_players TEXT[],
  whitespace_opportunities TEXT[],
  market_cycle TEXT,
  economic_sensitivity TEXT,
  investment_climate TEXT,
  regulatory_timeline TEXT,
  competitive_window TEXT,
  addressable_customers BIGINT,
  
  -- Traction & Performance Data Points
  cac_trend NUMERIC,
  ltv_cac_ratio NUMERIC,
  retention_rate NUMERIC,
  channel_effectiveness JSONB,
  regulatory_requirements TEXT[],
  capital_requirements BIGINT,
  technology_moats TEXT[],
  distribution_challenges TEXT[],
  geographic_constraints TEXT[],
  
  -- Team & Leadership Data Points
  previous_roles JSONB,
  leadership_experience TEXT[],
  technical_skills TEXT[],
  market_knowledge TEXT[],
  innovation_record TEXT[],
  academic_background TEXT[],
  certifications TEXT[],
  thought_leadership TEXT[],
  exit_history JSONB,
  value_creation TEXT[],
  team_building TEXT[],
  skill_coverage JSONB,
  diversity_metrics JSONB,
  scalability_readiness TEXT,
  strategic_advisors TEXT[],
  investor_network TEXT[],
  partnership_ecosystem TEXT[],
  
  -- Product & Technology Data Points
  patent_portfolio_analysis JSONB,
  trade_secret_documentation TEXT[],
  ip_landscape_mapping JSONB,
  competitive_positioning_studies JSONB,
  ip_strength_scoring INTEGER,
  market_differentiation_analysis JSONB,
  competitive_moat_assessment JSONB,
  technology_readiness_level INTEGER,
  
  -- Financial Data Points
  revenue_statements JSONB,
  cash_flow_analysis JSONB,
  unit_economics_breakdown JSONB,
  customer_acquisition_metrics JSONB,
  growth_rate_analysis JSONB,
  profitability_metrics JSONB,
  capital_efficiency_ratios JSONB,
  market_traction_indicators JSONB,
  
  -- Metadata
  data_completeness_score INTEGER DEFAULT 0,
  last_updated_by UUID,
  source_engines TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- PE Data Points Table (specialized for Private Equity)
CREATE TABLE public.deal_analysis_datapoints_pe (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL,
  fund_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  
  -- Market & Strategic Data Points
  geography TEXT,
  industry_focus TEXT,
  investment_size BIGINT,
  quality_score INTEGER,
  key_signals TEXT[],
  market_position TEXT,
  competitive_advantages TEXT[],
  market_share NUMERIC,
  customer_concentration JSONB,
  supplier_relationships JSONB,
  distribution_channels JSONB,
  brand_strength INTEGER,
  
  -- Financial Performance Data Points
  revenue_growth_rate NUMERIC,
  ebitda_margin NUMERIC,
  ebitda_growth_rate NUMERIC,
  cash_flow_generation JSONB,
  working_capital_management JSONB,
  debt_capacity BIGINT,
  leverage_ratios JSONB,
  return_on_invested_capital NUMERIC,
  free_cash_flow_yield NUMERIC,
  historical_financial_performance JSONB,
  
  -- Operational Excellence Data Points
  operational_efficiency_metrics JSONB,
  cost_structure_analysis JSONB,
  margin_improvement_opportunities TEXT[],
  scalability_factors TEXT[],
  technology_infrastructure JSONB,
  process_optimization_potential TEXT[],
  automation_opportunities TEXT[],
  supply_chain_efficiency JSONB,
  
  -- Management & Governance Data Points
  management_quality_assessment JSONB,
  leadership_track_record JSONB,
  governance_structure JSONB,
  board_composition JSONB,
  management_incentives JSONB,
  organizational_capabilities TEXT[],
  talent_retention_metrics JSONB,
  succession_planning JSONB,
  
  -- Value Creation Data Points
  organic_growth_potential JSONB,
  acquisition_opportunities TEXT[],
  expansion_markets TEXT[],
  product_line_extensions TEXT[],
  pricing_optimization_potential NUMERIC,
  cost_reduction_opportunities JSONB,
  capital_allocation_efficiency JSONB,
  exit_strategy_options TEXT[],
  value_creation_timeline JSONB,
  risk_mitigation_strategies TEXT[],
  
  -- ESG & Regulatory Data Points
  esg_score INTEGER,
  regulatory_compliance JSONB,
  environmental_impact_assessment JSONB,
  social_responsibility_metrics JSONB,
  governance_best_practices JSONB,
  sustainability_initiatives TEXT[],
  
  -- Metadata
  data_completeness_score INTEGER DEFAULT 0,
  last_updated_by UUID,
  source_engines TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.deal_analysis_datapoints_vc ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_analysis_datapoints_pe ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for VC table
CREATE POLICY "Users can manage VC datapoints for accessible funds"
ON public.deal_analysis_datapoints_vc
FOR ALL
USING (organization_id = get_jwt_org_id())
WITH CHECK (organization_id = get_jwt_org_id());

CREATE POLICY "Super admins can manage all VC datapoints"
ON public.deal_analysis_datapoints_vc
FOR ALL
USING (is_super_admin_by_email())
WITH CHECK (is_super_admin_by_email());

CREATE POLICY "Services can manage VC datapoints"
ON public.deal_analysis_datapoints_vc
FOR ALL
USING (true)
WITH CHECK (true);

-- Create RLS policies for PE table
CREATE POLICY "Users can manage PE datapoints for accessible funds"
ON public.deal_analysis_datapoints_pe
FOR ALL
USING (organization_id = get_jwt_org_id())
WITH CHECK (organization_id = get_jwt_org_id());

CREATE POLICY "Super admins can manage all PE datapoints"
ON public.deal_analysis_datapoints_pe
FOR ALL
USING (is_super_admin_by_email())
WITH CHECK (is_super_admin_by_email());

CREATE POLICY "Services can manage PE datapoints"
ON public.deal_analysis_datapoints_pe
FOR ALL
USING (true)
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_deal_analysis_datapoints_vc_deal_id ON public.deal_analysis_datapoints_vc(deal_id);
CREATE INDEX idx_deal_analysis_datapoints_vc_fund_id ON public.deal_analysis_datapoints_vc(fund_id);
CREATE INDEX idx_deal_analysis_datapoints_vc_org_id ON public.deal_analysis_datapoints_vc(organization_id);
CREATE INDEX idx_deal_analysis_datapoints_vc_updated_at ON public.deal_analysis_datapoints_vc(updated_at);

CREATE INDEX idx_deal_analysis_datapoints_pe_deal_id ON public.deal_analysis_datapoints_pe(deal_id);
CREATE INDEX idx_deal_analysis_datapoints_pe_fund_id ON public.deal_analysis_datapoints_pe(fund_id);
CREATE INDEX idx_deal_analysis_datapoints_pe_org_id ON public.deal_analysis_datapoints_pe(organization_id);
CREATE INDEX idx_deal_analysis_datapoints_pe_updated_at ON public.deal_analysis_datapoints_pe(updated_at);

-- Create triggers for updated_at
CREATE TRIGGER update_deal_analysis_datapoints_vc_updated_at
    BEFORE UPDATE ON public.deal_analysis_datapoints_vc
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deal_analysis_datapoints_pe_updated_at
    BEFORE UPDATE ON public.deal_analysis_datapoints_pe
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();