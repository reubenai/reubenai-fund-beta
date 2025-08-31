-- Function to queue VC aggregation after perplexity processing completes
CREATE OR REPLACE FUNCTION public.queue_vc_aggregation_on_perplexity_processed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only trigger when processing_status changes to 'processed'
  IF NEW.processing_status = 'processed' AND (OLD.processing_status IS NULL OR OLD.processing_status != 'processed') THEN
    -- Queue VC aggregation with 2 minute delay
    PERFORM public.queue_deal_analysis(
      NEW.deal_id,
      'perplexity_company_processed',
      'normal',
      2
    );
    
    RAISE LOG 'Queued VC aggregation for deal_id: % after perplexity company processing completed', NEW.deal_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger on perplexity company export table  
DROP TRIGGER IF EXISTS trigger_vc_aggregation_on_perplexity_processed ON public.deal2_enrichment_perplexity_company_export_vc_duplicate;
CREATE TRIGGER trigger_vc_aggregation_on_perplexity_processed
  AFTER UPDATE ON public.deal2_enrichment_perplexity_company_export_vc_duplicate
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_vc_aggregation_on_perplexity_processed();

-- Also update the universal-analysis-processor routing to handle perplexity_company_processed trigger
-- This ensures the queue item gets processed by the vc-data-aggregator function