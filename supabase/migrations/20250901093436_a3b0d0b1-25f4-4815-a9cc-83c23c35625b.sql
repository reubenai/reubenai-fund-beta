-- Create standardized status type if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'processing_status') THEN
    CREATE TYPE processing_status AS ENUM ('queued', 'processing', 'completed', 'failed', 'cancelled');
  END IF;
END $$;

-- 1. Perplexity Data Mining VC Table (Raw API responses)
CREATE TABLE public.perplexity_datamining_vc (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL,
  fund_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  category TEXT NOT NULL, -- e.g., 'founder_experience', 'market_size', etc.
  raw_perplexity_response JSONB NOT NULL DEFAULT '{}',
  query_prompt TEXT,
  response_confidence INTEGER CHECK (response_confidence >= 0 AND response_confidence <= 100),
  data_sources JSONB DEFAULT '[]',
  processing_status processing_status NOT NULL DEFAULT 'queued',
  error_message TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Perplexity Data Mining PE Table (Raw API responses)
CREATE TABLE public.perplexity_datamining_pe (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL,
  fund_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  category TEXT NOT NULL, -- e.g., 'revenue_growth', 'ebitda_margins', etc.
  raw_perplexity_response JSONB NOT NULL DEFAULT '{}',
  query_prompt TEXT,
  response_confidence INTEGER CHECK (response_confidence >= 0 AND response_confidence <= 100),
  data_sources JSONB DEFAULT '[]',
  processing_status processing_status NOT NULL DEFAULT 'queued',
  error_message TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Deal Datapoints VC Table (Structured data for 18 VC categories)
CREATE TABLE public.deal_datapoints_vc (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL,
  fund_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  
  -- VC-specific datapoints (18 categories)
  founder_experience JSONB,
  team_composition JSONB,
  vision_communication JSONB,
  market_size JSONB,
  market_timing JSONB,
  competitive_landscape JSONB,
  product_innovation JSONB,
  technology_advantage JSONB,
  product_market_fit JSONB,
  revenue_growth JSONB,
  customer_metrics JSONB,
  market_validation JSONB,
  financial_performance JSONB,
  capital_efficiency JSONB,
  financial_planning JSONB,
  portfolio_synergies JSONB,
  investment_thesis_alignment JSONB,
  value_creation_potential JSONB,
  
  -- Metadata
  data_completeness_score INTEGER DEFAULT 0 CHECK (data_completeness_score >= 0 AND data_completeness_score <= 100),
  confidence_level INTEGER DEFAULT 50 CHECK (confidence_level >= 0 AND confidence_level <= 100),
  source_engines TEXT[] DEFAULT '{}',
  processing_status processing_status NOT NULL DEFAULT 'queued',
  error_message TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Deal Datapoints PE Table (Structured data for 20 PE categories)
CREATE TABLE public.deal_datapoints_pe (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL,
  fund_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  
  -- PE-specific datapoints (20 categories)
  revenue_growth JSONB,
  ebitda_margins JSONB,
  cash_flow JSONB,
  market_share JSONB,
  competitive_moat JSONB,
  brand_strength JSONB,
  management_quality JSONB,
  operational_efficiency JSONB,
  systems_processes JSONB,
  organic_growth JSONB,
  acquisition_opportunities JSONB,
  market_expansion JSONB,
  industry_risk JSONB,
  regulatory_risk JSONB,
  execution_risk JSONB,
  market_cycle_timing JSONB,
  exit_timing_potential JSONB,
  corporate_governance JSONB,
  stakeholder_trust JSONB,
  esg_standards JSONB,
  
  -- Metadata
  data_completeness_score INTEGER DEFAULT 0 CHECK (data_completeness_score >= 0 AND data_completeness_score <= 100),
  confidence_level INTEGER DEFAULT 50 CHECK (confidence_level >= 0 AND confidence_level <= 100),
  source_engines TEXT[] DEFAULT '{}',
  processing_status processing_status NOT NULL DEFAULT 'queued',
  error_message TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Deal Analysis Result VC Table (Analysis results and scoring)
CREATE TABLE public.deal_analysisresult_vc (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL,
  fund_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  
  -- Category scores (18 VC categories)
  founder_experience_score INTEGER CHECK (founder_experience_score >= 0 AND founder_experience_score <= 100),
  team_composition_score INTEGER CHECK (team_composition_score >= 0 AND team_composition_score <= 100),
  vision_communication_score INTEGER CHECK (vision_communication_score >= 0 AND vision_communication_score <= 100),
  market_size_score INTEGER CHECK (market_size_score >= 0 AND market_size_score <= 100),
  market_timing_score INTEGER CHECK (market_timing_score >= 0 AND market_timing_score <= 100),
  competitive_landscape_score INTEGER CHECK (competitive_landscape_score >= 0 AND competitive_landscape_score <= 100),
  product_innovation_score INTEGER CHECK (product_innovation_score >= 0 AND product_innovation_score <= 100),
  technology_advantage_score INTEGER CHECK (technology_advantage_score >= 0 AND technology_advantage_score <= 100),
  product_market_fit_score INTEGER CHECK (product_market_fit_score >= 0 AND product_market_fit_score <= 100),
  revenue_growth_score INTEGER CHECK (revenue_growth_score >= 0 AND revenue_growth_score <= 100),
  customer_metrics_score INTEGER CHECK (customer_metrics_score >= 0 AND customer_metrics_score <= 100),
  market_validation_score INTEGER CHECK (market_validation_score >= 0 AND market_validation_score <= 100),
  financial_performance_score INTEGER CHECK (financial_performance_score >= 0 AND financial_performance_score <= 100),
  capital_efficiency_score INTEGER CHECK (capital_efficiency_score >= 0 AND capital_efficiency_score <= 100),
  financial_planning_score INTEGER CHECK (financial_planning_score >= 0 AND financial_planning_score <= 100),
  portfolio_synergies_score INTEGER CHECK (portfolio_synergies_score >= 0 AND portfolio_synergies_score <= 100),
  investment_thesis_alignment_score INTEGER CHECK (investment_thesis_alignment_score >= 0 AND investment_thesis_alignment_score <= 100),
  value_creation_potential_score INTEGER CHECK (value_creation_potential_score >= 0 AND value_creation_potential_score <= 100),
  
  -- Overall scores
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  confidence_score INTEGER DEFAULT 50 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  
  -- Analysis metadata
  analysis_summary TEXT,
  key_strengths TEXT[],
  key_concerns TEXT[],
  recommendations TEXT[],
  risk_factors JSONB DEFAULT '[]',
  model_executions JSONB DEFAULT '[]',
  processing_status processing_status NOT NULL DEFAULT 'queued',
  error_message TEXT,
  analyzed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Deal Analysis Result PE Table (Analysis results and scoring)
CREATE TABLE public.deal_analysisresult_pe (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL,
  fund_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  
  -- Category scores (20 PE categories)
  revenue_growth_score INTEGER CHECK (revenue_growth_score >= 0 AND revenue_growth_score <= 100),
  ebitda_margins_score INTEGER CHECK (ebitda_margins_score >= 0 AND ebitda_margins_score <= 100),
  cash_flow_score INTEGER CHECK (cash_flow_score >= 0 AND cash_flow_score <= 100),
  market_share_score INTEGER CHECK (market_share_score >= 0 AND market_share_score <= 100),
  competitive_moat_score INTEGER CHECK (competitive_moat_score >= 0 AND competitive_moat_score <= 100),
  brand_strength_score INTEGER CHECK (brand_strength_score >= 0 AND brand_strength_score <= 100),
  management_quality_score INTEGER CHECK (management_quality_score >= 0 AND management_quality_score <= 100),
  operational_efficiency_score INTEGER CHECK (operational_efficiency_score >= 0 AND operational_efficiency_score <= 100),
  systems_processes_score INTEGER CHECK (systems_processes_score >= 0 AND systems_processes_score <= 100),
  organic_growth_score INTEGER CHECK (organic_growth_score >= 0 AND organic_growth_score <= 100),
  acquisition_opportunities_score INTEGER CHECK (acquisition_opportunities_score >= 0 AND acquisition_opportunities_score <= 100),
  market_expansion_score INTEGER CHECK (market_expansion_score >= 0 AND market_expansion_score <= 100),
  industry_risk_score INTEGER CHECK (industry_risk_score >= 0 AND industry_risk_score <= 100),
  regulatory_risk_score INTEGER CHECK (regulatory_risk_score >= 0 AND regulatory_risk_score <= 100),
  execution_risk_score INTEGER CHECK (execution_risk_score >= 0 AND execution_risk_score <= 100),
  market_cycle_timing_score INTEGER CHECK (market_cycle_timing_score >= 0 AND market_cycle_timing_score <= 100),
  exit_timing_potential_score INTEGER CHECK (exit_timing_potential_score >= 0 AND exit_timing_potential_score <= 100),
  corporate_governance_score INTEGER CHECK (corporate_governance_score >= 0 AND corporate_governance_score <= 100),
  stakeholder_trust_score INTEGER CHECK (stakeholder_trust_score >= 0 AND stakeholder_trust_score <= 100),
  esg_standards_score INTEGER CHECK (esg_standards_score >= 0 AND esg_standards_score <= 100),
  
  -- Overall scores
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  confidence_score INTEGER DEFAULT 50 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  
  -- Analysis metadata
  analysis_summary TEXT,
  key_strengths TEXT[],
  key_concerns TEXT[],
  recommendations TEXT[],
  risk_factors JSONB DEFAULT '[]',
  model_executions JSONB DEFAULT '[]',
  processing_status processing_status NOT NULL DEFAULT 'queued',
  error_message TEXT,
  analyzed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_perplexity_datamining_vc_deal_id ON public.perplexity_datamining_vc(deal_id);
CREATE INDEX idx_perplexity_datamining_vc_status ON public.perplexity_datamining_vc(processing_status);
CREATE INDEX idx_perplexity_datamining_vc_org ON public.perplexity_datamining_vc(organization_id);

CREATE INDEX idx_perplexity_datamining_pe_deal_id ON public.perplexity_datamining_pe(deal_id);
CREATE INDEX idx_perplexity_datamining_pe_status ON public.perplexity_datamining_pe(processing_status);
CREATE INDEX idx_perplexity_datamining_pe_org ON public.perplexity_datamining_pe(organization_id);

CREATE INDEX idx_deal_datapoints_vc_deal_id ON public.deal_datapoints_vc(deal_id);
CREATE INDEX idx_deal_datapoints_vc_status ON public.deal_datapoints_vc(processing_status);
CREATE INDEX idx_deal_datapoints_vc_org ON public.deal_datapoints_vc(organization_id);

CREATE INDEX idx_deal_datapoints_pe_deal_id ON public.deal_datapoints_pe(deal_id);
CREATE INDEX idx_deal_datapoints_pe_status ON public.deal_datapoints_pe(processing_status);
CREATE INDEX idx_deal_datapoints_pe_org ON public.deal_datapoints_pe(organization_id);

CREATE INDEX idx_deal_analysisresult_vc_deal_id ON public.deal_analysisresult_vc(deal_id);
CREATE INDEX idx_deal_analysisresult_vc_status ON public.deal_analysisresult_vc(processing_status);
CREATE INDEX idx_deal_analysisresult_vc_org ON public.deal_analysisresult_vc(organization_id);

CREATE INDEX idx_deal_analysisresult_pe_deal_id ON public.deal_analysisresult_pe(deal_id);
CREATE INDEX idx_deal_analysisresult_pe_status ON public.deal_analysisresult_pe(processing_status);
CREATE INDEX idx_deal_analysisresult_pe_org ON public.deal_analysisresult_pe(organization_id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_perplexity_datamining_vc()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_updated_at_perplexity_datamining_pe()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_updated_at_deal_datapoints_vc()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_updated_at_deal_datapoints_pe()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_updated_at_deal_analysisresult_vc()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_updated_at_deal_analysisresult_pe()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the triggers
CREATE TRIGGER update_perplexity_datamining_vc_updated_at
  BEFORE UPDATE ON public.perplexity_datamining_vc
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_perplexity_datamining_vc();

CREATE TRIGGER update_perplexity_datamining_pe_updated_at
  BEFORE UPDATE ON public.perplexity_datamining_pe
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_perplexity_datamining_pe();

CREATE TRIGGER update_deal_datapoints_vc_updated_at
  BEFORE UPDATE ON public.deal_datapoints_vc
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_deal_datapoints_vc();

CREATE TRIGGER update_deal_datapoints_pe_updated_at
  BEFORE UPDATE ON public.deal_datapoints_pe
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_deal_datapoints_pe();

CREATE TRIGGER update_deal_analysisresult_vc_updated_at
  BEFORE UPDATE ON public.deal_analysisresult_vc
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_deal_analysisresult_vc();

CREATE TRIGGER update_deal_analysisresult_pe_updated_at
  BEFORE UPDATE ON public.deal_analysisresult_pe
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_deal_analysisresult_pe();

-- Create triggers to auto-populate organization_id from deals
CREATE OR REPLACE FUNCTION public.populate_organization_id_from_deal()
RETURNS TRIGGER AS $$
BEGIN
  SELECT f.organization_id INTO NEW.organization_id
  FROM public.deals d
  JOIN public.funds f ON d.fund_id = f.id
  WHERE d.id = NEW.deal_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Apply the organization_id population trigger to all tables
CREATE TRIGGER populate_perplexity_datamining_vc_org_id
  BEFORE INSERT ON public.perplexity_datamining_vc
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_organization_id_from_deal();

CREATE TRIGGER populate_perplexity_datamining_pe_org_id
  BEFORE INSERT ON public.perplexity_datamining_pe
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_organization_id_from_deal();

CREATE TRIGGER populate_deal_datapoints_vc_org_id
  BEFORE INSERT ON public.deal_datapoints_vc
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_organization_id_from_deal();

CREATE TRIGGER populate_deal_datapoints_pe_org_id
  BEFORE INSERT ON public.deal_datapoints_pe
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_organization_id_from_deal();

CREATE TRIGGER populate_deal_analysisresult_vc_org_id
  BEFORE INSERT ON public.deal_analysisresult_vc
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_organization_id_from_deal();

CREATE TRIGGER populate_deal_analysisresult_pe_org_id
  BEFORE INSERT ON public.deal_analysisresult_pe
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_organization_id_from_deal();

-- Enable Row Level Security
ALTER TABLE public.perplexity_datamining_vc ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perplexity_datamining_pe ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_datapoints_vc ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_datapoints_pe ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_analysisresult_vc ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_analysisresult_pe ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for organization isolation
CREATE POLICY "Users can manage Perplexity VC data for their org"
  ON public.perplexity_datamining_vc
  FOR ALL
  USING (organization_id = get_jwt_org_id())
  WITH CHECK (organization_id = get_jwt_org_id());

CREATE POLICY "Services can manage Perplexity VC data"
  ON public.perplexity_datamining_vc
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can manage Perplexity PE data for their org"
  ON public.perplexity_datamining_pe
  FOR ALL
  USING (organization_id = get_jwt_org_id())
  WITH CHECK (organization_id = get_jwt_org_id());

CREATE POLICY "Services can manage Perplexity PE data"
  ON public.perplexity_datamining_pe
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can manage VC datapoints for their org"
  ON public.deal_datapoints_vc
  FOR ALL
  USING (organization_id = get_jwt_org_id())
  WITH CHECK (organization_id = get_jwt_org_id());

CREATE POLICY "Services can manage VC datapoints"
  ON public.deal_datapoints_vc
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can manage PE datapoints for their org"
  ON public.deal_datapoints_pe
  FOR ALL
  USING (organization_id = get_jwt_org_id())
  WITH CHECK (organization_id = get_jwt_org_id());

CREATE POLICY "Services can manage PE datapoints"
  ON public.deal_datapoints_pe
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can manage VC analysis results for their org"
  ON public.deal_analysisresult_vc
  FOR ALL
  USING (organization_id = get_jwt_org_id())
  WITH CHECK (organization_id = get_jwt_org_id());

CREATE POLICY "Services can manage VC analysis results"
  ON public.deal_analysisresult_vc
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can manage PE analysis results for their org"
  ON public.deal_analysisresult_pe
  FOR ALL
  USING (organization_id = get_jwt_org_id())
  WITH CHECK (organization_id = get_jwt_org_id());

CREATE POLICY "Services can manage PE analysis results"
  ON public.deal_analysisresult_pe
  FOR ALL
  USING (true)
  WITH CHECK (true);