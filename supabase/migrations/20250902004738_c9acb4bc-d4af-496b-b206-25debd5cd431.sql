-- Create the missing trigger on deal_enrichment_perplexity_market_export_vc table
CREATE TRIGGER trigger_vc_scoring_on_market_completion
  AFTER UPDATE ON public.deal_enrichment_perplexity_market_export_vc
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_vc_scoring_on_market_completion_direct();

-- Test with bobobox deal - change status to trigger the pipeline  
UPDATE deal_enrichment_perplexity_market_export_vc 
SET processing_status = 'processing', updated_at = now()
WHERE deal_id = 'f0cf23ee-3938-4ba4-9b07-c3cf9368f77b';

UPDATE deal_enrichment_perplexity_market_export_vc 
SET processing_status = 'processed', updated_at = now()
WHERE deal_id = 'f0cf23ee-3938-4ba4-9b07-c3cf9368f77b';