-- Add subcategory sources and confidence columns to deal_enrichment_perplexity_company_export_vc table
ALTER TABLE public.deal_enrichment_perplexity_company_export_vc 
ADD COLUMN IF NOT EXISTS subcategory_sources jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS subcategory_confidence jsonb DEFAULT '{}'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN public.deal_enrichment_perplexity_company_export_vc.subcategory_sources IS 'Sources mapped to each VC subcategory (market_size, market_growth_rate, competitive_position, customer_acquisition, network_advisors)';
COMMENT ON COLUMN public.deal_enrichment_perplexity_company_export_vc.subcategory_confidence IS 'Confidence levels for each VC subcategory (High/Medium/Low)';