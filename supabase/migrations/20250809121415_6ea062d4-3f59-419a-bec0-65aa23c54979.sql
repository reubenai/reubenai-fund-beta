-- Increase analysis queue concurrency limits
ALTER TABLE analysis_queue 
ADD COLUMN IF NOT EXISTS max_concurrent_override INTEGER DEFAULT NULL;

-- Add queue health monitoring
CREATE TABLE IF NOT EXISTS public.queue_health_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add RLS for queue health metrics
ALTER TABLE public.queue_health_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reuben admins can manage queue health metrics" 
ON public.queue_health_metrics 
FOR ALL 
USING (is_reuben_email())
WITH CHECK (is_reuben_email());

-- Update the process_analysis_queue function to handle higher concurrency
CREATE OR REPLACE FUNCTION public.process_analysis_queue(
  batch_size integer DEFAULT 10, 
  max_concurrent integer DEFAULT 25  -- Increased from 10 to 25
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  queue_record record;
  processed_count integer := 0;
  failed_count integer := 0;
  result jsonb;
  current_concurrent integer;
BEGIN
  -- Check current processing count
  SELECT COUNT(*) INTO current_concurrent
  FROM public.analysis_queue 
  WHERE status = 'processing';
  
  -- Don't process if we're at max concurrent
  IF current_concurrent >= max_concurrent THEN
    RETURN jsonb_build_object(
      'status', 'throttled',
      'message', 'Max concurrent analysis jobs reached',
      'current_concurrent', current_concurrent,
      'max_concurrent', max_concurrent
    );
  END IF;
  
  -- Process queued items with higher batch size
  FOR queue_record IN
    SELECT * FROM public.analysis_queue
    WHERE status = 'queued'
      AND scheduled_for <= now()
      AND attempts < max_attempts
    ORDER BY 
      CASE priority 
        WHEN 'high' THEN 1
        WHEN 'normal' THEN 2
        WHEN 'low' THEN 3
        ELSE 4
      END,
      scheduled_for ASC
    LIMIT LEAST(batch_size, max_concurrent - current_concurrent)  -- Don't exceed concurrent limit
  LOOP
    BEGIN
      -- Update status to processing
      UPDATE public.analysis_queue 
      SET 
        status = 'processing',
        started_at = now(),
        attempts = attempts + 1,
        updated_at = now()
      WHERE id = queue_record.id;
      
      -- Update deal status
      UPDATE public.deals 
      SET analysis_queue_status = 'processing'
      WHERE id = queue_record.deal_id;
      
      processed_count := processed_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      -- Mark as failed
      UPDATE public.analysis_queue 
      SET 
        status = 'failed',
        error_message = SQLERRM,
        updated_at = now(),
        completed_at = now()
      WHERE id = queue_record.id;
      
      failed_count := failed_count + 1;
    END;
  END LOOP;
  
  -- Record health metrics
  INSERT INTO public.queue_health_metrics (metric_name, metric_value, metadata)
  VALUES 
    ('processed_count', processed_count, jsonb_build_object('batch_timestamp', now())),
    ('failed_count', failed_count, jsonb_build_object('batch_timestamp', now())),
    ('current_concurrent', current_concurrent, jsonb_build_object('max_concurrent', max_concurrent));
  
  RETURN jsonb_build_object(
    'processed', processed_count,
    'failed', failed_count,
    'current_concurrent', current_concurrent,
    'max_concurrent', max_concurrent,
    'timestamp', now()
  );
END;
$function$;