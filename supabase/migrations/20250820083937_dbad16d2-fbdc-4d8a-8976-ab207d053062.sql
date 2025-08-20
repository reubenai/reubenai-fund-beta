-- EMERGENCY PLATFORM RESTORATION - PHASE 1: IMMEDIATE STOP
-- Stop orchestrator infinite loops and clear stalled executions

-- 1. Kill all running analyses from the explosion period (Aug 17-20)
UPDATE analysis_queue 
SET status = 'failed',
    error_message = 'Emergency stop - orchestrator infinite loop detected',
    completed_at = now(),
    updated_at = now()
WHERE status IN ('queued', 'processing') 
  AND created_at >= '2025-08-17'::date
  AND created_at <= '2025-08-20'::date;

-- 2. Clear stalled orchestrator executions from explosion period
UPDATE orchestrator_executions 
SET status = 'emergency_stopped',
    error_message = 'Emergency stop - infinite loop detected',
    completed_at = now(),
    updated_at = now()
WHERE status IN ('running', 'pending')
  AND created_at >= '2025-08-17'::date;

-- 3. Add emergency circuit breaker for orchestrator executions
CREATE OR REPLACE FUNCTION public.orchestrator_circuit_breaker()
RETURNS TRIGGER AS $$
DECLARE
  recent_executions INTEGER;
  deal_executions_today INTEGER;
BEGIN
  -- Check for too many executions in last hour (circuit breaker)
  SELECT COUNT(*) INTO recent_executions
  FROM orchestrator_executions 
  WHERE workflow_type = NEW.workflow_type
    AND deal_id = NEW.deal_id
    AND created_at > now() - interval '1 hour';
    
  -- Check daily limit per deal
  SELECT COUNT(*) INTO deal_executions_today
  FROM orchestrator_executions
  WHERE deal_id = NEW.deal_id
    AND created_at::date = CURRENT_DATE;
    
  -- Emergency circuit breaker: max 10 executions per hour per deal
  IF recent_executions >= 10 THEN
    RAISE EXCEPTION 'CIRCUIT_BREAKER: Too many executions (%) for deal % in last hour', recent_executions, NEW.deal_id;
  END IF;
  
  -- Emergency daily limit: max 50 executions per deal per day
  IF deal_executions_today >= 50 THEN
    RAISE EXCEPTION 'DAILY_LIMIT: Deal % has reached daily execution limit (%)', NEW.deal_id, deal_executions_today;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply circuit breaker trigger
DROP TRIGGER IF EXISTS orchestrator_circuit_breaker_trigger ON orchestrator_executions;
CREATE TRIGGER orchestrator_circuit_breaker_trigger
  BEFORE INSERT ON orchestrator_executions
  FOR EACH ROW
  EXECUTE FUNCTION orchestrator_circuit_breaker();

-- 4. Add analysis rate limiting function
CREATE OR REPLACE FUNCTION public.enforce_analysis_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  analyses_today INTEGER;
  last_analysis TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check analyses in last 24 hours for this deal
  SELECT COUNT(*), MAX(created_at) 
  INTO analyses_today, last_analysis
  FROM analysis_queue
  WHERE deal_id = NEW.deal_id
    AND created_at > now() - interval '24 hours'
    AND status != 'failed';
    
  -- Rate limit: max 1 analysis per deal per day
  IF analyses_today > 0 AND last_analysis > now() - interval '24 hours' THEN
    RAISE EXCEPTION 'RATE_LIMIT: Deal % already analyzed in last 24 hours (last: %)', NEW.deal_id, last_analysis;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply rate limiting trigger
DROP TRIGGER IF EXISTS analysis_rate_limit_trigger ON analysis_queue;
CREATE TRIGGER analysis_rate_limit_trigger
  BEFORE INSERT ON analysis_queue
  FOR EACH ROW
  EXECUTE FUNCTION enforce_analysis_rate_limit();

-- 5. Create emergency ops control table
CREATE TABLE IF NOT EXISTS public.emergency_ops_control (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_key TEXT NOT NULL UNIQUE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  emergency_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.emergency_ops_control ENABLE ROW LEVEL SECURITY;

-- Create policy for Reuben admins only
CREATE POLICY "Reuben admins can manage emergency controls"
ON public.emergency_ops_control
FOR ALL
USING (is_reuben_email())
WITH CHECK (is_reuben_email());

-- Insert emergency controls
INSERT INTO public.emergency_ops_control (control_key, is_enabled, description, emergency_reason) VALUES
('orchestrator_enabled', false, 'Master kill switch for orchestrator engine', 'Infinite loop emergency stop'),
('auto_analysis_enabled', false, 'Auto-triggered analysis processing', 'Prevent cascade failures'),
('queue_processing_enabled', false, 'Analysis queue processing', 'Emergency maintenance mode'),
('cost_monitoring_enabled', true, 'Cost tracking and limits', 'Prevent cost explosion')
ON CONFLICT (control_key) DO UPDATE SET
  is_enabled = EXCLUDED.is_enabled,
  emergency_reason = EXCLUDED.emergency_reason,
  updated_at = now();

-- 6. Create cost explosion detection
CREATE OR REPLACE FUNCTION public.detect_cost_explosion()
RETURNS TABLE(
  period TEXT,
  total_executions BIGINT,
  unique_deals BIGINT,
  avg_executions_per_deal NUMERIC,
  cost_estimate NUMERIC,
  is_explosion BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH daily_stats AS (
    SELECT 
      created_at::date as analysis_date,
      COUNT(*) as executions,
      COUNT(DISTINCT deal_id) as deals,
      COUNT(*)::numeric / NULLIF(COUNT(DISTINCT deal_id), 0) as avg_per_deal
    FROM orchestrator_executions
    WHERE created_at >= CURRENT_DATE - interval '7 days'
    GROUP BY created_at::date
  )
  SELECT 
    analysis_date::text,
    executions,
    deals,
    ROUND(avg_per_deal, 2),
    ROUND(executions * 0.02, 2) as estimated_cost, -- $0.02 per execution estimate
    avg_per_deal > 100 as explosion_detected
  FROM daily_stats
  ORDER BY analysis_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Add trigger to update ops control timestamp
CREATE OR REPLACE FUNCTION update_ops_control_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ops_control_updated_at
  BEFORE UPDATE ON public.emergency_ops_control
  FOR EACH ROW
  EXECUTE FUNCTION update_ops_control_timestamp();