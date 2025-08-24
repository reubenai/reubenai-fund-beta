-- Fix stuck analysis queue items and create auto-completion logic

-- Clean up old stuck queue items (older than 30 minutes)
UPDATE analysis_queue 
SET 
  status = 'failed',
  error_message = 'Auto-failed due to timeout (stuck > 30 minutes)',
  completed_at = now(),
  updated_at = now()
WHERE status IN ('queued', 'processing') 
  AND created_at < now() - interval '30 minutes';

-- Create function to auto-complete stuck LinkedIn exports
CREATE OR REPLACE FUNCTION auto_complete_stuck_linkedin_exports()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  completed_count INTEGER := 0;
BEGIN
  -- Mark LinkedIn exports as completed if they've been processing for more than 15 minutes
  -- and have raw_brightdata_response data
  UPDATE deal_enrichment_linkedin_export 
  SET 
    processing_status = 'completed',
    processed_at = now(),
    updated_at = now()
  WHERE processing_status = 'processed'
    AND created_at < now() - interval '15 minutes'
    AND raw_brightdata_response IS NOT NULL
    AND raw_brightdata_response != '{}'::jsonb;
  
  GET DIAGNOSTICS completed_count = ROW_COUNT;
  
  -- Also clean up any analysis queue items for these deals
  UPDATE analysis_queue 
  SET 
    status = 'completed',
    completed_at = now(),
    updated_at = now()
  WHERE status IN ('queued', 'processing')
    AND deal_id IN (
      SELECT deal_id 
      FROM deal_enrichment_linkedin_export 
      WHERE processing_status = 'completed' 
        AND processed_at > now() - interval '1 minute'
    );
  
  RETURN completed_count;
END;
$$;

-- Create function to get LinkedIn processing status for a deal
CREATE OR REPLACE FUNCTION get_linkedin_processing_status(target_deal_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result jsonb;
  export_record record;
  queue_record record;
BEGIN
  -- Get LinkedIn export status
  SELECT * INTO export_record
  FROM deal_enrichment_linkedin_export
  WHERE deal_id = target_deal_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Get queue status
  SELECT * INTO queue_record
  FROM analysis_queue
  WHERE deal_id = target_deal_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  result := jsonb_build_object(
    'linkedin_export', CASE 
      WHEN export_record.id IS NOT NULL THEN
        jsonb_build_object(
          'status', export_record.processing_status,
          'created_at', export_record.created_at,
          'processed_at', export_record.processed_at,
          'company_name', export_record.company_name,
          'has_data', (export_record.raw_brightdata_response IS NOT NULL AND export_record.raw_brightdata_response != '{}'::jsonb)
        )
      ELSE null
    END,
    'queue_item', CASE
      WHEN queue_record.id IS NOT NULL THEN
        jsonb_build_object(
          'status', queue_record.status,
          'created_at', queue_record.created_at,
          'trigger_reason', queue_record.trigger_reason,
          'minutes_old', EXTRACT(EPOCH FROM (now() - queue_record.created_at))/60
        )
      ELSE null
    END,
    'overall_status', CASE
      WHEN export_record.processing_status = 'completed' THEN 'completed'
      WHEN export_record.processing_status IN ('processed', 'vectorizing') THEN 'processing' 
      WHEN queue_record.status IN ('queued', 'processing') THEN 'in_progress'
      WHEN export_record.id IS NOT NULL THEN export_record.processing_status
      ELSE 'not_started'
    END
  );
  
  RETURN result;
END;
$$;