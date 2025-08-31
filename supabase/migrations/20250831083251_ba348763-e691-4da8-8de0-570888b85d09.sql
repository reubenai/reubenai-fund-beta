-- Add unique constraint on deal_id for deal_enrichment_perplexity_company_export_vc table
-- This will allow proper upsert operations and prevent duplicate entries

ALTER TABLE public.deal_enrichment_perplexity_company_export_vc 
ADD CONSTRAINT deal_enrichment_perplexity_company_export_vc_deal_id_key 
UNIQUE (deal_id);

-- Update any existing pending records to allow for retry
UPDATE public.deal_enrichment_perplexity_company_export_vc 
SET processing_status = 'retry_needed', 
    updated_at = now()
WHERE processing_status = 'pending' 
  AND created_at < (now() - INTERVAL '10 minutes');