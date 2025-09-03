-- Create function to trigger IC datapoint sourcing via HTTP
CREATE OR REPLACE FUNCTION public.trigger_ic_datapoint_sourcing_http(p_deal_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  http_response record;
  service_role_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1ZXVpb296Y2dtZWRrdXhhd2p1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkyMDY0NSwiZXhwIjoyMDY5NDk2NjQ1fQ.xG6vI9lBx_4SIGiSdSGahtSaUu0E2Cp5KJl3d32B6kU';
BEGIN
  RAISE LOG 'Triggering IC datapoint sourcing for deal_id: %', p_deal_id;
  
  -- Make HTTP call to ic-datapoint-sourcing edge function
  SELECT INTO http_response * FROM net.http_post(
    url := 'https://bueuioozcgmedkuxawju.supabase.co/functions/v1/ic-datapoint-sourcing',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := jsonb_build_object(
      'deal_id', p_deal_id,
      'manual_trigger', false,
      'triggered_by', 'vc_completion_trigger'
    ),
    timeout_milliseconds := 90000
  );
  
  -- Log the response
  IF http_response.status = 200 THEN
    RAISE LOG 'IC datapoint sourcing triggered successfully for deal_id: %. Response: %', 
      p_deal_id, http_response.content;
    RETURN true;
  ELSE
    RAISE LOG 'IC datapoint sourcing failed for deal_id: %. Status: %, Response: %', 
      p_deal_id, http_response.status, http_response.content;
    RETURN false;
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Exception in IC datapoint sourcing trigger for deal_id: %. Error: %', 
      p_deal_id, SQLERRM;
    -- Don't fail the transaction, just log the error
    RETURN false;
END;
$function$;

-- Create trigger function for deal_analysisresult_vc completion
CREATE OR REPLACE FUNCTION public.trigger_ic_datapoint_sourcing_on_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  trigger_success boolean;
BEGIN
  -- Only trigger when processing_status changes to 'completed'
  IF NEW.processing_status = 'completed' AND 
     (OLD.processing_status IS DISTINCT FROM 'completed') THEN
    
    RAISE LOG 'VC analysis completed for deal_id: %, triggering IC datapoint sourcing', NEW.deal_id;
    
    -- Trigger IC datapoint sourcing (don't fail transaction if it fails)
    BEGIN
      SELECT trigger_ic_datapoint_sourcing_http(NEW.deal_id) INTO trigger_success;
      
      -- Log activity event for successful trigger
      IF trigger_success THEN
        INSERT INTO public.activity_events (
          user_id,
          fund_id,
          deal_id,
          activity_type,
          title,
          description,
          context_data
        ) VALUES (
          NULL, -- System trigger
          NEW.fund_id,
          NEW.deal_id,
          'ic_analysis_triggered',
          'IC Analysis Auto-Triggered',
          'IC datapoint sourcing automatically triggered after VC analysis completion',
          jsonb_build_object(
            'trigger_type', 'vc_completion_auto_trigger',
            'vc_analysis_completed_at', NEW.updated_at,
            'processing_status', NEW.processing_status
          )
        );
      END IF;
      
    EXCEPTION
      WHEN OTHERS THEN
        -- Log the error but don't fail the main transaction
        RAISE LOG 'Failed to trigger IC datapoint sourcing for deal_id: %. Error: %', 
          NEW.deal_id, SQLERRM;
        
        -- Log error activity event
        INSERT INTO public.activity_events (
          user_id,
          fund_id,
          deal_id,
          activity_type,
          title,
          description,
          context_data
        ) VALUES (
          NULL, -- System trigger
          NEW.fund_id,
          NEW.deal_id,
          'ic_analysis_trigger_failed',
          'IC Analysis Auto-Trigger Failed',
          'Failed to automatically trigger IC datapoint sourcing after VC analysis completion',
          jsonb_build_object(
            'trigger_type', 'vc_completion_auto_trigger',
            'error_message', SQLERRM,
            'vc_analysis_completed_at', NEW.updated_at
          )
        );
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create the trigger on deal_analysisresult_vc
DROP TRIGGER IF EXISTS trigger_ic_sourcing_on_vc_completion ON public.deal_analysisresult_vc;
CREATE TRIGGER trigger_ic_sourcing_on_vc_completion
  AFTER UPDATE ON public.deal_analysisresult_vc
  FOR EACH ROW
  WHEN (NEW.processing_status = 'completed' AND OLD.processing_status IS DISTINCT FROM 'completed')
  EXECUTE FUNCTION public.trigger_ic_datapoint_sourcing_on_completion();

-- Create manual testing function
CREATE OR REPLACE FUNCTION public.manual_trigger_ic_datapoint_sourcing(p_deal_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result boolean;
  deal_exists boolean;
BEGIN
  -- Check if deal exists
  SELECT EXISTS(SELECT 1 FROM public.deals WHERE id = p_deal_id) INTO deal_exists;
  
  IF NOT deal_exists THEN
    RETURN jsonb_build_object('success', false, 'error', 'Deal not found');
  END IF;
  
  -- Trigger IC datapoint sourcing
  SELECT trigger_ic_datapoint_sourcing_http(p_deal_id) INTO result;
  
  IF result THEN
    RETURN jsonb_build_object(
      'success', true, 
      'message', 'IC datapoint sourcing triggered manually',
      'deal_id', p_deal_id
    );
  ELSE
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Failed to trigger IC datapoint sourcing - check logs for details',
      'deal_id', p_deal_id
    );
  END IF;
END;
$function$;