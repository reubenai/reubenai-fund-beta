-- Step 1: Reclaim zombie jobs immediately
UPDATE analysis_queue
SET status='queued', 
    started_at=null, 
    scheduled_for=now() + interval '2 minutes'
WHERE status='processing' AND (now() - started_at) > interval '5 minutes';

-- Step 2: Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_analysis_queue_status ON analysis_queue(status);
CREATE INDEX IF NOT EXISTS idx_analysis_queue_priority ON analysis_queue(priority);
CREATE INDEX IF NOT EXISTS idx_analysis_queue_scheduled_for ON analysis_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_analysis_queue_processing_lookup ON analysis_queue(status, started_at) WHERE status='processing';

-- Step 3: Improve the process_analysis_queue function with FOR UPDATE SKIP LOCKED
CREATE OR REPLACE FUNCTION public.process_analysis_queue(batch_size integer DEFAULT 10, max_concurrent integer DEFAULT 25)
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
  claimed_ids uuid[] := '{}';
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

  -- Atomic job claiming with FOR UPDATE SKIP LOCKED
  BEGIN
    -- Claim jobs atomically
    WITH claimed_jobs AS (
      SELECT id FROM public.analysis_queue
      WHERE status = 'queued'
        AND (scheduled_for IS NULL OR scheduled_for <= now())
        AND attempts < max_attempts
      ORDER BY 
        CASE priority 
          WHEN 'high' THEN 1
          WHEN 'normal' THEN 2
          WHEN 'low' THEN 3
          ELSE 4
        END,
        scheduled_for ASC NULLS FIRST,
        created_at ASC
      LIMIT LEAST(batch_size, max_concurrent - current_concurrent)
      FOR UPDATE SKIP LOCKED
    )
    UPDATE public.analysis_queue 
    SET 
      status = 'processing',
      started_at = now(),
      attempts = attempts + 1,
      updated_at = now()
    FROM claimed_jobs
    WHERE analysis_queue.id = claimed_jobs.id
    RETURNING analysis_queue.id INTO claimed_ids;
    
    GET DIAGNOSTICS processed_count = ROW_COUNT;
    
    -- Also update deal status for claimed jobs
    UPDATE public.deals 
    SET analysis_queue_status = 'processing'
    WHERE id IN (
      SELECT deal_id FROM public.analysis_queue 
      WHERE id = ANY(claimed_ids)
    );
    
  EXCEPTION WHEN OTHERS THEN
    -- If claiming fails, record error but don't crash
    failed_count := 1;
    RAISE WARNING 'Error claiming jobs: %', SQLERRM;
  END;
  
  -- Record health metrics
  INSERT INTO public.queue_health_metrics (metric_name, metric_value, metadata)
  VALUES 
    ('processed_count', processed_count, jsonb_build_object('batch_timestamp', now(), 'claimed_ids', claimed_ids)),
    ('failed_count', failed_count, jsonb_build_object('batch_timestamp', now())),
    ('current_concurrent', current_concurrent, jsonb_build_object('max_concurrent', max_concurrent));
  
  RETURN jsonb_build_object(
    'processed', processed_count,
    'failed', failed_count,
    'current_concurrent', current_concurrent,
    'max_concurrent', max_concurrent,
    'claimed_ids', claimed_ids,
    'timestamp', now()
  );
END;
$function$;

-- Step 4: Create zombie reclaimer function
CREATE OR REPLACE FUNCTION public.reclaim_zombie_analysis_jobs()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  reclaimed_count integer := 0;
  reclaimed_ids uuid[] := '{}';
BEGIN
  -- Reclaim zombie jobs
  UPDATE public.analysis_queue
  SET status='queued', 
      started_at=null, 
      scheduled_for=now() + interval '2 minutes',
      updated_at=now()
  WHERE status='processing' 
    AND (now() - started_at) > interval '5 minutes'
  RETURNING id INTO reclaimed_ids;
  
  GET DIAGNOSTICS reclaimed_count = ROW_COUNT;
  
  -- Update deal status for reclaimed jobs
  UPDATE public.deals 
  SET analysis_queue_status = 'queued'
  WHERE id IN (
    SELECT deal_id FROM public.analysis_queue 
    WHERE id = ANY(reclaimed_ids)
  );
  
  -- Log the reclamation
  INSERT INTO public.queue_health_metrics (metric_name, metric_value, metadata)
  VALUES ('zombie_reclaimed', reclaimed_count, jsonb_build_object(
    'reclaimed_ids', reclaimed_ids,
    'timestamp', now(),
    'reason', 'stale_heartbeat'
  ));
  
  RETURN jsonb_build_object(
    'reclaimed_count', reclaimed_count,
    'reclaimed_ids', reclaimed_ids,
    'timestamp', now()
  );
END;
$function$;