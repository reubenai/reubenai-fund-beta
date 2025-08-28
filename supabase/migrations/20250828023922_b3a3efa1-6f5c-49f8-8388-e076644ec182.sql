-- Create new VC-specific Perplexity founder enrichment table
CREATE TABLE public.deal_enrichment_perplexity_founder_export_vc (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id uuid NOT NULL,
  snapshot_id text,
  founder_name text NOT NULL,
  company_name text NOT NULL,
  
  -- Founder analysis data
  previous_roles jsonb DEFAULT '[]'::jsonb,
  leadership_experience jsonb DEFAULT '{}'::jsonb,
  technical_skills jsonb DEFAULT '[]'::jsonb,
  market_knowledge jsonb DEFAULT '{}'::jsonb,
  innovation_record jsonb DEFAULT '{}'::jsonb,
  academic_background jsonb DEFAULT '{}'::jsonb,
  certifications jsonb DEFAULT '[]'::jsonb,
  thought_leadership jsonb DEFAULT '{}'::jsonb,
  exit_history jsonb DEFAULT '[]'::jsonb,
  value_creation jsonb DEFAULT '{}'::jsonb,
  team_building jsonb DEFAULT '{}'::jsonb,
  
  -- Metadata
  raw_perplexity_response jsonb NOT NULL DEFAULT '{}'::jsonb,
  processing_status text NOT NULL DEFAULT 'raw'::text,
  data_quality_score integer DEFAULT 0,
  confidence_score integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  processed_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.deal_enrichment_perplexity_founder_export_vc ENABLE ROW LEVEL SECURITY;

-- Create policies for the new VC founder table
CREATE POLICY "Users can view VC founder enrichment for accessible deals" 
ON public.deal_enrichment_perplexity_founder_export_vc 
FOR SELECT 
USING (deal_id IN (
  SELECT d.id
  FROM deals d
  JOIN funds f ON d.fund_id = f.id
  JOIN profiles p ON f.organization_id = p.organization_id
  WHERE p.user_id = auth.uid()
));

CREATE POLICY "Services can manage VC founder enrichment data" 
ON public.deal_enrichment_perplexity_founder_export_vc 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Migrate existing data from VC deals only
INSERT INTO public.deal_enrichment_perplexity_founder_export_vc (
  deal_id, snapshot_id, founder_name, company_name, previous_roles,
  leadership_experience, technical_skills, market_knowledge, innovation_record,
  academic_background, certifications, thought_leadership, exit_history,
  value_creation, team_building, raw_perplexity_response, processing_status,
  data_quality_score, confidence_score, created_at, updated_at, processed_at
)
SELECT 
  p.deal_id, p.snapshot_id, p.founder_name, p.company_name, p.previous_roles,
  p.leadership_experience, p.technical_skills, p.market_knowledge, p.innovation_record,
  p.academic_background, p.certifications, p.thought_leadership, p.exit_history,
  p.value_creation, p.team_building, p.raw_perplexity_response, p.processing_status,
  p.data_quality_score, p.confidence_score, p.created_at, p.updated_at, p.processed_at
FROM public.deal_enrichment_perplexity_founder_export p
JOIN deals d ON p.deal_id = d.id
JOIN funds f ON d.fund_id = f.id
WHERE f.fund_type = 'venture_capital';

-- Create indexes for performance
CREATE INDEX idx_deal_enrichment_perplexity_founder_vc_deal_id ON public.deal_enrichment_perplexity_founder_export_vc(deal_id);
CREATE INDEX idx_deal_enrichment_perplexity_founder_vc_snapshot_id ON public.deal_enrichment_perplexity_founder_export_vc(snapshot_id);
CREATE INDEX idx_deal_enrichment_perplexity_founder_vc_created_at ON public.deal_enrichment_perplexity_founder_export_vc(created_at);
CREATE INDEX idx_deal_enrichment_perplexity_founder_vc_founder_name ON public.deal_enrichment_perplexity_founder_export_vc(founder_name);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_perplexity_founder_vc()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_perplexity_founder_vc_updated_at
BEFORE UPDATE ON public.deal_enrichment_perplexity_founder_export_vc
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_perplexity_founder_vc();

-- Drop the old table after migration
DROP TABLE IF EXISTS public.deal_enrichment_perplexity_founder_export;