-- Fix SQL bug: change created_at to trigger_timestamp in idempotency check
CREATE OR REPLACE FUNCTION public.trigger_vc_data_aggregation()
RETURNS TRIGGER AS $$
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
  
  -- Add idempotency check to prevent duplicate processing (FIXED: use trigger_timestamp instead of created_at)
  IF EXISTS (
    SELECT 1 FROM public.vc_aggregation_trigger_log 
    WHERE deal_id = target_deal_id 
    AND trigger_source = TG_TABLE_NAME 
    AND trigger_timestamp > NOW() - INTERVAL '1 minute'
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Add missing deal_card_enrichment field to change detection
CREATE OR REPLACE FUNCTION public.trigger_vc_aggregation_on_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  fund_type_value text;
  has_changes boolean := false;
BEGIN
  -- Check if this is a VC deal
  SELECT f.fund_type::text INTO fund_type_value
  FROM public.deals d
  JOIN public.funds f ON d.fund_id = f.id
  WHERE d.id = NEW.deal_id;
  
  IF fund_type_value != 'venture_capital' AND fund_type_value != 'vc' THEN
    RAISE LOG 'Skipping VC aggregation for non-VC deal: %', NEW.deal_id;
    RETURN NEW;
  END IF;
  
  -- Check if any enrichment fields have actually changed (FIXED: added deal_card_enrichment)
  has_changes := (
    OLD.documents_data_points_vc IS DISTINCT FROM NEW.documents_data_points_vc OR
    OLD.deal_enrichment_crunchbase_export IS DISTINCT FROM NEW.deal_enrichment_crunchbase_export OR
    OLD.deal_enrichment_linkedin_export IS DISTINCT FROM NEW.deal_enrichment_linkedin_export OR
    OLD.deal_enrichment_linkedin_profile_export IS DISTINCT FROM NEW.deal_enrichment_linkedin_profile_export OR
    OLD.deal_enrichment_perplexity_company_export_vc IS DISTINCT FROM NEW.deal_enrichment_perplexity_company_export_vc OR
    OLD.deal_enrichment_perplexity_founder_export_vc IS DISTINCT FROM NEW.deal_enrichment_perplexity_founder_export_vc OR
    OLD.deal_enrichment_perplexity_market_export_vc IS DISTINCT FROM NEW.deal_enrichment_perplexity_market_export_vc OR
    OLD.deal_card_enrichment IS DISTINCT FROM NEW.deal_card_enrichment
  );
  
  -- Only trigger aggregation if enrichment data actually changed
  IF has_changes THEN
    RAISE LOG 'VC enrichment data changed for deal %, triggering aggregation', NEW.deal_id;
    
    -- Call the existing VC data aggregation function
    PERFORM public.trigger_vc_data_aggregation_direct(NEW.deal_id);
    
    RAISE LOG 'VC data aggregation triggered for deal %', NEW.deal_id;
  ELSE
    RAISE LOG 'No enrichment data changes detected for deal %, skipping aggregation', NEW.deal_id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in VC aggregation trigger for deal %: %', NEW.deal_id, SQLERRM;
    -- Don't fail the update if aggregation fails
    RETURN NEW;
END;
$function$;