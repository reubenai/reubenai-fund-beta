-- Fix trigger to use correct enum value for deal status
CREATE OR REPLACE FUNCTION public.trigger_ic_analysis_on_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  http_response record;
  service_role_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1ZXVpb296Y2dtZWRrdXhhd2p1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkyMDY0NSwiZXhwIjoyMDY5NDk2NjQ1fQ.xG6vI9lBx_4SIGiSdSGahtSaUu0E2Cp5KJl3d32B6kU';
BEGIN
  -- Only trigger when status changes TO 'investment_committee' (correct enum value)
  IF NEW.status = 'investment_committee' AND (OLD.status IS DISTINCT FROM 'investment_committee') THEN
    
    RAISE LOG 'Triggering IC analysis for deal_id: % (status changed from % to %)', NEW.id, OLD.status, NEW.status;
    
    -- Call the IC datapoint sourcing edge function
    SELECT INTO http_response * FROM net.http_post(
      url := 'https://bueuioozcgmedkuxawju.supabase.co/functions/v1/ic-datapoint-sourcing',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := jsonb_build_object(
        'deal_id', NEW.id,
        'manual_trigger', false
      ),
      timeout_milliseconds := 60000
    );
    
    -- Log the HTTP response
    IF http_response.status = 200 THEN
      RAISE LOG 'IC analysis successfully triggered for deal_id: %', NEW.id;
    ELSE
      RAISE LOG 'IC analysis trigger failed for deal_id: %. Status: %, Response: %', NEW.id, http_response.status, http_response.content;
    END IF;
    
    -- Log activity regardless of HTTP response
    INSERT INTO public.activity_events (
      user_id,
      fund_id,
      deal_id,
      activity_type,
      title,
      description,
      context_data,
      priority
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', -- System user
      NEW.fund_id,
      NEW.id,
      'status_change_ic_trigger',
      'Deal Advanced to Investment Committee',
      'Deal status changed to Investment Committee - IC analysis automatically triggered',
      jsonb_build_object(
        'previous_status', OLD.status,
        'new_status', NEW.status,
        'http_status', http_response.status,
        'trigger_type', 'automatic',
        'company_name', NEW.company_name
      ),
      'high'
    );
    
  END IF;
  
  RETURN NEW;
END;
$$;