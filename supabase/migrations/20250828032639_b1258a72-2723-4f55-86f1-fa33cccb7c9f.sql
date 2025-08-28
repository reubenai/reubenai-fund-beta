-- Add subcategory sources and confidence columns to founder enrichment table
ALTER TABLE public.deal_enrichment_perplexity_founder_export_vc 
ADD COLUMN subcategory_sources jsonb DEFAULT '{}'::jsonb,
ADD COLUMN subcategory_confidence jsonb DEFAULT '{}'::jsonb;