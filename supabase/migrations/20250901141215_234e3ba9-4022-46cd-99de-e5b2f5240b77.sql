-- Add the missing company_name column that's referenced in the edge function
ALTER TABLE public.deal_enrichment_perplexity_market_export_vc 
ADD COLUMN IF NOT EXISTS company_name text;