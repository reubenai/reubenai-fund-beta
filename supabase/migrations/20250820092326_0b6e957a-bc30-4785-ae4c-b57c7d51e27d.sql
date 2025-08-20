-- Emergency cancellation of paused analysis queue items from runaway incident
-- Update all paused items to cancelled status
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

-- Verification: Show cancellation results
SELECT 
  'Emergency Cancellation Summary' as operation,
  COUNT(*) as total_items_cancelled,
  MIN(created_at) as earliest_cancelled_item,
  MAX(created_at) as latest_cancelled_item,
  COUNT(DISTINCT fund_id) as funds_affected,
  array_agg(DISTINCT trigger_reason) as cancelled_trigger_reasons
FROM analysis_queue 
WHERE status = 'cancelled' 
  AND error_message LIKE '%emergency system stabilization%';