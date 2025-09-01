-- Update the trigger function to call the correct edge function
CREATE OR REPLACE FUNCTION public.trigger_perplexity_datamining_vc_on_deal_creation()
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
    RAISE LOG 'Triggering VC research for deal: %, company: %', NEW.id, NEW.company_name;
    
    -- Call the correct edge function: perplexity-vc-comprehensive-research-processor
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
    RAISE LOG 'Skipping VC research trigger for non-VC fund type: %', fund_type_value;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in VC research trigger for deal: %. Error: %', NEW.id, SQLERRM;
    RETURN NEW; -- Don't fail the deal creation if research trigger fails
END;
$function$;