-- Emergency cancellation of paused analysis queue items from runaway incident
-- Step 1: Update all paused items to cancelled status
UPDATE analysis_queue 
SET 
  status = 'cancelled',
  completed_at = now(),
  error_message = 'Cancelled during emergency system stabilization - queue items from runaway analysis incident',
  metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
    'cancellation_reason', 'emergency_stabilization',
    'cancelled_at', now(),
    'original_status', 'paused',
    'incident_type', 'runaway_analysis'
  ),
  updated_at = now()
WHERE status = 'paused';

-- Step 2: Log the bulk cancellation action in activity_events using valid activity_type
INSERT INTO activity_events (
  user_id,
  fund_id,
  activity_type,
  priority,
  title,
  description,
  context_data,
  is_system_event
)
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid, -- System user
  fund_id,
  'system_maintenance', -- Using valid activity_type
  'critical',
  'Emergency Queue Cleanup',
  'Bulk cancellation of paused analysis queue items during system stabilization',
  jsonb_build_object(
    'items_cancelled', (SELECT COUNT(*) FROM analysis_queue WHERE status = 'cancelled' AND error_message LIKE '%emergency system stabilization%'),
    'cancellation_timestamp', now(),
    'incident_type', 'runaway_analysis_cleanup',
    'safety_measure', true
  ),
  true
FROM (
  SELECT DISTINCT fund_id 
  FROM analysis_queue 
  WHERE status = 'cancelled' 
    AND error_message LIKE '%emergency system stabilization%'
) AS affected_funds;

-- Step 3: Verification query 
SELECT 
  'Emergency Cancellation Complete' as status,
  COUNT(*) as items_cancelled,
  MIN(created_at) as earliest_cancelled_item,
  MAX(created_at) as latest_cancelled_item,
  array_agg(DISTINCT trigger_reason) as cancelled_trigger_reasons
FROM analysis_queue 
WHERE status = 'cancelled' 
  AND error_message LIKE '%emergency system stabilization%';