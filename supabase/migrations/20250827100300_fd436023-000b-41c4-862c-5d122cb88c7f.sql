-- Create table for Perplexity founder enrichment data
CREATE TABLE public.deal_enrichment_perplexity_founder_export (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL,
  snapshot_id TEXT,
  founder_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  
  -- Structured data fields
  previous_roles JSONB DEFAULT '[]'::jsonb,
  leadership_experience JSONB DEFAULT '{}'::jsonb,
  technical_skills JSONB DEFAULT '[]'::jsonb,
  market_knowledge JSONB DEFAULT '{}'::jsonb,
  innovation_record JSONB DEFAULT '{}'::jsonb,
  academic_background JSONB DEFAULT '{}'::jsonb,
  certifications JSONB DEFAULT '[]'::jsonb,
  thought_leadership JSONB DEFAULT '{}'::jsonb,
  exit_history JSONB DEFAULT '[]'::jsonb,
  value_creation JSONB DEFAULT '{}'::jsonb,
  team_building JSONB DEFAULT '{}'::jsonb,
  
  -- System fields
  raw_perplexity_response JSONB NOT NULL DEFAULT '{}'::jsonb,
  processing_status TEXT NOT NULL DEFAULT 'raw',
  data_quality_score INTEGER DEFAULT 0,
  confidence_score INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.deal_enrichment_perplexity_founder_export ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view perplexity founder export for accessible deals"
  ON public.deal_enrichment_perplexity_founder_export
  FOR SELECT
  USING (
    deal_id IN (
      SELECT d.id
      FROM deals d
      JOIN funds f ON d.fund_id = f.id
      JOIN profiles p ON f.organization_id = p.organization_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert perplexity founder export for accessible deals"
  ON public.deal_enrichment_perplexity_founder_export
  FOR INSERT
  WITH CHECK (
    deal_id IN (
      SELECT d.id
      FROM deals d
      JOIN funds f ON d.fund_id = f.id
      JOIN profiles p ON f.organization_id = p.organization_id
      WHERE p.user_id = auth.uid()
    )
  );

-- Super admin access
CREATE POLICY "Super admins can manage all perplexity founder exports"
  ON public.deal_enrichment_perplexity_founder_export
  FOR ALL
  USING (auth_is_super_admin())
  WITH CHECK (auth_is_super_admin());

-- Create updated_at trigger
CREATE TRIGGER update_perplexity_founder_export_updated_at
  BEFORE UPDATE ON public.deal_enrichment_perplexity_founder_export
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_ops_control_switches();

-- Create index for performance
CREATE INDEX idx_deal_enrichment_perplexity_founder_export_deal_id 
  ON public.deal_enrichment_perplexity_founder_export(deal_id);

CREATE INDEX idx_deal_enrichment_perplexity_founder_export_processing_status 
  ON public.deal_enrichment_perplexity_founder_export(processing_status);