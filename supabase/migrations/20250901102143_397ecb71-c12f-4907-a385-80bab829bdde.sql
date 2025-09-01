-- Create trigger function for VC perplexity datamining
CREATE OR REPLACE FUNCTION public.trigger_perplexity_datamining_vc_on_deal_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  fund_type_value text;
  http_response record;
  service_role_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1ZXVpb296Y2dtZWRrdXhhd2p1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkyMDY0NSwiZXhwIjoyMDY5NDk2NjQ1fQ.xG6vI9lBx_4SIGiSdSGahtSaUu0E2Cp5KJl3d32B6kU';
BEGIN
  -- Get fund type for this deal
  SELECT f.fund_type::text INTO fund_type_value
  FROM public.funds f
  WHERE f.id = NEW.fund_id;
  
  -- Only process VC funds
  IF fund_type_value = 'venture_capital' OR fund_type_value = 'vc' THEN
    -- Insert row into perplexity_datamining_vc with queued status
    INSERT INTO public.perplexity_datamining_vc (
      deal_id,
      company_name,
      processing_status,
      created_at
    ) VALUES (
      NEW.id,
      NEW.company_name,
      'queued',
      NOW()
    )
    ON CONFLICT (deal_id) DO NOTHING; -- Prevent duplicate processing
    
    -- Call perplexity-datamining-vc edge function
    BEGIN
      SELECT INTO http_response * FROM net.http_post(
        url := 'https://bueuioozcgmedkuxawju.supabase.co/functions/v1/perplexity-datamining-vc',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_role_key
        ),
        body := jsonb_build_object('deal_id', NEW.id),
        timeout_milliseconds := 30000
      );
      
      RAISE LOG 'VC Perplexity datamining triggered for deal_id: %, response: %', NEW.id, http_response.status;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG 'Failed to call perplexity-datamining-vc for deal_id: %. Error: %', NEW.id, SQLERRM;
    END;
    
    -- Log activity event
    INSERT INTO public.activity_events (
      user_id,
      fund_id,
      deal_id,
      activity_type,
      title,
      description,
      context_data
    ) VALUES (
      NEW.created_by,
      NEW.fund_id,
      NEW.id,
      'perplexity_datamining_queued',
      'VC Perplexity Data Mining Queued',
      'Perplexity data mining has been automatically queued for VC deal: ' || NEW.company_name,
      jsonb_build_object(
        'deal_id', NEW.id,
        'company_name', NEW.company_name,
        'fund_type', fund_type_value,
        'auto_triggered', true
      )
    );
    
    RAISE LOG 'VC Perplexity datamining queued for deal % (%)', NEW.id, NEW.company_name;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create database trigger for VC perplexity datamining on deal creation
CREATE OR REPLACE TRIGGER trigger_perplexity_datamining_vc_on_deal_creation
AFTER INSERT ON public.deals
FOR EACH ROW
EXECUTE FUNCTION public.trigger_perplexity_datamining_vc_on_deal_creation();