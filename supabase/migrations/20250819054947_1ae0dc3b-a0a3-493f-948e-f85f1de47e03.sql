-- Force refresh analysis for Eluvo Health only
-- Clear any existing queue items and trigger fresh analysis

-- Clear existing queued items for this deal
DELETE FROM analysis_queue 
WHERE deal_id = '81c22db4-51bb-4c8a-b8e0-ec17918af497' 
  AND status IN ('queued', 'processing');

-- Update deal to mark for fresh analysis
UPDATE deals 
SET 
  last_analysis_trigger = now(),
  last_analysis_trigger_reason = 'force_refresh_eluvo_health',
  analysis_queue_status = 'pending'
WHERE id = '81c22db4-51bb-4c8a-b8e0-ec17918af497';

-- Insert high priority analysis queue item
INSERT INTO analysis_queue (
  deal_id,
  fund_id,
  status,
  priority,
  trigger_reason,
  metadata,
  max_attempts
) 
SELECT 
  '81c22db4-51bb-4c8a-b8e0-ec17918af497',
  fund_id,
  'queued',
  'high',
  'force_refresh',
  jsonb_build_object(
    'force_refresh', true,
    'skip_google_search', true,
    'target_engines', array['market-intelligence-engine', 'financial-engine', 'team-research-engine', 'product-ip-engine'],
    'company_name', 'Eluvo Health',
    'industry', 'Healthcare'
  ),
  3
FROM deals 
WHERE id = '81c22db4-51bb-4c8a-b8e0-ec17918af497';

-- Log the force refresh action using valid activity type
INSERT INTO activity_events (
  fund_id,
  deal_id,
  activity_type,
  title,
  description,
  context_data,
  priority,
  tags,
  is_system_event
)
SELECT
  fund_id,
  '81c22db4-51bb-4c8a-b8e0-ec17918af497',
  'analysis_refreshed',
  'Force refreshed analysis for Eluvo Health',
  'Manually triggered analysis refresh to fix market opportunity assessment for healthcare industry',
  jsonb_build_object(
    'company_name', 'Eluvo Health',
    'industry', 'Healthcare',
    'reason', 'market_opportunity_fix',
    'skip_google_search', true
  ),
  'high',
  array['analysis', 'force_refresh', 'healthcare', 'market_opportunity'],
  true
FROM deals 
WHERE id = '81c22db4-51bb-4c8a-b8e0-ec17918af497';