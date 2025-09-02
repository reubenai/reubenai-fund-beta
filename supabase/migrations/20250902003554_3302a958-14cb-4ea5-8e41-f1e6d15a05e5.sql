-- Fix the trigger function to handle existing records properly
CREATE OR REPLACE FUNCTION public.trigger_vc_scoring_on_market_completion_direct()
RETURNS TRIGGER AS $$
DECLARE
  deal_record RECORD;
  service_role_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1ZXVpb296Y2dtZWRrdXhhd2p1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkyMDY0NSwiZXhwIjoyMDY5NDk2NjQ1fQ.xG6vI9lBx_4SIGahtSaUu0E2Cp5KJl3d32B6kU';
  http_response record;
  existing_record_count integer;
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
    IF deal_record.fund_type != 'venture_capital' THEN
      RAISE LOG 'Skipping VC scoring for non-VC fund type: %', deal_record.fund_type;
      RETURN NEW;
    END IF;
    
    RAISE LOG '🚀 Market enrichment completed for deal %, directly triggering VC scoring engine', NEW.deal_id;
    
    -- Check if record already exists
    SELECT COUNT(*) INTO existing_record_count
    FROM public.deal_analysisresult_vc
    WHERE deal_id = deal_record.id;
    
    IF existing_record_count > 0 THEN
      -- Update existing record
      UPDATE public.deal_analysisresult_vc 
      SET 
        processing_status = 'processing',
        updated_at = now()
      WHERE deal_id = deal_record.id;
      RAISE LOG '✅ Updated existing deal_analysisresult_vc to processing status for deal %', NEW.deal_id;
    ELSE
      -- Insert new record
      INSERT INTO public.deal_analysisresult_vc (
        deal_id,
        fund_id,
        organization_id,
        overall_score,
        processing_status,
        created_at,
        updated_at
      )
      VALUES (
        deal_record.id,
        deal_record.fund_id,
        deal_record.organization_id,
        0,
        'processing',
        now(),
        now()
      );
      RAISE LOG '✅ Created new deal_analysisresult_vc with processing status for deal %', NEW.deal_id;
    END IF;
    
    -- Call the updated-scoring-engine-vc edge function directly
    BEGIN
      SELECT INTO http_response * FROM net.http_post(
        url := 'https://bueuioozcgmedkuxawju.supabase.co/functions/v1/updated-scoring-engine-vc',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_role_key
        ),
        body := jsonb_build_object('deal_id', NEW.deal_id),
        timeout_milliseconds := 120000  -- 2 minutes timeout
      );
      
      IF http_response.status = 200 THEN
        RAISE LOG '🎯 Successfully executed VC scoring engine for deal %', NEW.deal_id;
      ELSE
        RAISE LOG '❌ VC scoring engine call failed for deal %. Status: %, Response: %', 
          NEW.deal_id, http_response.status, http_response.content;
        -- Update status to error
        UPDATE public.deal_analysisresult_vc 
        SET processing_status = 'error', updated_at = now()
        WHERE deal_id = NEW.deal_id;
      END IF;
      
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG '💥 Error calling VC scoring engine for deal %: %', NEW.deal_id, SQLERRM;
        -- Update status to error
        UPDATE public.deal_analysisresult_vc 
        SET processing_status = 'error', updated_at = now()
        WHERE deal_id = NEW.deal_id;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Now test the trigger by updating processing_status
UPDATE deal_enrichment_perplexity_market_export_vc 
SET processing_status = 'processing', updated_at = now()
WHERE deal_id = 'f0cf23ee-3938-4ba4-9b07-c3cf9368f77b';

UPDATE deal_enrichment_perplexity_market_export_vc 
SET processing_status = 'processed', updated_at = now()
WHERE deal_id = 'f0cf23ee-3938-4ba4-9b07-c3cf9368f77b';