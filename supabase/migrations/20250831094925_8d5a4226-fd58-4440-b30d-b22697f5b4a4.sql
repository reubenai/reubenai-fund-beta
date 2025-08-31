-- Phase 1: Fix Infrastructure Issues for VC Data Aggregator (Essential Only)

-- 1. Create triggers for enrichment data sources that exist
CREATE OR REPLACE TRIGGER trigger_vc_aggregation_perplexity_company
  AFTER UPDATE ON public.deal2_enrichment_perplexity_company_export_vc_duplicate
  FOR EACH ROW
  WHEN (NEW.processing_status = 'completed' AND OLD.processing_status != 'completed')
  EXECUTE FUNCTION public.trigger_vc_data_aggregation();

CREATE OR REPLACE TRIGGER trigger_vc_aggregation_perplexity_founder
  AFTER UPDATE ON public.deal2_enrichment_perplexity_founder_export_vc_duplicate
  FOR EACH ROW
  WHEN (NEW.processing_status = 'completed' AND OLD.processing_status != 'completed')
  EXECUTE FUNCTION public.trigger_vc_data_aggregation();

CREATE OR REPLACE TRIGGER trigger_vc_aggregation_crunchbase
  AFTER UPDATE ON public.deal2_enrichment_crunchbase_export
  FOR EACH ROW
  WHEN (NEW.processing_status = 'completed' AND OLD.processing_status != 'completed')
  EXECUTE FUNCTION public.trigger_vc_data_aggregation();

CREATE OR REPLACE TRIGGER trigger_vc_aggregation_linkedin
  AFTER UPDATE ON public.deal2_enrichment_linkedin_export
  FOR EACH ROW
  WHEN (NEW.processing_status = 'completed' AND OLD.processing_status != 'completed')
  EXECUTE FUNCTION public.trigger_vc_data_aggregation();

CREATE OR REPLACE TRIGGER trigger_vc_aggregation_linkedin_profile
  AFTER UPDATE ON public.deal2_enrichment_linkedin_profile_export
  FOR EACH ROW
  WHEN (NEW.processing_status = 'completed' AND OLD.processing_status != 'completed')
  EXECUTE FUNCTION public.trigger_vc_data_aggregation();

-- 2. Create comprehensive logging table
CREATE TABLE IF NOT EXISTS public.vc_aggregation_trigger_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL,
  trigger_source TEXT NOT NULL,
  trigger_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  http_status INTEGER,
  http_response TEXT,
  error_message TEXT,
  execution_duration_ms INTEGER,
  metadata JSONB DEFAULT '{}'
);

ALTER TABLE public.vc_aggregation_trigger_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Services can log VC aggregation triggers" 
ON public.vc_aggregation_trigger_log FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view VC aggregation logs for accessible funds" 
ON public.vc_aggregation_trigger_log FOR SELECT 
USING (deal_id IN (SELECT d.id FROM deals d JOIN funds f ON d.fund_id = f.id WHERE user_can_access_fund(f.id)));

-- 3. Update trigger function with proper logging
CREATE OR REPLACE FUNCTION public.trigger_vc_data_aggregation()
RETURNS TRIGGER AS $$
DECLARE
  target_deal_id uuid;
  start_time timestamptz;
  end_time timestamptz;
  duration_ms integer;
  http_response record;
  service_role_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1ZXVpb296Y2dtZWRrdXhhd2p1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkyMDY0NSwiZXhwIjoyMDY5NDk2NjQ1fQ.xG6vI9lBx_4SIGiSdSGahtSaUu0E2Cp5KJl3d32B6kU';
BEGIN
  start_time := clock_timestamp();
  target_deal_id := NEW.deal_id;
  
  RAISE LOG 'VC Data Aggregation triggered for deal_id: % from table: %', target_deal_id, TG_TABLE_NAME;
  
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
    jsonb_build_object('trigger_event', TG_OP, 'processing_status', NEW.processing_status)
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
      jsonb_build_object('trigger_event', TG_OP, 'sqlstate', SQLSTATE)
    );
    
    RAISE LOG 'VC Data Aggregation failed for deal_id: %. Error: %', target_deal_id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';