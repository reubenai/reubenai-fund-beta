-- Phase 1: Nuclear Option - Database-Level Blocking

-- Insert hard disabled entries into analysis_allowlist
INSERT INTO analysis_allowlist (deal_id, test_phase, notes) VALUES 
  ('7ac26a5f-34c9-4d30-b09c-c05d1d1df81d', 'HARD_DISABLED', 'Emergency shutdown - excessive analysis activity'),
  ('98c22f44-87c7-4808-be1c-31929c3da52f', 'HARD_DISABLED', 'Emergency shutdown - excessive analysis activity')
ON CONFLICT (deal_id) DO UPDATE SET 
  test_phase = 'HARD_DISABLED',
  notes = 'Emergency shutdown - excessive analysis activity',
  created_at = now();

-- Update deals to block analysis until far future
UPDATE deals SET 
  analysis_blocked_until = '2026-01-01 00:00:00'::timestamp with time zone,
  auto_analysis_enabled = false,
  analysis_queue_status = 'PERMANENTLY_DISABLED',
  updated_at = now()
WHERE id IN ('7ac26a5f-34c9-4d30-b09c-c05d1d1df81d', '98c22f44-87c7-4808-be1c-31929c3da52f');

-- Phase 2: Queue System Complete Shutdown
-- Delete ALL existing queue items for these deals
DELETE FROM analysis_queue 
WHERE deal_id IN ('7ac26a5f-34c9-4d30-b09c-c05d1d1df81d', '98c22f44-87c7-4808-be1c-31929c3da52f');

-- Create trigger to auto-delete any new queue items for blocked deals
CREATE OR REPLACE FUNCTION prevent_blocked_deal_queuing()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if deal is in HARD_DISABLED state
  IF EXISTS (
    SELECT 1 FROM analysis_allowlist 
    WHERE deal_id = NEW.deal_id 
    AND test_phase = 'HARD_DISABLED'
  ) THEN
    -- Log the attempted queuing
    RAISE LOG 'EMERGENCY BLOCK: Prevented queuing of hard-disabled deal %', NEW.deal_id;
    -- Return NULL to prevent the insert
    RETURN NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on analysis_queue
DROP TRIGGER IF EXISTS block_disabled_deal_queuing ON analysis_queue;
CREATE TRIGGER block_disabled_deal_queuing
  BEFORE INSERT ON analysis_queue
  FOR EACH ROW
  EXECUTE FUNCTION prevent_blocked_deal_queuing();

-- Phase 5: Clean up recent artifacts and sources (last 24 hours)
DELETE FROM artifacts 
WHERE deal_id IN ('7ac26a5f-34c9-4d30-b09c-c05d1d1df81d', '98c22f44-87c7-4808-be1c-31929c3da52f')
AND created_at > now() - interval '24 hours';

DELETE FROM deal_analysis_sources 
WHERE deal_id IN ('7ac26a5f-34c9-4d30-b09c-c05d1d1df81d', '98c22f44-87c7-4808-be1c-31929c3da52f')
AND created_at > now() - interval '24 hours';

-- Add emergency blacklist entries for additional safety
INSERT INTO emergency_deal_blacklist (deal_id, reason, blocked_at, metadata)
VALUES 
  ('7ac26a5f-34c9-4d30-b09c-c05d1d1df81d', 'EMERGENCY_SHUTDOWN_EXCESSIVE_ACTIVITY', now(), '{"shutdown_type": "comprehensive", "trigger": "automated_runaway_analysis"}'),
  ('98c22f44-87c7-4808-be1c-31929c3da52f', 'EMERGENCY_SHUTDOWN_EXCESSIVE_ACTIVITY', now(), '{"shutdown_type": "comprehensive", "trigger": "automated_runaway_analysis"}')
ON CONFLICT (deal_id) DO UPDATE SET
  reason = 'EMERGENCY_SHUTDOWN_EXCESSIVE_ACTIVITY',
  blocked_at = now(),
  metadata = '{"shutdown_type": "comprehensive", "trigger": "automated_runaway_analysis"}';

-- Log the emergency shutdown
INSERT INTO activity_events (
  user_id,
  fund_id,
  deal_id,
  activity_type,
  priority,
  title,
  description,
  context_data
) 
SELECT 
  '550e8400-e29b-41d4-a716-446655440000'::uuid, -- System user
  d.fund_id,
  d.id,
  'emergency_shutdown',
  'critical',
  'Emergency Analysis Shutdown',
  'Comprehensive emergency shutdown implemented due to excessive analysis activity',
  jsonb_build_object(
    'shutdown_type', 'comprehensive_nuclear_option',
    'blocked_until', '2026-01-01',
    'measures_implemented', jsonb_build_array(
      'database_constraints',
      'queue_blocking_triggers', 
      'emergency_blacklist',
      'analysis_permanently_disabled'
    )
  )
FROM deals d 
WHERE d.id IN ('7ac26a5f-34c9-4d30-b09c-c05d1d1df81d', '98c22f44-87c7-4808-be1c-31929c3da52f');