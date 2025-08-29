
-- Create Blueprint v2 scores table for Venture Capital deals
CREATE TABLE public.blueprint_v2_scores_vc (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL,
  fund_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  
  -- Category and subcategory identifiers (from Blueprint v2 VC_CATEGORIES)
  category_id TEXT NOT NULL, -- e.g., 'team-leadership', 'market-opportunity', etc.
  subcategory_id TEXT NOT NULL, -- e.g., 'founder-market-fit', 'market-size-tam', etc.
  
  -- Scoring data
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  confidence_score INTEGER DEFAULT 50 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  weight NUMERIC DEFAULT 0 CHECK (weight >= 0 AND weight <= 100),
  
  -- Analysis insights
  reasoning TEXT,
  insights TEXT[],
  strengths TEXT[],
  concerns TEXT[],
  recommendations TEXT[],
  
  -- Data lineage and quality
  data_sources JSONB DEFAULT '[]'::jsonb,
  data_completeness_score INTEGER DEFAULT 0 CHECK (data_completeness_score >= 0 AND data_completeness_score <= 100),
  validation_flags JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  analysis_version INTEGER DEFAULT 1,
  engine_name TEXT, -- Which analysis engine generated this score
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure unique scoring per category/subcategory per deal
  UNIQUE(deal_id, category_id, subcategory_id)
);

-- Create Blueprint v2 scores table for Private Equity deals
CREATE TABLE public.blueprint_v2_scores_pe (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL,
  fund_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  
  -- Category and subcategory identifiers (from Blueprint v2 PE_CATEGORIES)
  category_id TEXT NOT NULL, -- e.g., 'financial-performance', 'operational-excellence', etc.
  subcategory_id TEXT NOT NULL, -- e.g., 'revenue-quality', 'management-team-strength', etc.
  
  -- Scoring data
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  confidence_score INTEGER DEFAULT 50 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  weight NUMERIC DEFAULT 0 CHECK (weight >= 0 AND weight <= 100),
  
  -- Analysis insights
  reasoning TEXT,
  insights TEXT[],
  strengths TEXT[],
  concerns TEXT[],
  recommendations TEXT[],
  
  -- Data lineage and quality
  data_sources JSONB DEFAULT '[]'::jsonb,
  data_completeness_score INTEGER DEFAULT 0 CHECK (data_completeness_score >= 0 AND data_completeness_score <= 100),
  validation_flags JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  analysis_version INTEGER DEFAULT 1,
  engine_name TEXT, -- Which analysis engine generated this score
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure unique scoring per category/subcategory per deal
  UNIQUE(deal_id, category_id, subcategory_id)
);

-- Enable Row Level Security on both tables
ALTER TABLE public.blueprint_v2_scores_vc ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blueprint_v2_scores_pe ENABLE ROW LEVEL SECURITY;

-- RLS Policies for VC scores
CREATE POLICY "Services can manage VC Blueprint v2 scores" 
  ON public.blueprint_v2_scores_vc 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Super admins can manage all VC Blueprint v2 scores" 
  ON public.blueprint_v2_scores_vc 
  FOR ALL 
  USING (is_super_admin_by_email()) 
  WITH CHECK (is_super_admin_by_email());

CREATE POLICY "Users can manage VC Blueprint v2 scores for accessible funds" 
  ON public.blueprint_v2_scores_vc 
  FOR ALL 
  USING (organization_id = get_jwt_org_id()) 
  WITH CHECK (organization_id = get_jwt_org_id());

-- RLS Policies for PE scores
CREATE POLICY "Services can manage PE Blueprint v2 scores" 
  ON public.blueprint_v2_scores_pe 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Super admins can manage all PE Blueprint v2 scores" 
  ON public.blueprint_v2_scores_pe 
  FOR ALL 
  USING (is_super_admin_by_email()) 
  WITH CHECK (is_super_admin_by_email());

CREATE POLICY "Users can manage PE Blueprint v2 scores for accessible funds" 
  ON public.blueprint_v2_scores_pe 
  FOR ALL 
  USING (organization_id = get_jwt_org_id()) 
  WITH CHECK (organization_id = get_jwt_org_id());

-- Create indexes for performance
CREATE INDEX idx_blueprint_v2_scores_vc_deal_id ON public.blueprint_v2_scores_vc(deal_id);
CREATE INDEX idx_blueprint_v2_scores_vc_fund_id ON public.blueprint_v2_scores_vc(fund_id);
CREATE INDEX idx_blueprint_v2_scores_vc_category ON public.blueprint_v2_scores_vc(category_id, subcategory_id);
CREATE INDEX idx_blueprint_v2_scores_vc_org_id ON public.blueprint_v2_scores_vc(organization_id);

CREATE INDEX idx_blueprint_v2_scores_pe_deal_id ON public.blueprint_v2_scores_pe(deal_id);
CREATE INDEX idx_blueprint_v2_scores_pe_fund_id ON public.blueprint_v2_scores_pe(fund_id);
CREATE INDEX idx_blueprint_v2_scores_pe_category ON public.blueprint_v2_scores_pe(category_id, subcategory_id);
CREATE INDEX idx_blueprint_v2_scores_pe_org_id ON public.blueprint_v2_scores_pe(organization_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_blueprint_v2_scores_vc()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_updated_at_blueprint_v2_scores_pe()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_updated_at_blueprint_v2_scores_vc
  BEFORE UPDATE ON public.blueprint_v2_scores_vc
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_blueprint_v2_scores_vc();

CREATE TRIGGER trigger_update_updated_at_blueprint_v2_scores_pe
  BEFORE UPDATE ON public.blueprint_v2_scores_pe
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_blueprint_v2_scores_pe();

-- Add comments for documentation
COMMENT ON TABLE public.blueprint_v2_scores_vc IS 'Stores Blueprint v2 hierarchical scoring data for Venture Capital deals';
COMMENT ON TABLE public.blueprint_v2_scores_pe IS 'Stores Blueprint v2 hierarchical scoring data for Private Equity deals';

COMMENT ON COLUMN public.blueprint_v2_scores_vc.category_id IS 'Blueprint v2 VC category ID (team-leadership, market-opportunity, product-technology, business-traction, financial-health, strategic-fit)';
COMMENT ON COLUMN public.blueprint_v2_scores_pe.category_id IS 'Blueprint v2 PE category ID (financial-performance, operational-excellence, market-position, management-quality, growth-potential, strategic-fit)';
