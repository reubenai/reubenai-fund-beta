-- Create the missing trigger function for VC data aggregation
CREATE OR REPLACE FUNCTION public.trigger_vc_aggregation_on_update()
RETURNS TRIGGER AS $$
DECLARE
  http_response record;
  service_role_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1ZXVpb296Y2dtZWRrdXhhd2p1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkyMDY0NSwiZXhwIjoyMDY5NDk2NjQ1fQ.xG6vI9lBx_4SIGiSdSGahtSaUu0E2Cp5KJl3d32B6kU';
BEGIN
  RAISE LOG 'VC Data Aggregation triggered for deal_id: %', NEW.deal_id;
  
  -- Call the vc-data-aggregator edge function
  SELECT INTO http_response * FROM net.http_post(
    url := 'https://bueuioozcgmedkuxawju.supabase.co/functions/v1/vc-data-aggregator',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := jsonb_build_object('deal_id', NEW.deal_id),
    timeout_milliseconds := 30000
  );
  
  IF http_response.status != 200 THEN
    RAISE LOG 'VC aggregation failed for deal_id: %. Status: %. Response: %', 
      NEW.deal_id, http_response.status, http_response.content;
  ELSE
    RAISE LOG 'VC aggregation completed for deal_id: %', NEW.deal_id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'VC aggregation error for deal_id: %. Error: %', NEW.deal_id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;