-- Create logging table for perplexity2 VC processing
CREATE TABLE public.perplexity2_vc_processing_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id uuid NOT NULL,
  trigger_source text NOT NULL DEFAULT 'new_deal_creation',
  http_status integer,
  http_response jsonb DEFAULT '{}'::jsonb,
  error_message text,
  processing_duration_ms integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add foreign key constraint
ALTER TABLE public.perplexity2_vc_processing_log
  ADD CONSTRAINT perplexity2_vc_processing_log_deal_id_fkey 
  FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX idx_perplexity2_vc_processing_log_deal_id ON public.perplexity2_vc_processing_log(deal_id);
CREATE INDEX idx_perplexity2_vc_processing_log_created_at ON public.perplexity2_vc_processing_log(created_at);

-- Enable Row Level Security
ALTER TABLE public.perplexity2_vc_processing_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view logs for accessible funds
CREATE POLICY "Users can view perplexity2 VC processing logs for accessible funds"
ON public.perplexity2_vc_processing_log
FOR SELECT
USING (deal_id IN (
  SELECT d.id
  FROM deals d
  JOIN funds f ON d.fund_id = f.id
  WHERE user_can_access_fund(f.id)
));

-- RLS Policy: Services can manage all logs
CREATE POLICY "Services can manage all perplexity2 VC processing logs"
ON public.perplexity2_vc_processing_log
FOR ALL
USING (true)
WITH CHECK (true);

-- Create trigger function for VC deal processing
CREATE OR REPLACE FUNCTION public.trigger_perplexity2_vc_processing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  fund_type_value text;
  http_response record;
  service_role_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1ZXVpb296Y2dtZWRrdXhhd2p1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkyMDY0NSwiZXhwIjoyMDY5NDk2NjQ1fQ.xG6vI9lBx_4SIGiSdSGahtSaUu0E2Cp5KJl3d32B6kU';
  start_time timestamp with time zone;
  end_time timestamp with time zone;
  processing_duration integer;
BEGIN
  start_time := now();
  
  -- Get fund type for this deal
  SELECT f.fund_type::text INTO fund_type_value
  FROM public.funds f
  WHERE f.id = NEW.fund_id;
  
  -- Only process VC deals
  IF fund_type_value = 'venture_capital' OR fund_type_value = 'vc' THEN
    BEGIN
      -- Insert row into perplexity2_datamining_vc table
      INSERT INTO public.perplexity2_datamining_vc (
        deal_id,
        fund_id, 
        organization_id,
        company_name,
        category,
        processing_status
      ) VALUES (
        NEW.id,
        NEW.fund_id,
        NEW.organization_id,
        NEW.company_name,
        'comprehensive_analysis',
        'queued'
      )
      ON CONFLICT (deal_id) DO NOTHING; -- Prevent duplicates
      
      -- Call perplexity-datamining-vc edge function
      SELECT INTO http_response * FROM net.http_post(
        url := 'https://bueuioozcgmedkuxawju.supabase.co/functions/v1/perplexity-datamining-vc',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_role_key
        ),
        body := jsonb_build_object(
          'deal_id', NEW.id,
          'company_name', NEW.company_name,
          'trigger_source', 'new_deal_creation'
        ),
        timeout_milliseconds := 30000
      );
      
      end_time := now();
      processing_duration := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
      
      -- Log successful execution
      INSERT INTO public.perplexity2_vc_processing_log (
        deal_id,
        trigger_source,
        http_status,
        http_response,
        processing_duration_ms,
        metadata
      ) VALUES (
        NEW.id,
        'new_deal_creation',
        http_response.status,
        http_response.content,
        processing_duration,
        jsonb_build_object(
          'company_name', NEW.company_name,
          'fund_type', fund_type_value,
          'fund_id', NEW.fund_id
        )
      );
      
      RAISE LOG 'Perplexity2 VC processing triggered for deal_id: %, status: %', NEW.id, http_response.status;
      
    EXCEPTION
      WHEN OTHERS THEN
        end_time := now();
        processing_duration := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
        
        -- Log error but don't fail the deal creation
        INSERT INTO public.perplexity2_vc_processing_log (
          deal_id,
          trigger_source,
          error_message,
          processing_duration_ms,
          metadata
        ) VALUES (
          NEW.id,
          'new_deal_creation',
          SQLERRM,
          processing_duration,
          jsonb_build_object(
            'company_name', NEW.company_name,
            'fund_type', fund_type_value,
            'error_code', SQLSTATE
          )
        );
        
        RAISE LOG 'Perplexity2 VC processing failed for deal_id: %. Error: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on deals table
CREATE TRIGGER trigger_new_vc_deal_processing
  AFTER INSERT ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_perplexity2_vc_processing();