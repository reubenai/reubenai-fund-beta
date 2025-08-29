-- Create PE-specific Perplexity enrichment tables (mirror VC structure)
CREATE TABLE IF NOT EXISTS public.deal_enrichment_perplexity_company_export_pe (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL,
  fund_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  company_overview TEXT,
  business_model TEXT,
  competitive_landscape TEXT,
  market_position TEXT,
  growth_metrics JSONB DEFAULT '{}',
  financial_highlights JSONB DEFAULT '{}',
  operational_metrics JSONB DEFAULT '{}',
  key_success_factors TEXT[],
  risk_factors TEXT[],
  industry_trends TEXT[],
  data_quality_score INTEGER DEFAULT 0,
  confidence_level INTEGER DEFAULT 0,
  retrieved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.deal_enrichment_perplexity_founder_export_pe (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL,
  fund_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  founder_profiles JSONB DEFAULT '[]',
  leadership_experience TEXT[],
  track_record TEXT[],
  industry_expertise TEXT[],
  previous_exits JSONB DEFAULT '[]',
  educational_background TEXT[],
  professional_network JSONB DEFAULT '{}',
  leadership_style TEXT,
  vision_strategy TEXT,
  execution_capability INTEGER DEFAULT 0,
  data_quality_score INTEGER DEFAULT 0,
  confidence_level INTEGER DEFAULT 0,
  retrieved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.deal_enrichment_perplexity_market_export_pe (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL,
  fund_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  market_size_analysis JSONB DEFAULT '{}',
  target_market TEXT,
  customer_segments TEXT[],
  market_trends TEXT[],
  competitive_analysis JSONB DEFAULT '{}',
  barriers_to_entry TEXT[],
  market_dynamics TEXT,
  growth_drivers TEXT[],
  regulatory_environment TEXT[],
  market_maturity TEXT,
  consolidation_opportunities TEXT[],
  data_quality_score INTEGER DEFAULT 0,
  confidence_level INTEGER DEFAULT 0,
  retrieved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create engine completion tracking table
CREATE TABLE IF NOT EXISTS public.engine_completion_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL,
  fund_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  fund_type TEXT NOT NULL,
  
  -- Engine completion status
  documents_status TEXT DEFAULT 'pending', -- pending, processing, complete, timeout, error
  crunchbase_status TEXT DEFAULT 'pending',
  linkedin_profile_status TEXT DEFAULT 'pending', 
  linkedin_export_status TEXT DEFAULT 'pending',
  perplexity_company_status TEXT DEFAULT 'pending',
  perplexity_founder_status TEXT DEFAULT 'pending',
  perplexity_market_status TEXT DEFAULT 'pending',
  
  -- Timestamps
  tracking_started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_check_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  timeout_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '5 minutes'),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  active_engines TEXT[] DEFAULT '{}',
  completed_engines TEXT[] DEFAULT '{}',
  failed_engines TEXT[] DEFAULT '{}',
  overall_status TEXT DEFAULT 'monitoring', -- monitoring, completed, timeout, failed
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.deal_enrichment_perplexity_company_export_pe ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_enrichment_perplexity_founder_export_pe ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_enrichment_perplexity_market_export_pe ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engine_completion_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for PE Perplexity tables (same pattern as VC tables)
CREATE POLICY "Services can manage PE company perplexity data"
ON public.deal_enrichment_perplexity_company_export_pe
FOR ALL USING (true)
WITH CHECK (true);

CREATE POLICY "Users can view PE company perplexity data for accessible funds"
ON public.deal_enrichment_perplexity_company_export_pe
FOR SELECT USING (organization_id = get_jwt_org_id());

CREATE POLICY "Services can manage PE founder perplexity data"
ON public.deal_enrichment_perplexity_founder_export_pe
FOR ALL USING (true)
WITH CHECK (true);

CREATE POLICY "Users can view PE founder perplexity data for accessible funds"
ON public.deal_enrichment_perplexity_founder_export_pe
FOR SELECT USING (organization_id = get_jwt_org_id());

CREATE POLICY "Services can manage PE market perplexity data"
ON public.deal_enrichment_perplexity_market_export_pe
FOR ALL USING (true)
WITH CHECK (true);

CREATE POLICY "Users can view PE market perplexity data for accessible funds"
ON public.deal_enrichment_perplexity_market_export_pe
FOR SELECT USING (organization_id = get_jwt_org_id());

-- RLS Policies for engine completion tracking
CREATE POLICY "Services can manage engine completion tracking"
ON public.engine_completion_tracking
FOR ALL USING (true)
WITH CHECK (true);

CREATE POLICY "Users can view engine completion tracking for accessible funds"
ON public.engine_completion_tracking
FOR SELECT USING (organization_id = get_jwt_org_id());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pe_company_deal_id ON public.deal_enrichment_perplexity_company_export_pe(deal_id);
CREATE INDEX IF NOT EXISTS idx_pe_founder_deal_id ON public.deal_enrichment_perplexity_founder_export_pe(deal_id);
CREATE INDEX IF NOT EXISTS idx_pe_market_deal_id ON public.deal_enrichment_perplexity_market_export_pe(deal_id);
CREATE INDEX IF NOT EXISTS idx_engine_tracking_deal_id ON public.engine_completion_tracking(deal_id);
CREATE INDEX IF NOT EXISTS idx_engine_tracking_status ON public.engine_completion_tracking(overall_status);

-- Create update triggers
CREATE TRIGGER update_pe_company_perplexity_updated_at
  BEFORE UPDATE ON public.deal_enrichment_perplexity_company_export_pe
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_perplexity_vc();

CREATE TRIGGER update_pe_founder_perplexity_updated_at
  BEFORE UPDATE ON public.deal_enrichment_perplexity_founder_export_pe
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_perplexity_founder_vc();

CREATE TRIGGER update_pe_market_perplexity_updated_at
  BEFORE UPDATE ON public.deal_enrichment_perplexity_market_export_pe
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_perplexity_vc();

-- Function to queue waterfall processing on deal creation
CREATE OR REPLACE FUNCTION public.queue_waterfall_processing()
RETURNS TRIGGER AS $$
BEGIN
  -- Create engine completion tracking record
  INSERT INTO public.engine_completion_tracking (
    deal_id,
    fund_id,
    organization_id,
    fund_type,
    active_engines,
    timeout_at
  ) VALUES (
    NEW.id,
    NEW.fund_id,
    NEW.organization_id,
    NEW.fund_type::text,
    ARRAY['documents', 'crunchbase', 'linkedin_profile', 'linkedin_export', 'perplexity_company', 'perplexity_founder', 'perplexity_market'],
    now() + interval '5 minutes'
  );
  
  -- Queue analysis with waterfall processing flag
  PERFORM public.queue_deal_analysis(
    NEW.id,
    'waterfall_processing',
    'high',
    2 -- 2 minute delay
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;