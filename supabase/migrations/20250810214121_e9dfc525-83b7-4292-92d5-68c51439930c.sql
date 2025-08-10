-- Part 1: Create enhanced IC workflow state machine and triggers
-- Add memo workflow state tracking and audit trail

-- Update ic_memos table to support proper workflow states
ALTER TABLE public.ic_memos 
ADD COLUMN IF NOT EXISTS workflow_state TEXT DEFAULT 'draft' CHECK (workflow_state IN ('draft', 'submitted', 'approved', 'rejected', 'scheduled', 'voting', 'decided')),
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS scheduled_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS super_admin_override BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS override_reason TEXT;

-- Create memo workflow audit trail table
CREATE TABLE IF NOT EXISTS public.ic_memo_workflow_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memo_id UUID NOT NULL REFERENCES public.ic_memos(id) ON DELETE CASCADE,
  from_state TEXT,
  to_state TEXT NOT NULL,
  action_by UUID NOT NULL REFERENCES auth.users(id),
  action_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reason TEXT,
  is_override BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'
);

-- Enable RLS on workflow audit table
ALTER TABLE public.ic_memo_workflow_audit ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for workflow audit
CREATE POLICY "Users can view audit trail for accessible memos" 
ON public.ic_memo_workflow_audit 
FOR SELECT 
USING (
  memo_id IN (
    SELECT m.id 
    FROM public.ic_memos m
    JOIN public.funds f ON m.fund_id = f.id
    WHERE user_can_access_fund(f.id)
  )
);

CREATE POLICY "System can insert audit records" 
ON public.ic_memo_workflow_audit 
FOR INSERT 
WITH CHECK (true);

-- Create function to validate workflow state transitions
CREATE OR REPLACE FUNCTION public.validate_memo_workflow_transition(
  current_state TEXT,
  new_state TEXT,
  is_super_admin BOOLEAN DEFAULT false
) RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Super admin can override any transition
  IF is_super_admin THEN
    RETURN true;
  END IF;
  
  -- Valid transitions from each state
  CASE current_state
    WHEN 'draft' THEN
      RETURN new_state IN ('submitted', 'rejected');
    WHEN 'submitted' THEN
      RETURN new_state IN ('approved', 'rejected', 'draft');
    WHEN 'approved' THEN
      RETURN new_state IN ('scheduled', 'rejected');
    WHEN 'rejected' THEN
      RETURN new_state IN ('draft');
    WHEN 'scheduled' THEN
      RETURN new_state IN ('voting', 'approved');
    WHEN 'voting' THEN
      RETURN new_state IN ('decided', 'scheduled');
    WHEN 'decided' THEN
      RETURN false; -- Final state, no transitions allowed
    ELSE
      RETURN false;
  END CASE;
END;
$$;

