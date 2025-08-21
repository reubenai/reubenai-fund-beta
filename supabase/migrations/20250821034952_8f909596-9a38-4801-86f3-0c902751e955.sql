-- Phase 1: Emergency Block Astro Deal (98c22f44-87c7-4808-be1c-31929c3da52f)
-- First check if emergency_deal_blacklist exists and add Astro
INSERT INTO public.emergency_deal_blacklist (deal_id, reason, blocked_at)
VALUES (
  '98c22f44-87c7-4808-be1c-31929c3da52f',
  'EMERGENCY_SHUTDOWN_EXCESSIVE_ACTIVITY',
  now()
)
ON CONFLICT (deal_id) DO UPDATE SET
  reason = EXCLUDED.reason,
  blocked_at = now();

-- Update both deals with blocking parameters
UPDATE public.deals 
SET 
  analysis_blocked_until = '2030-01-01 00:00:00+00',
  analysis_queue_status = 'blocked',
  auto_analysis_enabled = false,
  updated_at = now()
WHERE id IN ('98c22f44-87c7-4808-be1c-31929c3da52f', '7ac26a5f-34c9-4d30-b09c-c05d1d1df81d');

-- Cancel all queued/processing analysis for both deals
UPDATE public.analysis_queue 
SET 
  status = 'cancelled',
  error_message = 'Deal blocked due to excessive system activity',
  completed_at = now(),
  updated_at = now()
WHERE deal_id IN ('7ac26a5f-34c9-4d30-b09c-c05d1d1df81d', '98c22f44-87c7-4808-be1c-31929c3da52f')
  AND status IN ('queued', 'processing');

-- Add comprehensive engine blocks
INSERT INTO public.ops_control_switches (switch_name, enabled, switch_type, description)
VALUES 
  ('orchestrator_circuit_breaker', true, 'circuit_breaker', 'Emergency circuit breaker for orchestrator engine'),
  ('feature_extraction_engine_disabled', true, 'engine_disable', 'Disable feature extraction engine'),
  ('market_intelligence_engine_disabled', true, 'engine_disable', 'Disable market intelligence engine'),
  ('team_research_engine_disabled', true, 'engine_disable', 'Disable team research engine'),
  ('product_ip_engine_disabled', true, 'engine_disable', 'Disable product IP engine'),
  ('financial_engine_disabled', true, 'engine_disable', 'Disable financial engine'),
  ('thesis_alignment_engine_disabled', true, 'engine_disable', 'Disable thesis alignment engine'),
  ('universal_analysis_processor_disabled', true, 'engine_disable', 'Disable universal analysis processor'),
  ('universal_deal_processor_disabled', true, 'engine_disable', 'Disable universal deal processor')
ON CONFLICT (switch_name) DO UPDATE SET
  enabled = EXCLUDED.enabled,
  updated_at = now();

-- Create monitoring trigger to log unauthorized analysis attempts
CREATE OR REPLACE FUNCTION public.log_unauthorized_analysis_attempts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Log any attempt to queue analysis for blocked deals
  IF NEW.deal_id IN ('7ac26a5f-34c9-4d30-b09c-c05d1d1df81d', '98c22f44-87c7-4808-be1c-31929c3da52f') THEN
    INSERT INTO public.activity_events (
      user_id,
      fund_id,
      activity_type,
      priority,
      title,
      description,
      context_data
    ) VALUES (
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
      NEW.fund_id,
      'unauthorized_analysis_attempt',
      'high',
      'BLOCKED: Unauthorized Analysis Attempt',
      'Attempt to queue analysis for emergency-blocked deal detected and prevented',
      jsonb_build_object(
        'deal_id', NEW.deal_id,
        'trigger_reason', NEW.trigger_reason,
        'priority', NEW.priority,
        'blocked_at', now(),
        'security_alert', true
      )
    );
    
    -- Prevent the insertion by raising an exception
    RAISE EXCEPTION 'Deal % is emergency blocked - analysis not permitted', NEW.deal_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger to monitor analysis_queue insertions
DROP TRIGGER IF EXISTS trigger_log_unauthorized_analysis ON public.analysis_queue;
CREATE TRIGGER trigger_log_unauthorized_analysis
  BEFORE INSERT ON public.analysis_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.log_unauthorized_analysis_attempts();