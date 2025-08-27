-- Create table for Perplexity company enrichment export
CREATE TABLE public.deal_enrichment_perplexity_company_export (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  snapshot_id TEXT NOT NULL,
  company_name TEXT NOT NULL,
  
  -- Market Size Data
  tam TEXT,
  sam TEXT,
  som TEXT,
  cagr TEXT,
  growth_drivers TEXT[],
  
  -- Market Analysis
  market_share_distribution JSONB DEFAULT '{}'::jsonb,
  key_market_players TEXT[],
  whitespace_opportunities TEXT[],
  
  -- Customer & Business Metrics
  addressable_customers TEXT,
  cac_trend TEXT,
  ltv_cac_ratio TEXT,
  retention_rate TEXT,
  channel_effectiveness JSONB DEFAULT '{}'::jsonb,
  
  -- Strategic Network
  strategic_advisors TEXT[],
  investor_network TEXT[],
  partnership_ecosystem JSONB DEFAULT '{}'::jsonb,
  
  -- System Fields
  raw_perplexity_response JSONB NOT NULL DEFAULT '{}'::jsonb,
  processing_status TEXT NOT NULL DEFAULT 'raw',
  data_quality_score INTEGER,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.deal_enrichment_perplexity_company_export ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view company enrichment for accessible deals"
ON public.deal_enrichment_perplexity_company_export
FOR SELECT
USING (
  deal_id IN (
    SELECT d.id 
    FROM deals d
    JOIN funds f ON d.fund_id = f.id
    WHERE user_can_access_fund(f.id)
  )
);

CREATE POLICY "Services can manage company enrichment"
ON public.deal_enrichment_perplexity_company_export
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_deal_enrichment_perplexity_company_deal_id 
ON public.deal_enrichment_perplexity_company_export(deal_id);

CREATE INDEX idx_deal_enrichment_perplexity_company_snapshot_id 
ON public.deal_enrichment_perplexity_company_export(snapshot_id);

-- Create trigger for updated_at
CREATE TRIGGER update_deal_enrichment_perplexity_company_updated_at
  BEFORE UPDATE ON public.deal_enrichment_perplexity_company_export
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();