-- Create trigger function to auto-launch VC scoring engine when market enrichment completes
CREATE OR REPLACE FUNCTION public.trigger_vc_scoring_on_market_completion()
RETURNS TRIGGER AS $$
DECLARE
  deal_record RECORD;
  service_role_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1ZXVpb296Y2dtZWRrdXhhd2p1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkyMDY0NSwiZXhwIjoyMDY5NDk2NjQ1fQ.xG6vI9lBx_4SIGiSdSGahtSaUu0E2Cp5KJl3d32B6kU';
  http_response record;
BEGIN
  -- Only trigger when processing_status changes to 'processed'
  IF OLD.processing_status IS DISTINCT FROM NEW.processing_status AND NEW.processing_status = 'processed' THEN
    
    -- Get deal information
    SELECT d.id, d.fund_id, f.organization_id, f.fund_type
    INTO deal_record
    FROM public.deals d
    JOIN public.funds f ON d.fund_id = f.id
    WHERE d.id = NEW.deal_id;
    
    IF NOT FOUND THEN
      RAISE LOG 'Deal not found for deal_id: %', NEW.deal_id;
      RETURN NEW;
    END IF;
    
    -- Only proceed for VC funds
    IF deal_record.fund_type != 'venture_capital' AND deal_record.fund_type != 'vc' THEN
      RAISE LOG 'Skipping VC scoring for non-VC fund type: %', deal_record.fund_type;
      RETURN NEW;
    END IF;
    
    RAISE LOG '🎯 Market enrichment completed for deal %, triggering VC scoring engine', NEW.deal_id;
    
    -- Create initial row in deal_analysisresult_vc if it doesn't exist
    INSERT INTO public.deal_analysisresult_vc (
      deal_id,
      fund_id,
      organization_id,
      overall_score,
      scoring_status,
      analysis_version,
      created_at,
      updated_at
    )
    VALUES (
      deal_record.id,
      deal_record.fund_id,
      deal_record.organization_id,
      0, -- Initial score
      'queued', -- Status indicating scoring is queued
      1, -- Version
      now(),
      now()
    )
    ON CONFLICT (deal_id) DO UPDATE SET
      scoring_status = 'queued',
      updated_at = now();
    
    RAISE LOG '✅ Created/updated initial row in deal_analysisresult_vc for deal %', NEW.deal_id;
    
    -- Call the updated-scoring-engine-vc edge function
    BEGIN
      SELECT INTO http_response * FROM net.http_post(
        url := 'https://bueuioozcgmedkuxawju.supabase.co/functions/v1/updated-scoring-engine-vc',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_role_key
        ),
        body := jsonb_build_object('deal_id', NEW.deal_id),
        timeout_milliseconds := 60000
      );
      
      IF http_response.status = 200 THEN
        RAISE LOG '🚀 Successfully triggered VC scoring engine for deal %', NEW.deal_id;
      ELSE
        RAISE LOG '⚠️ VC scoring engine call failed for deal %. Status: %, Response: %', 
          NEW.deal_id, http_response.status, http_response.content;
      END IF;
      
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG '❌ Error calling VC scoring engine for deal %: %', NEW.deal_id, SQLERRM;
        -- Update status to indicate failure
        UPDATE public.deal_analysisresult_vc 
        SET scoring_status = 'error', updated_at = now()
        WHERE deal_id = NEW.deal_id;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the trigger on deal_enrichment_perplexity_market_export_vc
CREATE TRIGGER auto_trigger_vc_scoring
  AFTER UPDATE ON public.deal_enrichment_perplexity_market_export_vc
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_vc_scoring_on_market_completion();