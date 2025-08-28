-- Create table for Perplexity Market Enrichment VC Export
CREATE TABLE public.deal_enrichment_perplexity_market_export_vc (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id uuid NOT NULL,
  snapshot_id text NOT NULL,
  primary_industry text,
  location text,
  
  -- Market Data Points
  market_cycle text,
  economic_sensitivity text,
  investment_climate text,
  regulatory_timeline text,
  competitive_window text,
  regulatory_requirements text,
  capital_requirements text,
  technology_moats text,
  distribution_challenges text,
  geographic_constraints text,
  
  -- Tracking Fields
  subcategory_sources jsonb DEFAULT '{}'::jsonb,
  subcategory_confidence jsonb DEFAULT '{}'::jsonb,
  raw_perplexity_response jsonb NOT NULL DEFAULT '{}'::jsonb,
  processing_status text NOT NULL DEFAULT 'completed',
  data_quality_score integer,
  last_updated timestamp with time zone DEFAULT now(),
  confidence_level text,
  
  -- Meta Fields
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  processed_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT unique_deal_snapshot UNIQUE (deal_id, snapshot_id)
);

-- Enable Row Level Security
ALTER TABLE public.deal_enrichment_perplexity_market_export_vc ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for VC market enrichment
CREATE POLICY "VC market enrichment viewable by fund members" 
ON public.deal_enrichment_perplexity_market_export_vc 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM deals d 
    JOIN funds f ON d.fund_id = f.id 
    WHERE d.id = deal_enrichment_perplexity_market_export_vc.deal_id 
    AND user_can_access_fund(f.id)
  )
);

CREATE POLICY "VC market enrichment insertable by services" 
ON public.deal_enrichment_perplexity_market_export_vc 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "VC market enrichment updatable by services" 
ON public.deal_enrichment_perplexity_market_export_vc 
FOR UPDATE 
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_deal_enrichment_perplexity_market_export_vc_updated_at
BEFORE UPDATE ON public.deal_enrichment_perplexity_market_export_vc
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_perplexity_vc();

-- Create index for performance
CREATE INDEX idx_deal_enrichment_perplexity_market_export_vc_deal_id 
ON public.deal_enrichment_perplexity_market_export_vc (deal_id);

CREATE INDEX idx_deal_enrichment_perplexity_market_export_vc_created_at 
ON public.deal_enrichment_perplexity_market_export_vc (created_at DESC);