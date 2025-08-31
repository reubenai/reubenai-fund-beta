-- Comprehensive VC Data Aggregation Trigger System

-- 1. Create function for 3-minute delayed queue insertion
CREATE OR REPLACE FUNCTION public.queue_delayed_vc_aggregation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  fund_type_value text;
BEGIN
  -- Only process VC funds
  SELECT f.fund_type::text INTO fund_type_value
  FROM public.funds f
  WHERE f.id = NEW.fund_id;
  
  IF fund_type_value = 'venture_capital' OR fund_type_value = 'vc' THEN
    -- Add to analysis queue with 3-minute delay
    INSERT INTO public.analysis_queue (
      deal_id,
      fund_id,
      trigger_reason,
      priority,
      scheduled_for,
      metadata
    ) VALUES (
      NEW.id,
      NEW.fund_id,
      'vc_aggregation_3min_delay',
      'normal',
      NOW() + INTERVAL '3 minutes',
      jsonb_build_object(
        'trigger_type', 'delayed_vc_aggregation',
        'deal_created_at', NEW.created_at,
        'auto_scheduled', true
      )
    )
    ON CONFLICT (deal_id, trigger_reason) WHERE status IN ('queued', 'processing') 
    DO NOTHING; -- Prevent duplicate scheduling
    
    RAISE LOG 'Scheduled VC data aggregation for deal % in 3 minutes', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 2. Update the existing VC aggregation trigger function with better error handling
CREATE OR REPLACE FUNCTION public.trigger_vc_data_aggregation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  target_deal_id uuid;
  start_time timestamptz;
  end_time timestamptz;
  duration_ms integer;
  http_response record;
  service_role_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1ZXVpb296Y2dtZWRrdXhhd2p1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkyMDY0NSwiZXhwIjoyMDY5NDk2NjQ1fQ.xG6vI9lBx_4SIGiSdSGahtSaUu0E2Cp5KJl3d32B6kU';
  fund_type_value text;
BEGIN
  start_time := clock_timestamp();
  target_deal_id := NEW.deal_id;
  
  -- Check if this is a VC deal before processing
  SELECT f.fund_type::text INTO fund_type_value
  FROM public.deals d
  JOIN public.funds f ON d.fund_id = f.id
  WHERE d.id = target_deal_id;
  
  IF fund_type_value != 'venture_capital' AND fund_type_value != 'vc' THEN
    RAISE LOG 'Skipping VC aggregation for non-VC deal: %', target_deal_id;
    RETURN NEW;
  END IF;
  
  RAISE LOG 'VC Data Aggregation triggered for deal_id: % from table: %', target_deal_id, TG_TABLE_NAME;
  
  -- Add idempotency check to prevent duplicate processing
  IF EXISTS (
    SELECT 1 FROM public.vc_aggregation_trigger_log 
    WHERE deal_id = target_deal_id 
    AND trigger_source = TG_TABLE_NAME 
    AND created_at > NOW() - INTERVAL '1 minute'
    AND http_status = 200
  ) THEN
    RAISE LOG 'Skipping duplicate VC aggregation for deal_id: % (processed within last minute)', target_deal_id;
    RETURN NEW;
  END IF;
  
  -- Call the VC data aggregator edge function
  SELECT INTO http_response * FROM net.http_post(
    url := 'https://bueuioozcgmedkuxawju.supabase.co/functions/v1/vc-data-aggregator',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := jsonb_build_object('deal_id', target_deal_id),
    timeout_milliseconds := 30000
  );
  
  end_time := clock_timestamp();
  duration_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
  
  -- Log successful execution
  INSERT INTO public.vc_aggregation_trigger_log (
    deal_id, trigger_source, http_status, http_response, execution_duration_ms, metadata
  ) VALUES (
    target_deal_id, TG_TABLE_NAME, 
    COALESCE((http_response.content::jsonb->>'status')::integer, http_response.status),
    http_response.content::text, duration_ms,
    jsonb_build_object(
      'trigger_event', TG_OP, 
      'processing_status', COALESCE(NEW.processing_status, 'unknown'),
      'idempotency_check', 'passed'
    )
  );
  
  RAISE LOG 'VC Data Aggregation completed for deal_id: % in %ms', target_deal_id, duration_ms;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    end_time := clock_timestamp();
    duration_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    
    INSERT INTO public.vc_aggregation_trigger_log (
      deal_id, trigger_source, error_message, execution_duration_ms, metadata
    ) VALUES (
      target_deal_id, TG_TABLE_NAME, SQLERRM, duration_ms,
      jsonb_build_object(
        'trigger_event', TG_OP, 
        'sqlstate', SQLSTATE,
        'error_context', 'trigger_function_execution'
      )
    );
    
    RAISE LOG 'VC Data Aggregation failed for deal_id: %. Error: %', target_deal_id, SQLERRM;
    RETURN NEW;
