-- Phase 1: Fix Infrastructure Issues for VC Data Aggregator

-- 1. First, let's set up the service role key configuration
-- This allows the trigger function to call the edge function
INSERT INTO auth.secrets (name, secret) 
VALUES ('service_role_key', current_setting('app.settings.service_role_key', true))
ON CONFLICT (name) DO UPDATE SET secret = EXCLUDED.secret;

-- 2. Create triggers for all enrichment data sources to fire on processing_status = 'completed'

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

-- 3. Create comprehensive logging table for trigger execution debugging
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

-- 4. Update the trigger function to include comprehensive logging
CREATE OR REPLACE FUNCTION public.trigger_vc_data_aggregation()
RETURNS TRIGGER AS $$
DECLARE
  target_deal_id uuid;
  start_time timestamptz;
  end_time timestamptz;
  duration_ms integer;
  http_response record;
BEGIN
  start_time := clock_timestamp();
  
  -- Determine deal_id based on which table triggered this
  target_deal_id := NEW.deal_id;
  
  -- Log the trigger start
  RAISE LOG 'VC Data Aggregation triggered for deal_id: % from table: %', target_deal_id, TG_TABLE_NAME;
  
  -- Call the VC data aggregator edge function asynchronously
  SELECT INTO http_response *
  FROM net.http_post(
    url := 'https://bueuioozcgmedkuxawju.supabase.co/functions/v1/vc-data-aggregator',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object('deal_id', target_deal_id)
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
    (http_response.content::jsonb->>'status')::integer,
    http_response.content::text,
    duration_ms,
    jsonb_build_object(
      'trigger_event', TG_OP,
      'processing_status', NEW.processing_status
    )
  );
  
  RAISE LOG 'VC Data Aggregation completed for deal_id: % in %ms', target_deal_id, duration_ms;
    
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
        'processing_status', NEW.processing_status
      )
    );
    
    RAISE LOG 'VC Data Aggregation failed for deal_id: %. Error: %', target_deal_id, SQLERRM;
    RETURN NEW; -- Don't fail the main operation
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';