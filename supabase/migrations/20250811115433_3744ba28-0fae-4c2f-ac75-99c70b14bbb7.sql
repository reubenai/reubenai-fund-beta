-- Step 0 & 1: Create allowlist table and pause existing queue
CREATE TABLE IF NOT EXISTS analysis_allowlist (
  deal_id uuid PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  test_phase text DEFAULT 'safe_mode_test',
  notes text
);

-- Enable RLS on allowlist table
ALTER TABLE analysis_allowlist ENABLE ROW LEVEL SECURITY;

-- Policy for Reuben admins to manage allowlist
CREATE POLICY "Reuben admins can manage analysis allowlist" ON analysis_allowlist
FOR ALL USING (is_reuben_email());

-- Add environment configuration table
CREATE TABLE IF NOT EXISTS analysis_environment_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text UNIQUE NOT NULL,
  config_value text NOT NULL,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE analysis_environment_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reuben admins can manage environment config" ON analysis_environment_config
FOR ALL USING (is_reuben_email());

-- Insert safe mode environment flags
INSERT INTO analysis_environment_config (config_key, config_value, enabled) VALUES
  ('ANALYSIS_SAFE_MODE', 'on', true),
  ('ANALYSIS_INTAKE', 'off', true),
  ('REANALYSIS_AUTOTRIGGERS', 'off', true),
  ('MAX_CONCURRENCY', '1', true)
ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  enabled = EXCLUDED.enabled,
  updated_at = now();

-- Step 1: Pause existing queue (except allowlisted)
UPDATE analysis_queue 
SET status = 'paused', updated_at = now()
WHERE status IN ('queued', 'processing');

-- Function to reclaim zombie analysis jobs with allowlist support
CREATE OR REPLACE FUNCTION reclaim_zombie_analysis_jobs()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  reclaimed_count integer := 0;
  zombie_threshold interval := interval '10 minutes';
BEGIN
  -- Update zombie jobs back to queued, but only for allowlisted deals during safe mode
  UPDATE analysis_queue 
  SET 
    status = 'queued',
    attempts = attempts + 1,
    started_at = null,
    updated_at = now()
  WHERE status = 'processing' 
    AND updated_at < (now() - zombie_threshold)
    AND (
      -- During safe mode, only reclaim allowlisted deals
      EXISTS (SELECT 1 FROM analysis_allowlist a WHERE a.deal_id = analysis_queue.deal_id)
      OR
      -- If not in safe mode, reclaim all
      NOT EXISTS (SELECT 1 FROM analysis_environment_config WHERE config_key = 'ANALYSIS_SAFE_MODE' AND config_value = 'on')
    );
  
  GET DIAGNOSTICS reclaimed_count = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'reclaimed_count', reclaimed_count,
    'zombie_threshold_minutes', extract(epoch from zombie_threshold) / 60,
    'timestamp', now()
  );
END;
$$;

-- Function to safely process only allowlisted deals
CREATE OR REPLACE FUNCTION process_analysis_queue_safe(
  batch_size integer DEFAULT 2,
  max_concurrent integer DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  processing_count integer;
  claimed_count integer := 0;
  safe_mode_enabled boolean;
BEGIN
  -- Check if safe mode is enabled
  SELECT (config_value = 'on') INTO safe_mode_enabled
  FROM analysis_environment_config 
  WHERE config_key = 'ANALYSIS_SAFE_MODE' AND enabled = true;
  
  IF NOT COALESCE(safe_mode_enabled, false) THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Safe mode not enabled');
  END IF;
  
  -- Check current processing count
  SELECT COUNT(*) INTO processing_count
  FROM analysis_queue 
  WHERE status = 'processing';
  
  -- Respect max concurrency
  IF processing_count >= max_concurrent THEN
    RETURN jsonb_build_object(
      'status', 'throttled',
      'message', 'Max concurrent limit reached',
      'current_processing', processing_count,
      'max_concurrent', max_concurrent
    );
  END IF;
  
  -- Claim items for processing (ONLY from allowlist)
  WITH claimable AS (
    SELECT q.id
    FROM analysis_queue q
    INNER JOIN analysis_allowlist a ON q.deal_id = a.deal_id
    WHERE q.status = 'queued'
      AND (q.scheduled_for IS NULL OR q.scheduled_for <= now())
    ORDER BY q.created_at
    LIMIT LEAST(batch_size, max_concurrent - processing_count)
    FOR UPDATE SKIP LOCKED
  )
  UPDATE analysis_queue 
  SET 
    status = 'processing',
    started_at = now(),
    updated_at = now()
  WHERE id IN (SELECT id FROM claimable);
  
  GET DIAGNOSTICS claimed_count = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'status', 'success',
    'claimed_items', claimed_count,
    'safe_mode', true,
    'allowlist_only', true,
    'processing_count', processing_count + claimed_count,
    'max_concurrent', max_concurrent
  );
END;
$$;