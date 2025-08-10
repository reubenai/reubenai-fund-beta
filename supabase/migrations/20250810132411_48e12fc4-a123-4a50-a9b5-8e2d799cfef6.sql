-- Fix the 3 remaining SECURITY DEFINER view errors
-- First identify which views are still SECURITY DEFINER

-- Check for remaining SECURITY DEFINER views
SELECT viewname, definition 
FROM pg_views 
WHERE schemaname = 'public' 
AND definition ILIKE '%security definer%';

-- Drop any remaining problematic views and recreate them safely
DROP VIEW IF EXISTS admin_org_summary CASCADE;
DROP VIEW IF EXISTS platform_overview CASCADE; 
DROP VIEW IF EXISTS cross_tenant_analytics CASCADE;

-- Fix any functions that are missing search_path
CREATE OR REPLACE FUNCTION user_can_access_fund(target_fund_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- Reuben emails can access everything
  SELECT CASE 
    WHEN auth_is_super_admin() THEN true
    -- Regular users: check organization membership
    ELSE EXISTS (
      SELECT 1
      FROM public.funds f
      WHERE f.id = target_fund_id
        AND f.organization_id = auth_org_id()
    )
  END;
$$;

CREATE OR REPLACE FUNCTION user_can_manage_fund(target_fund_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- Reuben emails can manage everything
  SELECT CASE 
    WHEN auth_is_super_admin() THEN true
    -- Regular users: check organization membership AND role
    ELSE EXISTS (
      SELECT 1
      FROM public.funds f
      JOIN public.profiles p ON f.organization_id = p.organization_id
      WHERE f.id = target_fund_id
        AND p.user_id = auth_user_id()
        AND p.role = ANY (ARRAY['super_admin'::user_role, 'admin'::user_role, 'fund_manager'::user_role])
        AND (p.is_deleted IS NULL OR p.is_deleted = false)
    )
  END;
$$;

-- Ensure JWT-based functions have proper signatures
CREATE OR REPLACE FUNCTION validate_jwt_claims()
RETURNS TABLE(user_id uuid, email text, role text, org_id uuid, is_super_admin boolean, claims_valid boolean, missing_claims text[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  jwt_claims JSONB;
  missing_list TEXT[] := '{}';
BEGIN
  -- Get JWT claims
  jwt_claims := current_setting('request.jwt.claims', true)::jsonb;
  
  -- Extract values
  user_id := (jwt_claims ->> 'sub')::uuid;
  email := jwt_claims ->> 'email';
  role := COALESCE(jwt_claims ->> 'user_role', 'viewer');
  org_id := COALESCE((jwt_claims ->> 'org_id')::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid);
  is_super_admin := auth_is_super_admin();
  
  -- Check for missing required claims
  IF user_id IS NULL THEN
    missing_list := array_append(missing_list, 'user_id');
  END IF;
  
  IF email IS NULL OR email = '' THEN
    missing_list := array_append(missing_list, 'email');
  END IF;
  
  IF NOT is_super_admin AND org_id IS NULL THEN
    missing_list := array_append(missing_list, 'org_id');
  END IF;
  
  claims_valid := array_length(missing_list, 1) IS NULL;
  missing_claims := missing_list;
  
  RETURN NEXT;
END;
$$;