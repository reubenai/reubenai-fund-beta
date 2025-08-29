-- Remove all emergency block policies
DROP POLICY IF EXISTS "EMERGENCY_BLOCK_AI_INTERACTIONS_KERNEL_ASTRO" ON public.ai_service_interactions;
DROP POLICY IF EXISTS "EMERGENCY_BLOCK_EXECUTION_LOG_KERNEL_ASTRO" ON public.analysis_execution_log;
DROP POLICY IF EXISTS "EMERGENCY_BLOCK_QUEUE_KERNEL_ASTRO" ON public.analysis_queue;
DROP POLICY IF EXISTS "EMERGENCY_BLOCK_ARTIFACTS_KERNEL_ASTRO" ON public.artifacts;
DROP POLICY IF EXISTS "EMERGENCY_BLOCK_ANALYSES_KERNEL_ASTRO" ON public.deal_analyses;

-- Create rate limiting table
CREATE TABLE IF NOT EXISTS public.analysis_rate_limiter (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL,
  request_type TEXT NOT NULL DEFAULT 'analysis',
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  requested_by UUID,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on rate limiter
ALTER TABLE public.analysis_rate_limiter ENABLE ROW LEVEL SECURITY;

-- Create rate limiting function
CREATE OR REPLACE FUNCTION public.check_analysis_rate_limit(target_deal_id UUID, request_type_param TEXT DEFAULT 'analysis')
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_requests INTEGER;
  is_admin BOOLEAN;
BEGIN
  -- Check if user is Reuben admin (no rate limit)
  is_admin := (
    current_setting('request.jwt.claims', true)::jsonb ->> 'email' LIKE '%@goreuben.com' OR
    current_setting('request.jwt.claims', true)::jsonb ->> 'email' LIKE '%@reuben.com'
  );
  
  IF is_admin THEN
    RETURN TRUE;
  END IF;
  
  -- Count recent requests for this deal (last hour)
  SELECT COUNT(*) INTO recent_requests
  FROM public.analysis_rate_limiter
  WHERE deal_id = target_deal_id
    AND request_type = request_type_param
    AND requested_at > now() - interval '1 hour';
  
  -- Allow up to 5 requests per hour per deal
  RETURN recent_requests < 5;
END;
$$;

-- Create cleanup function for rate limiter
CREATE OR REPLACE FUNCTION public.cleanup_analysis_rate_limiter()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  DELETE FROM public.analysis_rate_limiter
  WHERE requested_at < now() - interval '24 hours';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Create proper RLS policies for ai_service_interactions
CREATE POLICY "Reuben admins can manage all AI interactions"
ON public.ai_service_interactions
FOR ALL
TO authenticated
USING (
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email' LIKE '%@goreuben.com') OR
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email' LIKE '%@reuben.com')
)
WITH CHECK (
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email' LIKE '%@goreuben.com') OR
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email' LIKE '%@reuben.com')
);

CREATE POLICY "Users can view AI interactions for accessible funds"
ON public.ai_service_interactions
FOR SELECT
TO authenticated
USING (user_can_access_fund(fund_id));

-- Create proper RLS policies for analysis_execution_log
CREATE POLICY "Reuben admins can manage all execution logs"
ON public.analysis_execution_log
FOR ALL
TO authenticated
USING (
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email' LIKE '%@goreuben.com') OR
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email' LIKE '%@reuben.com')
)
WITH CHECK (
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email' LIKE '%@goreuben.com') OR
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email' LIKE '%@reuben.com')
);

CREATE POLICY "Users can view execution logs for accessible funds"
ON public.analysis_execution_log
FOR SELECT
TO authenticated
USING (user_can_access_fund(fund_id));

-- Create proper RLS policies for analysis_queue
CREATE POLICY "Reuben admins can manage all analysis queue"
ON public.analysis_queue
FOR ALL
TO authenticated
USING (
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email' LIKE '%@goreuben.com') OR
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email' LIKE '%@reuben.com')
)
WITH CHECK (
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email' LIKE '%@goreuben.com') OR
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email' LIKE '%@reuben.com')
);

CREATE POLICY "Users can manage analysis queue for accessible funds"
ON public.analysis_queue
FOR ALL
TO authenticated
USING (user_can_access_fund(fund_id))
WITH CHECK (user_can_access_fund(fund_id));

-- Create proper RLS policies for artifacts
CREATE POLICY "Reuben admins can manage all artifacts"
ON public.artifacts
FOR ALL
TO authenticated
USING (
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email' LIKE '%@goreuben.com') OR
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email' LIKE '%@reuben.com')
)
WITH CHECK (
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email' LIKE '%@goreuben.com') OR
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email' LIKE '%@reuben.com')
);

CREATE POLICY "Users can manage artifacts for their organization"
ON public.artifacts
FOR ALL
TO authenticated
USING (org_id = get_jwt_org_id())
WITH CHECK (org_id = get_jwt_org_id());

-- Create proper RLS policies for deal_analyses
CREATE POLICY "Reuben admins can manage all deal analyses"
ON public.deal_analyses
FOR ALL
TO authenticated
USING (
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email' LIKE '%@goreuben.com') OR
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email' LIKE '%@reuben.com')
)
WITH CHECK (
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email' LIKE '%@goreuben.com') OR
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email' LIKE '%@reuben.com')
);

CREATE POLICY "Users can view deal analyses for their organization"
ON public.deal_analyses
FOR SELECT
TO authenticated
USING (
  (organization_id = get_jwt_org_id()) OR 
  (deal_id IN (
    SELECT d.id 
    FROM deals d 
    JOIN funds f ON d.fund_id = f.id 
    WHERE f.organization_id = get_jwt_org_id()
  ))
);

-- Create RLS policies for analysis_rate_limiter
CREATE POLICY "Services can log rate limit requests"
ON public.analysis_rate_limiter
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Reuben admins can manage rate limiter"
ON public.analysis_rate_limiter
FOR ALL
TO authenticated
USING (
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email' LIKE '%@goreuben.com') OR
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email' LIKE '%@reuben.com')
)
WITH CHECK (
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email' LIKE '%@goreuben.com') OR
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email' LIKE '%@reuben.com')
);

CREATE POLICY "Users can view rate limiter for accessible deals"
ON public.analysis_rate_limiter
FOR SELECT
TO authenticated
USING (
  deal_id IN (
    SELECT d.id 
    FROM deals d 
    JOIN funds f ON d.fund_id = f.id 
    WHERE user_can_access_fund(f.id)
  )
);