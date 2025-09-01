-- Reset processed founder enrichment records to raw for reprocessing
UPDATE deal_enrichment_perplexity_founder_export_vc 
SET processing_status = 'raw', processed_at = NULL
WHERE processing_status IN ('processed', 'pending');

-- Add a note about the data extraction fix
COMMENT ON TABLE deal_enrichment_perplexity_founder_export_vc IS 'Founder enrichment data from Perplexity API - Fixed data extraction from nested JSON structure';