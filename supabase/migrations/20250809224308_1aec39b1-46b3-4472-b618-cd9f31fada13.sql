-- Phase 1: Data Cleanup - Clear problematic analysis data for fresh start

-- 1. Clear analysis queue (all pending/failed items)
DELETE FROM analysis_queue 
WHERE status IN ('queued', 'failed', 'processing');

-- 2. Clear problematic deal analyses (keep basic scores but remove enhanced data)
UPDATE deal_analyses 
SET 
  engine_results = '{}',
  confidence_scores = '{}',
  data_sources = '{}',
  validation_flags = '{}',
  mandate_snapshot = '{}',
  model_executions = '[]',
  prompt_audit = '{}',
  cost_tracking = '{}',
  degradation_events = '[]',
  recency_compliance = '{}'
WHERE updated_at > now() - interval '7 days';

-- 3. Reset deal analysis status to pending for failed items
UPDATE deals 
SET 
  analysis_queue_status = 'pending',
  last_analysis_trigger = NULL,
  enhanced_analysis = NULL
WHERE analysis_queue_status IN ('failed', 'processing');

-- 4. Clean up activity event noise (keep only important events from last 3 days)
DELETE FROM activity_events 
WHERE 
  activity_type IN ('analysis_started', 'analysis_progress', 'engine_update') 
  AND created_at < now() - interval '3 days';

-- 5. Clear analysis cost tracking (for fresh cost monitoring)
DELETE FROM analysis_cost_tracking 
WHERE created_at > now() - interval '7 days';

-- 6. Clear AI service interactions (performance noise)
DELETE FROM ai_service_interactions 
WHERE created_at > now() - interval '3 days';

-- 7. Clear deal analysis sources that might have bad data
DELETE FROM deal_analysis_sources 
WHERE 
  validated = false 
  OR confidence_score < 50 
  OR retrieved_at > now() - interval '7 days';

-- 8. Reset fund memory entries that might be corrupted
UPDATE fund_memory_entries 
SET 
  memory_content = '{}',
  trigger_count = 0,
  last_triggered_at = NULL
WHERE 
  validation_status = 'failed' 
  OR confidence_score < 30;

-- Log cleanup completion
INSERT INTO activity_events (
  user_id,
  fund_id,
  activity_type,
  title,
  description,
  context_data
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  'system_maintenance',
  'Analysis System Cleanup Completed',
  'Cleared problematic analysis data and reset systems for stabilization',
  jsonb_build_object(
    'cleanup_phase', 'phase_1_data_cleanup',
    'timestamp', now(),
    'scope', 'analysis_queue_deals_activities_costs_memory'
  )
);