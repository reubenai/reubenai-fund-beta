-- ReubenAI Platform-wide Role & RLS Consistency Plan
-- A. Canonical role model (single source of truth)

-- 1. Define allowed roles once
CREATE TABLE IF NOT EXISTS public.roles_catalog (
  role TEXT PRIMARY KEY CHECK (role IN ('super_admin','admin','fund_manager','analyst','viewer'))
);

INSERT INTO public.roles_catalog(role) VALUES 
  ('super_admin'),
  ('admin'),
  ('fund_manager'),
  ('analyst'),
  ('viewer')
ON CONFLICT DO NOTHING;

-- 2. Safe helpers (no table reads; prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.auth_role() 
RETURNS TEXT 
LANGUAGE sql 
STABLE 
SET search_path = public
AS $$
  SELECT current_setting('request.jwt.claims', true)::jsonb->>'role';
$$;

CREATE OR REPLACE FUNCTION public.auth_org_id() 
RETURNS uuid 
LANGUAGE sql 
STABLE 
SET search_path = public
AS $$
  SELECT CASE 
    WHEN (current_setting('request.jwt.claims', true)::jsonb->>'email') LIKE '%@goreuben.com' OR
         (current_setting('request.jwt.claims', true)::jsonb->>'email') LIKE '%@reuben.com'
    THEN '550e8400-e29b-41d4-a716-446655440000'::uuid
    ELSE nullif(current_setting('request.jwt.claims', true)::jsonb->>'org_id','')::uuid
  END;
$$;

CREATE OR REPLACE FUNCTION public.auth_user_id() 
RETURNS uuid 
LANGUAGE sql 
STABLE 
SET search_path = public
AS $$
  SELECT nullif(current_setting('request.jwt.claims', true)::jsonb->>'sub','')::uuid;
$$;

CREATE OR REPLACE FUNCTION public.auth_is_super_admin() 
RETURNS boolean 
LANGUAGE sql 
STABLE 
SET search_path = public
AS $$
  SELECT COALESCE(
    auth_role() = 'super_admin' OR
    (current_setting('request.jwt.claims', true)::jsonb->>'email') LIKE '%@goreuben.com' OR
    (current_setting('request.jwt.claims', true)::jsonb->>'email') LIKE '%@reuben.com',
    false
  );
$$;

-- B. Reset all problematic policies and recreate with safe templates
-- First disable RLS temporarily to avoid lockout
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.funds DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view and manage their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can manage all funds" ON public.funds;
DROP POLICY IF EXISTS "Users can access funds in their organization" ON public.funds;
DROP POLICY IF EXISTS "Super admins can manage all deals" ON public.deals;

-- C. Privileges & defaults (deny by default)
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM public;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM public;

-- Grant minimal base privileges to authenticated role
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.funds TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- D. Apply safe policy templates

-- PROFILES policies
CREATE POLICY "profiles_sel" ON public.profiles
FOR SELECT USING (
  auth_is_super_admin()
  OR user_id = auth_user_id()
);

CREATE POLICY "profiles_ins" ON public.profiles
FOR INSERT WITH CHECK (
  auth_is_super_admin()
  OR user_id = auth_user_id()
);

CREATE POLICY "profiles_upd" ON public.profiles
FOR UPDATE USING (
  auth_is_super_admin()
  OR user_id = auth_user_id()
) WITH CHECK (
  auth_is_super_admin()
  OR user_id = auth_user_id()
);

CREATE POLICY "profiles_del" ON public.profiles
FOR DELETE USING (
  auth_is_super_admin()
);

-- FUNDS policies
CREATE POLICY "funds_sel" ON public.funds
FOR SELECT USING (
  auth_is_super_admin()
  OR organization_id = auth_org_id()
);

CREATE POLICY "funds_ins" ON public.funds
FOR INSERT WITH CHECK (
  auth_is_super_admin()
  OR organization_id = auth_org_id()
);

CREATE POLICY "funds_upd" ON public.funds
FOR UPDATE USING (
  auth_is_super_admin()
  OR organization_id = auth_org_id()
) WITH CHECK (
  auth_is_super_admin()
  OR organization_id = auth_org_id()
);

CREATE POLICY "funds_del" ON public.funds
FOR DELETE USING (
  auth_is_super_admin()
);

-- DEALS policies
CREATE POLICY "deals_sel" ON public.deals
FOR SELECT USING (
  auth_is_super_admin()
  OR EXISTS (
    SELECT 1 FROM public.funds f 
    WHERE f.id = deals.fund_id 
    AND f.organization_id = auth_org_id()
  )
);

CREATE POLICY "deals_ins" ON public.deals
FOR INSERT WITH CHECK (
  auth_is_super_admin()
  OR EXISTS (
    SELECT 1 FROM public.funds f 
    WHERE f.id = deals.fund_id 
    AND f.organization_id = auth_org_id()
  )
);

CREATE POLICY "deals_upd" ON public.deals
FOR UPDATE USING (
  auth_is_super_admin()
  OR EXISTS (
    SELECT 1 FROM public.funds f 
    WHERE f.id = deals.fund_id 
    AND f.organization_id = auth_org_id()
  )
) WITH CHECK (
  auth_is_super_admin()
  OR EXISTS (
    SELECT 1 FROM public.funds f 
    WHERE f.id = deals.fund_id 
    AND f.organization_id = auth_org_id()
  )
);

CREATE POLICY "deals_del" ON public.deals
FOR DELETE USING (
  auth_is_super_admin()
);

-- Ensure organizations table has basic policies
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orgs_sel" ON public.organizations
FOR SELECT USING (
  auth_is_super_admin()
  OR id = auth_org_id()
);

CREATE POLICY "orgs_ins" ON public.organizations
FOR INSERT WITH CHECK (
  auth_is_super_admin()
);

CREATE POLICY "orgs_upd" ON public.organizations
FOR UPDATE USING (
  auth_is_super_admin()
) WITH CHECK (
  auth_is_super_admin()
);

CREATE POLICY "orgs_del" ON public.organizations
FOR DELETE USING (
  auth_is_super_admin()
);

-- Ensure the super admin user exists properly
INSERT INTO public.profiles (user_id, email, role, organization_id)
SELECT 
  '3df436f2-2160-4f23-a0c6-fca907858b5a'::uuid,
  'kat@goreuben.com',
  'super_admin'::user_role,
  '550e8400-e29b-41d4-a716-446655440000'::uuid
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = '3df436f2-2160-4f23-a0c6-fca907858b5a'
);

-- Update existing profile
UPDATE public.profiles 
SET 
  role = 'super_admin'::user_role,
  organization_id = '550e8400-e29b-41d4-a716-446655440000'::uuid,
  email = 'kat@goreuben.com'
WHERE user_id = '3df436f2-2160-4f23-a0c6-fca907858b5a';

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION public.auth_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.auth_org_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.auth_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.auth_is_super_admin() TO authenticated;