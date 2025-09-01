-- Fix missing category field in VC trigger function
CREATE OR REPLACE FUNCTION public.unified_vc_trigger_on_deal_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  http_response record;
  service_role_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1ZXVpb296Y2dtZWRrdXhhd2p1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkyMDY0NSwiZXhwIjoyMDY5NDk2NjQ1fQ.xG6vI9lBx_4SIGahtSaUu0E2Cp5KJl3d32B6kU';
  fund_type_value text;
BEGIN
  -- Get fund type to ensure this is a VC deal
  SELECT f.fund_type::text INTO fund_type_value
  FROM public.funds f
  WHERE f.id = NEW.fund_id;
  
  -- Only process venture capital funds
  IF fund_type_value = 'venture_capital' OR fund_type_value = 'vc' THEN
    RAISE LOG 'Processing VC deal creation for deal: %, company: %', NEW.id, NEW.company_name;
    
    -- Step 1: Insert record into perplexity_datamining_vc table with category field
    INSERT INTO public.perplexity_datamining_vc (
      deal_id,
      fund_id,
      organization_id,
      company_name,
      category,
      processing_status,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.fund_id,
      NEW.organization_id,
      NEW.company_name,
      'comprehensive_analysis',
      'queued',
      NOW(),
      NOW()
    );
    
    RAISE LOG 'Inserted VC research record for deal: %', NEW.id;
    
    -- Step 2: Call the perplexity-vc-comprehensive-research-processor edge function
    SELECT INTO http_response * FROM net.http_post(
      url := 'https://bueuioozcgmedkuxawju.supabase.co/functions/v1/perplexity-vc-comprehensive-research-processor',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := jsonb_build_object(
        'batchSize', 1,
        'dryRun', false,
        'dealId', NEW.id::text
      ),
      timeout_milliseconds := 60000
    );
    
    -- Log the response for debugging
    IF http_response.status = 200 THEN
      RAISE LOG 'Successfully triggered VC research processor for deal: %', NEW.id;
    ELSE
      RAISE LOG 'Failed to trigger VC research processor for deal: %. Status: %, Response: %', 
        NEW.id, http_response.status, http_response.content;
    END IF;
    
  ELSE
    RAISE LOG 'Skipping VC processing for non-VC fund type: %', fund_type_value;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in unified VC trigger for deal: %. Error: %', NEW.id, SQLERRM;
    RETURN NEW; -- Don't fail the deal creation if VC processing fails
END;
$function$;