-- Fix security warnings by adding proper search_path to functions
SET search_path TO 'public';

-- Update all functions with proper search_path
CREATE OR REPLACE FUNCTION public.auth_uid()
RETURNS UUID 
LANGUAGE SQL 
STABLE 
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.auth_role()
RETURNS TEXT 
LANGUAGE SQL 
STABLE 
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::jsonb ->> 'user_role'),
    'viewer'
  );
$$;

CREATE OR REPLACE FUNCTION public.auth_org_id() 
RETURNS UUID 
LANGUAGE SQL 
STABLE 
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(
    CASE 
      WHEN (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@goreuben.com' OR
           (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@reuben.com'
      THEN '550e8400-e29b-41d4-a716-446655440000'::uuid
      ELSE nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'org_id','')::uuid
    END,
    '550e8400-e29b-41d4-a716-446655440000'::uuid -- Default to Reuben org
  );
$$;

CREATE OR REPLACE FUNCTION public.auth_is_super_admin()
RETURNS BOOLEAN 
LANGUAGE SQL 
STABLE 
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@goreuben.com' OR
    (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@reuben.com' OR
    (current_setting('request.jwt.claims', true)::jsonb ->> 'user_role') = 'super_admin',
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.validate_jwt_claims()
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  role TEXT,
  org_id UUID,
  is_super_admin BOOLEAN,
  claims_valid BOOLEAN,
  missing_claims TEXT[]
) 
LANGUAGE PLPGSQL 
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  jwt_claims JSONB;
  missing_list TEXT[] := '{}';
BEGIN
  -- Get JWT claims
  jwt_claims := current_setting('request.jwt.claims', true)::jsonb;
  
  -- Extract values
  user_id := auth.uid();
  email := jwt_claims ->> 'email';
  role := COALESCE(jwt_claims ->> 'user_role', 'viewer');
  org_id := auth_org_id();
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

CREATE OR REPLACE FUNCTION public.admin_get_all_funds_with_orgs()
RETURNS TABLE(
  id UUID,
  name TEXT,
  organization_id UUID,
  fund_type fund_type,
  description TEXT,
  target_size BIGINT,
  currency TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  organization_name TEXT
) 
LANGUAGE PLPGSQL 
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only super admins can access this function
  IF NOT auth_is_super_admin() THEN
    RAISE EXCEPTION 'Access denied: Super admin required';
  END IF;
  
  RETURN QUERY
  SELECT 
    f.id,
    f.name,
    f.organization_id,
    f.fund_type,
    f.description,
    f.target_size,
    f.currency,
    f.is_active,
    f.created_at,
    f.updated_at,
    o.name as organization_name
  FROM public.funds f
  LEFT JOIN public.organizations o ON f.organization_id = o.id
  WHERE f.is_active = true
  ORDER BY f.created_at DESC;
END;
$$;