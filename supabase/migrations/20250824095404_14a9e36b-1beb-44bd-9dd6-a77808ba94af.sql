-- Complete stuck LinkedIn processing and queue items

-- Step 1: Complete processed LinkedIn exports that have data
UPDATE deal_enrichment_linkedin_export 
SET 
  processing_status = 'completed',
  processed_at = now(),
  updated_at = now()
WHERE processing_status = 'processed'
  AND raw_brightdata_response IS NOT NULL
  AND raw_brightdata_response != '{}'::jsonb
  AND processed_at IS NULL;

-- Step 2: Complete analysis queue items for deals with completed LinkedIn exports
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
  );

-- Step 3: Create a monitoring view for LinkedIn processing status
CREATE OR REPLACE VIEW linkedin_processing_monitor AS
SELECT 
  d.id as deal_id,
  d.company_name,
  dele.processing_status as linkedin_status,
  dele.created_at as linkedin_created_at,
  dele.processed_at as linkedin_processed_at,
  aq.status as queue_status,
  aq.created_at as queue_created_at,
  aq.completed_at as queue_completed_at,
  CASE 
    WHEN dele.processing_status = 'completed' AND aq.status = 'completed' THEN 'fully_completed'
    WHEN dele.processing_status = 'completed' AND aq.status IN ('queued', 'processing') THEN 'linkedin_done_queue_pending'
    WHEN dele.processing_status IN ('processing', 'processed') THEN 'in_progress'
    WHEN dele.id IS NULL AND aq.id IS NULL THEN 'not_started'
    ELSE 'partial'
  END as overall_status,
  EXTRACT(EPOCH FROM (now() - COALESCE(aq.created_at, dele.created_at)))/60 as minutes_since_start
FROM deals d
LEFT JOIN deal_enrichment_linkedin_export dele ON d.id = dele.deal_id
LEFT JOIN analysis_queue aq ON d.id = aq.deal_id
WHERE dele.created_at > now() - interval '24 hours' 
   OR aq.created_at > now() - interval '24 hours'
ORDER BY COALESCE(dele.created_at, aq.created_at) DESC;