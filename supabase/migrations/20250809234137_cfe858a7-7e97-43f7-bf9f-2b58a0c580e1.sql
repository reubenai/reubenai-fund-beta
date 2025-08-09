-- Phase 6: Database Security & RLS - Fix all 21 linter warnings

-- Fix Function Search Path Issues (WARN 7-19: Function Search Path Mutable)
-- Update all functions to have explicit SET search_path = 'public'

-- Fix existing functions with search path
CREATE OR REPLACE FUNCTION public.user_can_access_fund(target_fund_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  -- Reuben emails have access to everything
  SELECT CASE 
    WHEN auth.email() LIKE '%@goreuben.com' OR auth.email() LIKE '%@reuben.com' THEN true
    -- Regular users: check organization membership
    ELSE EXISTS (
      SELECT 1
      FROM funds f
      JOIN profiles p ON f.organization_id = p.organization_id
      WHERE f.id = target_fund_id
        AND p.user_id = auth.uid()
        AND (p.is_deleted IS NULL OR p.is_deleted = false)
    )
  END;
$function$;

CREATE OR REPLACE FUNCTION public.user_can_manage_fund(target_fund_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  -- Reuben emails can manage everything
  SELECT CASE 
    WHEN auth.email() LIKE '%@goreuben.com' OR auth.email() LIKE '%@reuben.com' THEN true
    -- Regular users: check organization membership AND role
    ELSE EXISTS (
      SELECT 1
      FROM funds f
      JOIN profiles p ON f.organization_id = p.organization_id
      WHERE f.id = target_fund_id
        AND p.user_id = auth.uid()
        AND p.role = ANY (ARRAY['super_admin'::user_role, 'admin'::user_role, 'fund_manager'::user_role])
        AND (p.is_deleted IS NULL OR p.is_deleted = false)
    )
  END;
$function$;

CREATE OR REPLACE FUNCTION public.user_can_access_activity(activity_fund_id uuid, activity_deal_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  -- Reuben emails have access to everything
  SELECT CASE 
    WHEN auth.email() LIKE '%@goreuben.com' OR auth.email() LIKE '%@reuben.com' THEN true
    -- Regular users: check organization membership via fund_id OR deal_id
    WHEN activity_fund_id IS NOT NULL THEN user_can_access_fund(activity_fund_id)
    WHEN activity_deal_id IS NOT NULL THEN EXISTS (
      SELECT 1
      FROM deals d
      WHERE d.id = activity_deal_id
        AND user_can_access_fund(d.fund_id)
    )
    ELSE false
  END;
$function$;

CREATE OR REPLACE FUNCTION public.user_can_manage_activity(activity_fund_id uuid, activity_deal_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  -- Reuben emails can manage everything
  SELECT CASE 
    WHEN auth.email() LIKE '%@goreuben.com' OR auth.email() LIKE '%@reuben.com' THEN true
    -- Regular users: check management permissions via fund_id OR deal_id
    WHEN activity_fund_id IS NOT NULL THEN user_can_manage_fund(activity_fund_id)
    WHEN activity_deal_id IS NOT NULL THEN EXISTS (
      SELECT 1
      FROM deals d
      WHERE d.id = activity_deal_id
        AND user_can_manage_fund(d.fund_id)
    )
    ELSE false
  END;
$function$;

CREATE OR REPLACE FUNCTION public.is_reuben_email()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT auth.email() LIKE '%@goreuben.com' OR auth.email() LIKE '%@reuben.com';
$function$;

CREATE OR REPLACE FUNCTION public.is_admin_by_email()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT (auth.email() LIKE '%@goreuben.com' OR auth.email() LIKE '%@reuben.com');
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_llm_cache()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  DELETE FROM public.llm_cache 
  WHERE created_at < (now() - interval '24 hours');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;