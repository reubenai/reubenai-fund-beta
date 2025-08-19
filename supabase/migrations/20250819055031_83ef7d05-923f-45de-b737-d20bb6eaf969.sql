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