END;
$function$;

-- 3. Create triggers on deal_analysis_datapoints_vc for immediate aggregation
DROP TRIGGER IF EXISTS trigger_immediate_vc_aggregation_on_datapoints ON public.deal_analysis_datapoints_vc;

CREATE TRIGGER trigger_immediate_vc_aggregation_on_datapoints
  AFTER INSERT OR UPDATE ON public.deal_analysis_datapoints_vc
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_vc_data_aggregation();

-- 4. Create triggers on deals table for 3-minute delayed execution
DROP TRIGGER IF EXISTS trigger_delayed_vc_aggregation_on_deal_creation ON public.deals;

CREATE TRIGGER trigger_delayed_vc_aggregation_on_deal_creation
  AFTER INSERT ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_delayed_vc_aggregation();

-- 5. Also trigger on deal analysis completion for immediate processing
DROP TRIGGER IF EXISTS trigger_immediate_vc_aggregation_on_analysis ON public.deals;

CREATE TRIGGER trigger_immediate_vc_aggregation_on_analysis
  AFTER UPDATE OF enhanced_analysis, last_analysis_trigger ON public.deals
  FOR EACH ROW
  WHEN (NEW.enhanced_analysis IS DISTINCT FROM OLD.enhanced_analysis 
        OR NEW.last_analysis_trigger IS DISTINCT FROM OLD.last_analysis_trigger)
  EXECUTE FUNCTION public.trigger_vc_data_aggregation();

-- 6. Create a manual trigger function for testing/debugging
CREATE OR REPLACE FUNCTION public.manual_trigger_vc_aggregation(p_deal_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  fund_type_value text;
BEGIN
  -- Check if deal exists and is VC
  SELECT f.fund_type::text INTO fund_type_value
  FROM public.deals d
  JOIN public.funds f ON d.fund_id = f.id
  WHERE d.id = p_deal_id;
  
  IF fund_type_value IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Deal not found');
  END IF;
  
  IF fund_type_value != 'venture_capital' AND fund_type_value != 'vc' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Deal is not a VC deal');
  END IF;
  
  -- Create a temporary record to trigger the function
  INSERT INTO public.vc_aggregation_trigger_log (
    deal_id, trigger_source, metadata
  ) VALUES (
    p_deal_id, 'manual_trigger', 
    jsonb_build_object('triggered_at', NOW(), 'type', 'manual_execution')
  );
  
  -- Call the aggregation function directly (simulate trigger)
  PERFORM public.trigger_vc_data_aggregation_direct(p_deal_id);
  
  RETURN jsonb_build_object('success', true, 'message', 'VC aggregation triggered manually');
END;
$function$;

-- 7. Direct aggregation function for manual calls
CREATE OR REPLACE FUNCTION public.trigger_vc_data_aggregation_direct(p_deal_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  http_response record;
  service_role_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1ZXVpb296Y2dtZWRrdXhhd2p1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkyMDY0NSwiZXhwIjoyMDY5NDk2NjQ1fQ.xG6vI9lBx_4SIGiSdSGahtSaUu0E2Cp5KJl3d32B6kU';
BEGIN
  RAISE LOG 'Manual VC Data Aggregation for deal_id: %', p_deal_id;
  
  SELECT INTO http_response * FROM net.http_post(
    url := 'https://bueuioozcgmedkuxawju.supabase.co/functions/v1/vc-data-aggregator',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := jsonb_build_object('deal_id', p_deal_id),
    timeout_milliseconds := 30000
  );
  
  RETURN http_response.status = 200;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Manual VC aggregation failed for deal_id: %. Error: %', p_deal_id, SQLERRM;
    RETURN false;
END;
$function$;