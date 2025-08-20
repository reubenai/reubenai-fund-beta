-- Emergency Platform Restoration Phase 1 - CORRECTED
-- Fix the orchestrator infinite loop catastrophe

-- 1. Kill all running orchestrator executions (use correct column names)
UPDATE orchestrator_executions 
SET step_status = 'emergency_stopped',
    error_details = 'Emergency restoration - orchestrator loop prevention',
    updated_at = now()
WHERE step_status = 'running' OR step_status = 'processing';

-- 2. Clear stalled analysis queue items (set to failed to prevent restart)
UPDATE analysis_queue 
SET status = 'emergency_paused',
    error_message = 'Emergency restoration - preventing infinite loops',
    updated_at = now()
WHERE status IN ('queued', 'processing');

-- 3. Create emergency ops control table if it doesn't exist
CREATE TABLE IF NOT EXISTS emergency_ops_control (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  control_key text NOT NULL UNIQUE,
  control_value text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  description text,
  last_changed_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE emergency_ops_control ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only Reuben admins
CREATE POLICY "Reuben admins can manage emergency controls" 
ON emergency_ops_control FOR ALL 
USING (is_reuben_email())
WITH CHECK (is_reuben_email());

-- 4. Insert critical emergency controls
INSERT INTO emergency_ops_control (control_key, control_value, enabled, description, last_changed_by) VALUES
('orchestrator_enabled', 'false', false, 'Global orchestrator kill switch - EMERGENCY', auth.uid()),
('auto_analysis_enabled', 'false', false, 'Auto analysis kill switch - EMERGENCY', auth.uid()),
('max_concurrent_orchestrations', '1', true, 'Emergency limit to prevent loops', auth.uid()),
('orchestrator_circuit_breaker', 'true', true, 'Emergency circuit breaker active', auth.uid()),
('cost_explosion_detected', 'true', true, 'Cost explosion prevention active', auth.uid())
ON CONFLICT (control_key) DO UPDATE SET
  control_value = EXCLUDED.control_value,
  enabled = EXCLUDED.enabled,
  updated_at = now(),
  last_changed_by = EXCLUDED.last_changed_by;

-- 5. Add cost explosion detection function
CREATE OR REPLACE FUNCTION detect_cost_explosion()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  recent_executions INTEGER;
  cost_estimate NUMERIC;
  alert_data JSONB;
BEGIN
  -- Count orchestrator executions in last hour
  SELECT COUNT(*) INTO recent_executions
  FROM orchestrator_executions 
  WHERE created_at > now() - interval '1 hour';
  
  -- Estimate cost (rough calculation)
  cost_estimate := recent_executions * 0.05; -- $0.05 per execution estimate
  
  alert_data := jsonb_build_object(
    'executions_last_hour', recent_executions,
    'estimated_cost_usd', cost_estimate,
    'alert_level', CASE 
      WHEN recent_executions > 1000 THEN 'CRITICAL'
      WHEN recent_executions > 500 THEN 'HIGH'
      WHEN recent_executions > 100 THEN 'MEDIUM'
      ELSE 'LOW'
    END,
    'emergency_shutdown_recommended', recent_executions > 1000,
    'timestamp', now()
  );
  
  RETURN alert_data;
END;
$$;