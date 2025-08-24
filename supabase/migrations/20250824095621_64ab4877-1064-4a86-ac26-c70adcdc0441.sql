-- Complete analysis queue items for deals that have processed LinkedIn data
UPDATE analysis_queue 
SET 
  status = 'completed',
  completed_at = now(),
  updated_at = now()
WHERE status IN ('queued', 'processing')
  AND deal_id IN (
    SELECT deal_id 
    FROM deal_enrichment_linkedin_export 
    WHERE processing_status = 'processed'
      AND raw_brightdata_response IS NOT NULL
      AND raw_brightdata_response != '{}'::jsonb
  );

-- Add a cleanup function that can be called periodically  
CREATE OR REPLACE FUNCTION cleanup_stuck_linkedin_processes()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  completed_queues INTEGER := 0;
BEGIN
  -- Complete analysis queue items for deals with processed LinkedIn data
  UPDATE analysis_queue 
  SET 
    status = 'completed',
    completed_at = now(),
    updated_at = now()
  WHERE status IN ('queued', 'processing')
    AND created_at < now() - interval '30 minutes'
    AND deal_id IN (
      SELECT deal_id 
      FROM deal_enrichment_linkedin_export 
      WHERE processing_status = 'processed'
        AND raw_brightdata_response IS NOT NULL
        AND raw_brightdata_response != '{}'::jsonb
    );
  
  GET DIAGNOSTICS completed_queues = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'success', true,
    'completed_queue_items', completed_queues,
    'message', 'Cleanup completed successfully',
    'timestamp', now()
  );
END;
$$;