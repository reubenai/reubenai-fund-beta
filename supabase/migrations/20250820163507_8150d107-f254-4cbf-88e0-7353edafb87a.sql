-- Comprehensive RLS Policy Cleanup for Investment Strategy Updates
-- This migration fixes conflicts and authentication inconsistencies

-- 1. First, drop all conflicting policies on deal_analyses
DROP POLICY IF EXISTS "deal_analyses_ultra_simple" ON public.deal_analyses;
DROP POLICY IF EXISTS "deal_analyses_select_simple" ON public.deal_analyses;
DROP POLICY IF EXISTS "deal_analyses_insert_simple" ON public.deal_analyses;
DROP POLICY IF EXISTS "deal_analyses_update_simple" ON public.deal_analyses;
DROP POLICY IF EXISTS "deal_analyses_delete_simple" ON public.deal_analyses;

-- 2. Create helper functions for consistent authentication
CREATE OR REPLACE FUNCTION public.auth_is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    auth.email() LIKE '%@goreuben.com' OR
    auth.email() LIKE '%@reuben.com',
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.auth_org_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    CASE 
      WHEN auth_is_super_admin() THEN '550e8400-e29b-41d4-a716-446655440000'::uuid
      ELSE (current_setting('request.jwt.claims', true)::jsonb ->> 'org_id')::uuid
    END,
    '550e8400-e29b-41d4-a716-446655440000'::uuid
  );
$$;

CREATE OR REPLACE FUNCTION public.jwt_is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT auth_is_super_admin();
$$;

CREATE OR REPLACE FUNCTION public.jwt_org_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT auth_org_id();
$$;

-- 3. Create new simplified and consistent deal_analyses policies
CREATE POLICY "Super admins can manage all deal analyses"
ON public.deal_analyses
FOR ALL
USING (auth_is_super_admin())
WITH CHECK (auth_is_super_admin());

CREATE POLICY "Users can view deal analyses for their organization"
ON public.deal_analyses
FOR SELECT
USING (
  organization_id = auth_org_id() OR
  deal_id IN (
    SELECT d.id 
    FROM public.deals d 
    JOIN public.funds f ON d.fund_id = f.id 
    WHERE f.organization_id = auth_org_id()
  )
);

CREATE POLICY "Services can manage deal analyses"
ON public.deal_analyses
FOR ALL
USING (true)
WITH CHECK (true);

-- 4. Update activity_events policies to use security definer functions
DROP POLICY IF EXISTS "JWT Super admin activity access" ON public.activity_events;
DROP POLICY IF EXISTS "JWT User activity access" ON public.activity_events;

CREATE POLICY "Super admins can manage all activities"
ON public.activity_events
FOR ALL
USING (auth_is_super_admin())
WITH CHECK (auth_is_super_admin());

CREATE POLICY "Users can manage activities for their organization"
ON public.activity_events
FOR ALL
USING (
  user_id = auth.uid() OR
  fund_id IN (
    SELECT f.id
    FROM public.funds f
    WHERE f.organization_id = auth_org_id()
  )
)
WITH CHECK (
  user_id = auth.uid() OR
  fund_id IN (
    SELECT f.id
    FROM public.funds f
    WHERE f.organization_id = auth_org_id()
  )
);

-- 5. Fix investment_strategies policies to ensure consistency
DROP POLICY IF EXISTS "Fund managers can manage strategies for their funds" ON public.investment_strategies;
DROP POLICY IF EXISTS "Users can view strategies for accessible funds" ON public.investment_strategies;

CREATE POLICY "Super admins can manage all investment strategies"
ON public.investment_strategies
FOR ALL
USING (auth_is_super_admin())
WITH CHECK (auth_is_super_admin());

CREATE POLICY "Users can manage investment strategies for their organization"
ON public.investment_strategies
FOR ALL
USING (
  fund_id IN (
    SELECT f.id
    FROM public.funds f
    WHERE f.organization_id = auth_org_id()
  )
)
WITH CHECK (
  fund_id IN (
    SELECT f.id
    FROM public.funds f
    WHERE f.organization_id = auth_org_id()
  )
);

-- 6. Update the trigger function to use security definer properly
CREATE OR REPLACE FUNCTION public.invalidate_deal_analyses_on_strategy_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Mark all deal analyses for this fund as needing re-analysis
  UPDATE public.deal_analyses 
  SET analysis_version = analysis_version + 1,
      updated_at = now()
  WHERE deal_id IN (
    SELECT id FROM public.deals WHERE fund_id = NEW.fund_id
  );
  
  -- Log the strategy change (only for updates, not initial creation)
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.activity_events (
      user_id,
      fund_id,
      activity_type,
      title,
      description,
      context_data
    ) VALUES (
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
      NEW.fund_id,
      'criteria_updated',
      'Investment Strategy Updated',
      'Investment strategy criteria and thresholds have been updated',
      jsonb_build_object(
        'strategy_id', NEW.id,
        'fund_type', NEW.fund_type,
        'updated_fields', jsonb_build_object(
          'enhanced_criteria_changed', OLD.enhanced_criteria != NEW.enhanced_criteria,
          'thresholds_changed', 
            OLD.exciting_threshold != NEW.exciting_threshold OR
            OLD.promising_threshold != NEW.promising_threshold OR
            OLD.needs_development_threshold != NEW.needs_development_threshold
        )
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- 7. Add monitoring for policy conflicts
CREATE OR REPLACE FUNCTION public.log_rls_policy_error()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- This function can be used to log RLS policy errors
  INSERT INTO public.activity_events (
    user_id,
    fund_id,
    activity_type,
    title,
    description,
    context_data
  ) VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    NULL,
    'rls_policy_error',
    'RLS Policy Error Detected',
    'A row level security policy error was detected',
    jsonb_build_object(
      'table_name', TG_TABLE_NAME,
      'operation', TG_OP,
      'timestamp', now()
    )
  );
  
  RETURN NULL;
END;
$$;