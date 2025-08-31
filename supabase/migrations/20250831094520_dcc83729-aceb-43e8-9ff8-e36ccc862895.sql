-- Phase 1: Fix Infrastructure Issues for VC Data Aggregator (Fixed)

-- 1. Create triggers for all enrichment data sources to fire on processing_status = 'completed'

-- Trigger for Perplexity Company VC Export
CREATE OR REPLACE TRIGGER trigger_vc_aggregation_perplexity_company
  AFTER UPDATE ON public.deal2_enrichment_perplexity_company_export_vc
  FOR EACH ROW
  WHEN (NEW.processing_status = 'completed' AND OLD.processing_status != 'completed')
  EXECUTE FUNCTION public.trigger_vc_data_aggregation();

-- Trigger for Perplexity Founder VC Export  
CREATE OR REPLACE TRIGGER trigger_vc_aggregation_perplexity_founder
  AFTER UPDATE ON public.deal2_enrichment_perplexity_founder_export_vc
  FOR EACH ROW
  WHEN (NEW.processing_status = 'completed' AND OLD.processing_status != 'completed')
  EXECUTE FUNCTION public.trigger_vc_data_aggregation();

-- Trigger for Crunchbase Export
CREATE OR REPLACE TRIGGER trigger_vc_aggregation_crunchbase
  AFTER UPDATE ON public.deal2_enrichment_crunchbase_export
  FOR EACH ROW
  WHEN (NEW.processing_status = 'completed' AND OLD.processing_status != 'completed')
  EXECUTE FUNCTION public.trigger_vc_data_aggregation();

-- Trigger for LinkedIn Company Export
CREATE OR REPLACE TRIGGER trigger_vc_aggregation_linkedin
  AFTER UPDATE ON public.deal2_enrichment_linkedin_export
  FOR EACH ROW
  WHEN (NEW.processing_status = 'completed' AND OLD.processing_status != 'completed')
  EXECUTE FUNCTION public.trigger_vc_data_aggregation();

-- Trigger for LinkedIn Profile Export
CREATE OR REPLACE TRIGGER trigger_vc_aggregation_linkedin_profile
  AFTER UPDATE ON public.deal2_enrichment_linkedin_profile_export
  FOR EACH ROW
  WHEN (NEW.processing_status = 'completed' AND OLD.processing_status != 'completed')
  EXECUTE FUNCTION public.trigger_vc_data_aggregation();

-- Trigger for Documents (when data_points_vc is updated)
CREATE OR REPLACE TRIGGER trigger_vc_aggregation_documents
  AFTER UPDATE ON public.documents
  FOR EACH ROW
  WHEN (NEW.data_points_vc IS NOT NULL AND OLD.data_points_vc IS DISTINCT FROM NEW.data_points_vc)
  EXECUTE FUNCTION public.trigger_vc_data_aggregation();

-- Trigger for Notes (when analysis is completed) 
CREATE OR REPLACE TRIGGER trigger_vc_aggregation_notes
  AFTER UPDATE ON public.notes
  FOR EACH ROW
  WHEN (NEW.analysis_summary IS NOT NULL AND OLD.analysis_summary IS DISTINCT FROM NEW.analysis_summary)
  EXECUTE FUNCTION public.trigger_vc_data_aggregation();

-- 2. Create comprehensive logging table for trigger execution debugging
CREATE TABLE IF NOT EXISTS public.vc_aggregation_trigger_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL,
  trigger_source TEXT NOT NULL, -- which table/trigger fired this
  trigger_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  http_status INTEGER,
  http_response TEXT,
  error_message TEXT,
  execution_duration_ms INTEGER,
  metadata JSONB DEFAULT '{}'
);

-- Enable RLS on the logging table
ALTER TABLE public.vc_aggregation_trigger_log ENABLE ROW LEVEL SECURITY;

-- Policy for logging table - services can insert, users can read their org's data
CREATE POLICY "Services can log VC aggregation triggers" 
ON public.vc_aggregation_trigger_log 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view VC aggregation logs for accessible funds" 
ON public.vc_aggregation_trigger_log 
FOR SELECT 
USING (
  deal_id IN (
    SELECT d.id 
    FROM deals d 
    JOIN funds f ON d.fund_id = f.id 
    WHERE user_can_access_fund(f.id)
  )
);

-- 3. Update the trigger function to include comprehensive logging and use proper service role key
CREATE OR REPLACE FUNCTION public.trigger_vc_data_aggregation()
RETURNS TRIGGER AS $$
DECLARE
  target_deal_id uuid;
  start_time timestamptz;
  end_time timestamptz;
  duration_ms integer;
  http_response record;
  service_role_key text;
BEGIN
  start_time := clock_timestamp();
  
  -- Determine deal_id based on which table triggered this
  target_deal_id := NEW.deal_id;
  
  -- Log the trigger start
  RAISE LOG 'VC Data Aggregation triggered for deal_id: % from table: %', target_deal_id, TG_TABLE_NAME;
  
  -- Get service role key from current setting (set by Supabase environment)
  BEGIN
    service_role_key := current_setting('app.settings.service_role_key', true);
    IF service_role_key IS NULL OR service_role_key = '' THEN
      -- Fallback to Supabase service role key environment variable
      service_role_key := current_setting('supabase.service_role_key', true);
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      service_role_key := 'missing_service_role_key';
  END;
  
  -- Call the VC data aggregator edge function asynchronously
  SELECT INTO http_response *
  FROM net.http_post(
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
    deal_id,
    trigger_source,
    http_status,
    http_response,
    execution_duration_ms,
    metadata
  ) VALUES (
    target_deal_id,
    TG_TABLE_NAME,
    COALESCE((http_response.content::jsonb->>'status')::integer, http_response.status),
    http_response.content::text,
    duration_ms,
    jsonb_build_object(
      'trigger_event', TG_OP,
      'processing_status', NEW.processing_status,
      'service_role_key_configured', CASE WHEN service_role_key != 'missing_service_role_key' THEN true ELSE false END
    )
  );
  
  RAISE LOG 'VC Data Aggregation completed for deal_id: % in %ms with status: %', target_deal_id, duration_ms, COALESCE(http_response.status, 'unknown');
    
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    end_time := clock_timestamp();
    duration_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    
    -- Log error
    INSERT INTO public.vc_aggregation_trigger_log (
      deal_id,
      trigger_source,
      error_message,
      execution_duration_ms,
      metadata
    ) VALUES (
      target_deal_id,
      TG_TABLE_NAME,
      SQLERRM,
      duration_ms,
      jsonb_build_object(
        'trigger_event', TG_OP,
        'sqlstate', SQLSTATE,
        'processing_status', NEW.processing_status,
        'service_role_key_configured', CASE WHEN service_role_key != 'missing_service_role_key' THEN true ELSE false END
      )
    );
    
    RAISE LOG 'VC Data Aggregation failed for deal_id: %. Error: % (SQLSTATE: %)', target_deal_id, SQLERRM, SQLSTATE;
    RETURN NEW; -- Don't fail the main operation
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';