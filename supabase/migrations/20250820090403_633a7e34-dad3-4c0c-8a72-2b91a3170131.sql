-- CRITICAL EMERGENCY STOP - Simple Analysis Queue Pause
-- Stop all analysis queue processing immediately

-- 1. Pause all queued items to prevent infinite loops
UPDATE analysis_queue 
SET status = 'emergency_paused',
    error_message = 'Emergency pause - system restoration',
    updated_at = now()
WHERE status IN ('queued', 'processing');

-- 2. Create minimal emergency control table
CREATE TABLE IF NOT EXISTS emergency_ops_control (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  control_key text NOT NULL UNIQUE,
  control_value text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- 3. Insert critical kill switch
INSERT INTO emergency_ops_control (control_key, control_value, enabled) VALUES
('orchestrator_enabled', 'false', false),
('auto_analysis_enabled', 'false', false)
ON CONFLICT (control_key) DO UPDATE SET
  control_value = EXCLUDED.control_value,
  enabled = EXCLUDED.enabled;