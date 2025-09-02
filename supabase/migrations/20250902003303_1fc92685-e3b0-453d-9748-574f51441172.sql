-- Test the direct VC scoring trigger
-- Update one deal to trigger the scoring function

-- Temporarily set to different status then back to processed to trigger the function
UPDATE deal_enrichment_perplexity_market_export_vc 
SET processing_status = 'processing', updated_at = now()
WHERE deal_id = 'f0cf23ee-3938-4ba4-9b07-c3cf9368f77b';

-- Now set back to processed to trigger the scoring function
UPDATE deal_enrichment_perplexity_market_export_vc 
SET processing_status = 'processed', updated_at = now()
WHERE deal_id = 'f0cf23ee-3938-4ba4-9b07-c3cf9368f77b';