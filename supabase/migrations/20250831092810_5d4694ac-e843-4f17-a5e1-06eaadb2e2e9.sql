-- Fix security issue: Add search_path to trigger function
CREATE OR REPLACE FUNCTION public.trigger_vc_data_aggregation()
RETURNS TRIGGER AS $$
DECLARE
  target_deal_id uuid;
BEGIN
  -- Determine deal_id based on which table triggered this
  IF TG_TABLE_NAME = 'deal_analysis_datapoints_vc' THEN
    target_deal_id := NEW.deal_id;
  ELSE
    target_deal_id := NEW.deal_id;
  END IF;
  
  -- Log the trigger
  RAISE LOG 'VC Data Aggregation triggered for deal_id: % from table: %', target_deal_id, TG_TABLE_NAME;
  
  -- Call the VC data aggregator edge function asynchronously
  PERFORM
    net.http_post(
      url := 'https://bueuioozcgmedkuxawju.supabase.co/functions/v1/vc-data-aggregator',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object('deal_id', target_deal_id)
    );
    
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the main operation
    RAISE LOG 'VC Data Aggregation trigger failed for deal_id: %. Error: %', target_deal_id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';