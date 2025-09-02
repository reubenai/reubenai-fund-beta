-- Clean up existing system
DROP TRIGGER IF EXISTS trigger_vc_scoring_on_market_completion ON public.deal_enrichment_perplexity_market_export_vc;
DROP TRIGGER IF EXISTS auto_trigger_vc_scoring_direct ON public.deal_enrichment_perplexity_market_export_vc;
DROP FUNCTION IF EXISTS public.trigger_vc_scoring_on_market_completion_direct();

-- Create simple trigger function that only manages deal_analysisresult_vc
CREATE OR REPLACE FUNCTION public.simple_vc_result_manager()
RETURNS TRIGGER AS $$
BEGIN
  -- Only act when processing_status changes to 'processed'
  IF NEW.processing_status = 'processed' AND (OLD.processing_status IS DISTINCT FROM 'processed') THEN
    
    -- Insert or update deal_analysisresult_vc record
    INSERT INTO public.deal_analysisresult_vc (
      deal_id,
      fund_id,
      organization_id,
      processing_status,
      created_at,
      updated_at
    )
    SELECT 
      d.id,
      d.fund_id,
      f.organization_id,
      'pending',
      now(),
      now()
    FROM public.deals d
    JOIN public.funds f ON d.fund_id = f.id
    WHERE d.id = NEW.deal_id
    ON CONFLICT (deal_id) DO UPDATE SET
      processing_status = 'pending',
      updated_at = now();
      
    RAISE LOG 'Created/updated deal_analysisresult_vc record for deal %', NEW.deal_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the simple trigger
CREATE TRIGGER simple_vc_result_trigger
  AFTER UPDATE ON public.deal_enrichment_perplexity_market_export_vc
  FOR EACH ROW
  EXECUTE FUNCTION public.simple_vc_result_manager();

-- Test with bobobox deal
UPDATE deal_enrichment_perplexity_market_export_vc 
SET processing_status = 'processed', updated_at = now()
WHERE deal_id = 'f0cf23ee-3938-4ba4-9b07-c3cf9368f77b';