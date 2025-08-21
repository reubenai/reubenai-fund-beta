-- Create clean investment_strategies_v2 table designed for the wizard's exact data structure
-- This eliminates complex JSON transformations and ON CONFLICT issues

CREATE TABLE public.investment_strategies_v2 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fund_id UUID NOT NULL REFERENCES public.funds(id) ON DELETE CASCADE,
  
  -- Foundation fields (Steps 1-3)
  fund_name TEXT NOT NULL,
  strategy_description TEXT,
  fund_type TEXT NOT NULL CHECK (fund_type IN ('vc', 'pe')),
  sectors TEXT[] DEFAULT '{}',
  stages TEXT[] DEFAULT '{}',
  geographies TEXT[] DEFAULT '{}',
  check_size_min BIGINT,
  check_size_max BIGINT,
  key_signals TEXT[] DEFAULT '{}',
  
  -- Enhanced philosophy and approach
  investment_philosophy TEXT,
  philosophy_config JSONB DEFAULT '{}',
  research_approach JSONB DEFAULT '{}',
  deal_sourcing_strategy JSONB DEFAULT '{}',
  decision_making_process JSONB DEFAULT '{}',
  
  -- Category configurations (direct from wizard)
  team_leadership_config JSONB DEFAULT '{}',
  market_opportunity_config JSONB DEFAULT '{}',
  product_technology_config JSONB DEFAULT '{}',
  business_traction_config JSONB DEFAULT '{}',
  financial_health_config JSONB DEFAULT '{}',
  strategic_fit_config JSONB DEFAULT '{}',
  
  -- Deal thresholds
  exciting_threshold INTEGER DEFAULT 85,
  promising_threshold INTEGER DEFAULT 70,
  needs_development_threshold INTEGER DEFAULT 50,
  
  -- Generated results from wizard
  enhanced_criteria JSONB DEFAULT '[]',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  organization_id UUID NOT NULL,
  
  -- Single unique constraint - no duplicates!
  UNIQUE(fund_id)
);

-- Enable RLS
ALTER TABLE public.investment_strategies_v2 ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage strategies for their organization" 
ON public.investment_strategies_v2 
FOR ALL 
USING (organization_id = get_jwt_org_id())
WITH CHECK (organization_id = get_jwt_org_id());

CREATE POLICY "Super admins can manage all strategies" 
ON public.investment_strategies_v2 
FOR ALL 
USING (is_super_admin_by_email())
WITH CHECK (is_super_admin_by_email());

-- Create function to auto-populate organization_id from fund
CREATE OR REPLACE FUNCTION public.populate_strategy_v2_organization_id()
RETURNS TRIGGER AS $$
BEGIN
  SELECT organization_id INTO NEW.organization_id
  FROM public.funds 
  WHERE id = NEW.fund_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Create trigger for auto-populating organization_id
CREATE TRIGGER populate_strategy_v2_organization_id_trigger
  BEFORE INSERT ON public.investment_strategies_v2
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_strategy_v2_organization_id();

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_strategy_v2_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = 'public';

CREATE TRIGGER update_strategy_v2_updated_at_trigger
  BEFORE UPDATE ON public.investment_strategies_v2
  FOR EACH ROW
  EXECUTE FUNCTION public.update_strategy_v2_updated_at();

-- Create index for performance
CREATE INDEX idx_investment_strategies_v2_fund_id ON public.investment_strategies_v2(fund_id);
CREATE INDEX idx_investment_strategies_v2_organization_id ON public.investment_strategies_v2(organization_id);