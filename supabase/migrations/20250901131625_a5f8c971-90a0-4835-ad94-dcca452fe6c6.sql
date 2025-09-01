-- Fix HTTP response field access in trigger function
CREATE OR REPLACE FUNCTION public.trigger_perplexity2_vc_processing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  fund_type_value text;
  http_response record;
  service_role_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1ZXVpb296Y2dtZWRrdXhhd2p1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkyMDY0NSwiZXhwIjoyMDY5NDk2NjQ1fQ.xG6vI9lBx_4SIGiSdSGahtSaUu0E2Cp5KJl3d32B6kU';
  start_time timestamp with time zone;
  end_time timestamp with time zone;
  processing_duration integer;
BEGIN
  start_time := now();
  
  -- Get fund type for this deal
  SELECT f.fund_type::text INTO fund_type_value
  FROM public.funds f
  WHERE f.id = NEW.fund_id;
  
  -- Only process VC deals
  IF fund_type_value = 'venture_capital' OR fund_type_value = 'vc' THEN
    BEGIN
      -- Insert row into perplexity2_datamining_vc table
      INSERT INTO public.perplexity2_datamining_vc (
        deal_id,
        fund_id, 
        organization_id,
        company_name,
        category,
        processing_status
      ) VALUES (
        NEW.id,
        NEW.fund_id,
        NEW.organization_id,
        NEW.company_name,
        'comprehensive_analysis',
        'queued'
      )
      ON CONFLICT (deal_id) DO NOTHING; -- Prevent duplicates
      
      -- Call perplexity-datamining-vc edge function
      SELECT INTO http_response * FROM net.http_post(
        url := 'https://bueuioozcgmedkuxawju.supabase.co/functions/v1/perplexity-datamining-vc',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_role_key
        ),
        body := jsonb_build_object(
          'deal_id', NEW.id,
          'company_name', NEW.company_name,
          'trigger_source', 'new_deal_creation'
        ),
        timeout_milliseconds := 30000
      );
      
      end_time := now();
      processing_duration := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
      
      -- Log successful execution using correct field names
      INSERT INTO public.perplexity2_vc_processing_log (
        deal_id,
        trigger_source,
        http_status,
        http_response,
        processing_duration_ms,
        metadata
      ) VALUES (
        NEW.id,
        'new_deal_creation',
        (http_response).status_code, -- Fixed: use status_code instead of status
        (http_response).content::jsonb, -- Fixed: properly cast content to jsonb
        processing_duration,
        jsonb_build_object(
          'company_name', NEW.company_name,
          'fund_type', fund_type_value,
          'fund_id', NEW.fund_id,
          'http_headers', (http_response).headers
        )
      );
      
      RAISE LOG 'Perplexity2 VC processing triggered for deal_id: %, status: %', NEW.id, (http_response).status_code;
      
    EXCEPTION
      WHEN OTHERS THEN
        end_time := now();
        processing_duration := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
        
        -- Log error but don't fail the deal creation
        INSERT INTO public.perplexity2_vc_processing_log (
          deal_id,
          trigger_source,
          error_message,
          processing_duration_ms,
          metadata
        ) VALUES (
          NEW.id,
          'new_deal_creation',
          SQLERRM,
          processing_duration,
          jsonb_build_object(
            'company_name', NEW.company_name,
            'fund_type', fund_type_value,
            'error_code', SQLSTATE
          )
        );
        
        RAISE LOG 'Perplexity2 VC processing failed for deal_id: %. Error: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;