-- Create function to log workflow state changes
CREATE OR REPLACE FUNCTION public.log_memo_workflow_change()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_user_id UUID;
  is_super_admin BOOLEAN;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  is_super_admin := auth_is_super_admin();
  
  -- Only log if workflow_state actually changed
  IF OLD.workflow_state IS DISTINCT FROM NEW.workflow_state THEN
    -- Validate transition (will be blocked by trigger if invalid)
    IF NOT validate_memo_workflow_transition(
      COALESCE(OLD.workflow_state, 'draft'), 
      NEW.workflow_state, 
      is_super_admin OR NEW.super_admin_override
    ) THEN
      RAISE EXCEPTION 'Invalid workflow transition from % to %', 
        COALESCE(OLD.workflow_state, 'draft'), NEW.workflow_state;
    END IF;
    
    -- Log the state change
    INSERT INTO public.ic_memo_workflow_audit (
      memo_id,
      from_state,
      to_state,
      action_by,
      reason,
      is_override,
      metadata
    ) VALUES (
      NEW.id,
      OLD.workflow_state,
      NEW.workflow_state,
      current_user_id,
      COALESCE(NEW.override_reason, 'State transition'),
      NEW.super_admin_override,
      jsonb_build_object(
        'timestamp', now(),
        'user_role', 'workflow_transition'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for workflow state changes
DROP TRIGGER IF EXISTS ic_memo_workflow_audit_trigger ON public.ic_memos;
CREATE TRIGGER ic_memo_workflow_audit_trigger
  BEFORE UPDATE ON public.ic_memos
  FOR EACH ROW
  EXECUTE FUNCTION log_memo_workflow_change();

-- Create controlled analysis trigger system
-- Update deals table to support controlled analysis
ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS last_analysis_trigger_reason TEXT,
ADD COLUMN IF NOT EXISTS analysis_blocked_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS analysis_failure_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS first_analysis_completed BOOLEAN DEFAULT false;

-- Create analysis catalyst tracking table
CREATE TABLE IF NOT EXISTS public.deal_analysis_catalysts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  catalyst_type TEXT NOT NULL CHECK (catalyst_type IN ('document_upload', 'note_added', 'manual_trigger', 'bulk_refresh', 'first_upload')),
  triggered_by UUID NOT NULL REFERENCES auth.users(id),
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  analysis_queued BOOLEAN DEFAULT false,
  queue_id UUID REFERENCES public.analysis_queue(id),
  metadata JSONB DEFAULT '{}'
);

-- Enable RLS on analysis catalysts
ALTER TABLE public.deal_analysis_catalysts ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for analysis catalysts
CREATE POLICY "Users can manage catalysts for accessible deals" 
ON public.deal_analysis_catalysts 
FOR ALL 
USING (
  deal_id IN (
    SELECT d.id 
    FROM public.deals d
    JOIN public.funds f ON d.fund_id = f.id
    WHERE user_can_access_fund(f.id)
  )
)
WITH CHECK (
  deal_id IN (
    SELECT d.id 
    FROM public.deals d
    JOIN public.funds f ON d.fund_id = f.id
    WHERE user_can_access_fund(f.id)
  )
);

-- Create smart batching control function
CREATE OR REPLACE FUNCTION public.should_queue_analysis(
  p_deal_id UUID,
  p_catalyst_type TEXT,
  p_user_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  deal_record RECORD;
  last_analysis_time TIMESTAMP WITH TIME ZONE;
  current_queue_count INTEGER;
  result JSONB;
BEGIN
  -- Get deal information
  SELECT * INTO deal_record 
  FROM public.deals 
  WHERE id = p_deal_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'Deal not found');
  END IF;
  
  -- Check if analysis is blocked
  IF deal_record.analysis_blocked_until > now() THEN
    RETURN jsonb_build_object(
      'allowed', false, 
      'reason', 'Analysis temporarily blocked due to previous failures',
      'blocked_until', deal_record.analysis_blocked_until
    );
  END IF;
  
  -- Get last analysis time for this deal
  SELECT MAX(created_at) INTO last_analysis_time
  FROM public.analysis_queue
  WHERE deal_id = p_deal_id
    AND status IN ('completed', 'processing');
  
  -- Enforce 24h cooldown unless override
  IF p_catalyst_type NOT IN ('first_upload', 'manual_trigger') 
     AND last_analysis_time > (now() - interval '24 hours') THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Analysis cooldown period active (24h)',
      'last_analysis', last_analysis_time
    );
  END IF;
  
  -- Check queue capacity
  SELECT COUNT(*) INTO current_queue_count
  FROM public.analysis_queue
  WHERE status IN ('queued', 'processing');
  
  IF current_queue_count >= 50 THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Analysis queue at capacity',
      'queue_count', current_queue_count
    );
  END IF;
  
  -- Allow analysis
  RETURN jsonb_build_object(
    'allowed', true,
    'priority', CASE 
      WHEN p_catalyst_type = 'first_upload' THEN 'high'
      WHEN p_catalyst_type = 'manual_trigger' THEN 'normal'
      ELSE 'low'
    END,
    'delay_minutes', CASE
      WHEN p_catalyst_type = 'first_upload' THEN 2
      WHEN p_catalyst_type = 'manual_trigger' THEN 5
      ELSE 15
    END
  );
END;
$$;