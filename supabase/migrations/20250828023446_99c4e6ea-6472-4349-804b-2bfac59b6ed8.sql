-- Create new VC-specific Perplexity company enrichment table
CREATE TABLE public.deal_enrichment_perplexity_company_export_vc (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id uuid NOT NULL,
  snapshot_id text NOT NULL,
  company_name text NOT NULL,
  
  -- Market Analysis Fields
  tam text,
  sam text,
  som text,
  cagr text,
  growth_drivers text[], -- Array type to match original
  market_share_distribution jsonb DEFAULT '{}'::jsonb,
  key_market_players text[], -- Array type to match original
  whitespace_opportunities text[], -- Array type to match original
  
  -- Customer & Business Model
  addressable_customers text,
  cac_trend text,
  ltv_cac_ratio text,
  retention_rate text,
  channel_effectiveness jsonb DEFAULT '{}'::jsonb,
  
  -- Strategic Network
  strategic_advisors text[], -- Array type to match original
  investor_network text[], -- Array type to match original
  partnership_ecosystem jsonb DEFAULT '{}'::jsonb,
  
  -- System Level Data (new fields for enhanced structure)
  data_sources jsonb DEFAULT '[]'::jsonb,
  last_updated timestamp with time zone,
  confidence_level text,
  
  -- Metadata
  raw_perplexity_response jsonb NOT NULL DEFAULT '{}'::jsonb,
  processing_status text NOT NULL DEFAULT 'completed'::text,
  data_quality_score integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  processed_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.deal_enrichment_perplexity_company_export_vc ENABLE ROW LEVEL SECURITY;

-- Create policies for the new VC table
CREATE POLICY "Users can view VC enrichment for accessible deals" 
ON public.deal_enrichment_perplexity_company_export_vc 
FOR SELECT 
USING (deal_id IN (
  SELECT d.id
  FROM deals d
  JOIN funds f ON d.fund_id = f.id
  JOIN profiles p ON f.organization_id = p.organization_id
  WHERE p.user_id = auth.uid()
));

CREATE POLICY "Services can manage VC enrichment data" 
ON public.deal_enrichment_perplexity_company_export_vc 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Migrate existing data from VC deals only (only columns that exist in original table)
INSERT INTO public.deal_enrichment_perplexity_company_export_vc (
  deal_id, snapshot_id, company_name, tam, sam, som, cagr, growth_drivers,
  market_share_distribution, key_market_players, whitespace_opportunities,
  addressable_customers, cac_trend, ltv_cac_ratio, retention_rate,
  channel_effectiveness, strategic_advisors, investor_network,
  partnership_ecosystem, raw_perplexity_response, processing_status,
  data_quality_score, created_at, updated_at, processed_at
)
SELECT 
  p.deal_id, p.snapshot_id, p.company_name, p.tam, p.sam, p.som, p.cagr,
  p.growth_drivers, p.market_share_distribution, p.key_market_players,
  p.whitespace_opportunities, p.addressable_customers, p.cac_trend,
  p.ltv_cac_ratio, p.retention_rate, p.channel_effectiveness,
  p.strategic_advisors, p.investor_network, p.partnership_ecosystem,
  p.raw_perplexity_response, p.processing_status, p.data_quality_score, 
  p.created_at, p.updated_at, p.processed_at
FROM public.deal_enrichment_perplexity_company_export p
JOIN deals d ON p.deal_id = d.id
JOIN funds f ON d.fund_id = f.id
WHERE f.fund_type = 'venture_capital';

-- Create indexes for performance
CREATE INDEX idx_deal_enrichment_perplexity_vc_deal_id ON public.deal_enrichment_perplexity_company_export_vc(deal_id);
CREATE INDEX idx_deal_enrichment_perplexity_vc_snapshot_id ON public.deal_enrichment_perplexity_company_export_vc(snapshot_id);
CREATE INDEX idx_deal_enrichment_perplexity_vc_created_at ON public.deal_enrichment_perplexity_company_export_vc(created_at);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_perplexity_vc()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_perplexity_vc_updated_at
BEFORE UPDATE ON public.deal_enrichment_perplexity_company_export_vc
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_perplexity_vc();

-- Drop the old table after migration
DROP TABLE IF EXISTS public.deal_enrichment_perplexity_company_export;