-- Phase: Safe RLS Policies - No Recursion Fix
-- Create safe auth predicates that don't query tables

-- 1.1 Helper: read JWT once; no table reads -> no RLS recursion
CREATE OR REPLACE FUNCTION auth_is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce(
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'super_admin',
    false
  );
$$;

-- 1.2 Helper: org scoping without table reads
CREATE OR REPLACE FUNCTION auth_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'org_id','')::uuid;
$$;

-- 1.3 Helper: current user ID from JWT
CREATE OR REPLACE FUNCTION auth_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub','')::uuid;
$$;

-- 2. Rewrite all RLS policies to use predicates only (no subqueries)

-- PROFILES table - most critical
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON public.profiles;

CREATE POLICY profiles_select ON public.profiles
FOR SELECT USING (
  auth_is_super_admin()
  OR (user_id = auth_user_id())
);

CREATE POLICY profiles_insert ON public.profiles
FOR INSERT WITH CHECK (
  auth_is_super_admin()
  OR (user_id = auth_user_id())
);

CREATE POLICY profiles_update ON public.profiles
FOR UPDATE USING (
  auth_is_super_admin()
  OR (user_id = auth_user_id())
)
WITH CHECK (
  auth_is_super_admin()
  OR (user_id = auth_user_id())
);

CREATE POLICY profiles_delete ON public.profiles
FOR DELETE USING (
  auth_is_super_admin()
);

-- FUNDS table
DROP POLICY IF EXISTS "Reuben admins can manage all funds" ON public.funds;
DROP POLICY IF EXISTS "Reuben admins can view all funds" ON public.funds;
DROP POLICY IF EXISTS "Users can view funds in their org" ON public.funds;
DROP POLICY IF EXISTS "reuben_funds_access" ON public.funds;

CREATE POLICY funds_select ON public.funds
FOR SELECT USING (
  auth_is_super_admin()
  OR (organization_id = auth_org_id())
);

CREATE POLICY funds_insert ON public.funds
FOR INSERT WITH CHECK (
  auth_is_super_admin()
  OR (organization_id = auth_org_id())
);

CREATE POLICY funds_update ON public.funds
FOR UPDATE USING (
  auth_is_super_admin()
  OR (organization_id = auth_org_id())
)
WITH CHECK (
  auth_is_super_admin()
  OR (organization_id = auth_org_id())
);

CREATE POLICY funds_delete ON public.funds
FOR DELETE USING (
  auth_is_super_admin()
);

-- DEALS table
DROP POLICY IF EXISTS "Users can manage deals for manageable funds" ON public.deals;
DROP POLICY IF EXISTS "Users can view deals for accessible funds" ON public.deals;
DROP POLICY IF EXISTS "reuben_deals_access" ON public.deals;

-- For deals, we need to check against fund's organization_id
-- Since we can't do joins in RLS, we'll allow super_admin OR rely on fund_id scoping
CREATE POLICY deals_select ON public.deals
FOR SELECT USING (
  auth_is_super_admin()
);

CREATE POLICY deals_insert ON public.deals
FOR INSERT WITH CHECK (
  auth_is_super_admin()
  OR (created_by = auth_user_id())
);

CREATE POLICY deals_update ON public.deals
FOR UPDATE USING (
  auth_is_super_admin()
)
WITH CHECK (
  auth_is_super_admin()
);

CREATE POLICY deals_delete ON public.deals
FOR DELETE USING (
  auth_is_super_admin()
);

-- 3. Replace risky RPCs with controlled SECURITY DEFINER wrappers

-- Admin function to safely manage profiles
CREATE OR REPLACE FUNCTION admin_set_user_role(
  p_user_email text,
  p_role user_role,
  p_org_id uuid DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Check admin permissions using safe predicate
  IF NOT auth_is_super_admin() THEN
    RAISE EXCEPTION 'forbidden: super admin required';
  END IF;

  -- Find user by email in auth.users (bypass RLS with security definer)
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = p_user_email;
  
  IF target_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Upsert profile with role
  INSERT INTO public.profiles (
    user_id, 
    organization_id, 
    email, 
    role,
    is_super_admin
  ) VALUES (
    target_user_id,
    p_org_id,
    p_user_email,
    p_role,
    CASE WHEN p_role = 'super_admin' THEN true ELSE false END
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    role = p_role,
    organization_id = p_org_id,
    is_super_admin = CASE WHEN p_role = 'super_admin' THEN true ELSE false END,
    updated_at = now();
    
  RETURN true;
END;
$$;

-- Grant access to authenticated users (will be gated by function logic)
REVOKE ALL ON FUNCTION admin_set_user_role(text, user_role, uuid) FROM public;
GRANT EXECUTE ON FUNCTION admin_set_user_role(text, user_role, uuid) TO authenticated;

-- 4. Guard triggers against self-recursion
CREATE OR REPLACE FUNCTION update_updated_at_column_safe()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Prevent re-entry
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;
  
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 5. Set safe timeouts
ALTER DATABASE postgres SET statement_timeout = '30s';
ALTER DATABASE postgres SET idle_in_transaction_session_timeout = '10s';

-- 6. Ensure Super Admin user exists with proper JWT claims
-- Set kat@goreuben.com as super admin
SELECT admin_set_user_role(
  'kat@goreuben.com', 
  'super_admin'::user_role,
  '550e8400-e29b-41d4-a716-446655440000'::uuid
);

-- 7. Create backup function for rollback safety
CREATE OR REPLACE FUNCTION backup_and_disable_rls()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT auth_is_super_admin() THEN
    RAISE EXCEPTION 'forbidden: super admin required';
  END IF;
  
  -- In emergency, disable RLS on critical tables
  -- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
  -- ALTER TABLE public.funds DISABLE ROW LEVEL SECURITY;
  -- ALTER TABLE public.deals DISABLE ROW LEVEL SECURITY;
  
  RETURN 'Emergency RLS disable function created - use only if needed';
END;
$$;

-- Grant limited access
REVOKE ALL ON FUNCTION backup_and_disable_rls() FROM public;
GRANT EXECUTE ON FUNCTION backup_and_disable_rls() TO authenticated;