-- EMERGENCY FIX: Complete elimination of recursive RLS policies
-- This migration completely removes all recursive dependencies

-- Drop ALL existing RLS policies that might cause recursion
DROP POLICY IF EXISTS "funds_sel" ON public.funds;
DROP POLICY IF EXISTS "funds_ins" ON public.funds;
DROP POLICY IF EXISTS "funds_upd" ON public.funds;
DROP POLICY IF EXISTS "funds_del" ON public.funds;

DROP POLICY IF EXISTS "profiles_sel" ON public.profiles;
DROP POLICY IF EXISTS "profiles_ins" ON public.profiles;
DROP POLICY IF EXISTS "profiles_upd" ON public.profiles;
DROP POLICY IF EXISTS "profiles_del" ON public.profiles;

DROP POLICY IF EXISTS "organizations_sel" ON public.organizations;
DROP POLICY IF EXISTS "organizations_ins" ON public.organizations;
DROP POLICY IF EXISTS "organizations_upd" ON public.organizations;
DROP POLICY IF EXISTS "organizations_del" ON public.organizations;

DROP POLICY IF EXISTS "deals_sel" ON public.deals;
DROP POLICY IF EXISTS "deals_ins" ON public.deals;
DROP POLICY IF EXISTS "deals_upd" ON public.deals;
DROP POLICY IF EXISTS "deals_del" ON public.deals;

DROP POLICY IF EXISTS "deal_analyses_sel" ON public.deal_analyses;
DROP POLICY IF EXISTS "deal_analyses_ins" ON public.deal_analyses;
DROP POLICY IF EXISTS "deal_analyses_upd" ON public.deal_analyses;
DROP POLICY IF EXISTS "deal_analyses_del" ON public.deal_analyses;

-- Create simple, non-recursive email-based auth functions
CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::jsonb ->> 'email',
    ''
  );
$$;

CREATE OR REPLACE FUNCTION public.is_reuben_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    current_user_email() LIKE '%@goreuben.com' OR
    current_user_email() LIKE '%@reuben.com',
    false
  );
$$;

-- Create SIMPLE RLS policies that DON'T reference other tables

-- PROFILES: Super simple policies
CREATE POLICY "profiles_select_simple" ON public.profiles
FOR SELECT USING (
  is_reuben_admin() OR user_id = auth.uid()
);

CREATE POLICY "profiles_insert_simple" ON public.profiles
FOR INSERT WITH CHECK (
  is_reuben_admin() OR user_id = auth.uid()
);

CREATE POLICY "profiles_update_simple" ON public.profiles
FOR UPDATE USING (
  is_reuben_admin() OR user_id = auth.uid()
) WITH CHECK (
  is_reuben_admin() OR user_id = auth.uid()
);

CREATE POLICY "profiles_delete_simple" ON public.profiles
FOR DELETE USING (
  is_reuben_admin()
);

-- ORGANIZATIONS: Reuben admins can see all
CREATE POLICY "organizations_select_simple" ON public.organizations
FOR SELECT USING (
  is_reuben_admin()
);

CREATE POLICY "organizations_insert_simple" ON public.organizations
FOR INSERT WITH CHECK (
  is_reuben_admin()
);

CREATE POLICY "organizations_update_simple" ON public.organizations
FOR UPDATE USING (
  is_reuben_admin()
) WITH CHECK (
  is_reuben_admin()
);

CREATE POLICY "organizations_delete_simple" ON public.organizations
FOR DELETE USING (
  is_reuben_admin()
);

-- FUNDS: Reuben admins can see all
CREATE POLICY "funds_select_simple" ON public.funds
FOR SELECT USING (
  is_reuben_admin()
);

CREATE POLICY "funds_insert_simple" ON public.funds
FOR INSERT WITH CHECK (
  is_reuben_admin()
);

CREATE POLICY "funds_update_simple" ON public.funds
FOR UPDATE USING (
  is_reuben_admin()
) WITH CHECK (
  is_reuben_admin()
);

CREATE POLICY "funds_delete_simple" ON public.funds
FOR DELETE USING (
  is_reuben_admin()
);

-- DEALS: Reuben admins can see all
CREATE POLICY "deals_select_simple" ON public.deals
FOR SELECT USING (
  is_reuben_admin()
);

CREATE POLICY "deals_insert_simple" ON public.deals
FOR INSERT WITH CHECK (
  is_reuben_admin()
);

CREATE POLICY "deals_update_simple" ON public.deals
FOR UPDATE USING (
  is_reuben_admin()
) WITH CHECK (
  is_reuben_admin()
);

CREATE POLICY "deals_delete_simple" ON public.deals
FOR DELETE USING (
  is_reuben_admin()
);

-- DEAL_ANALYSES: Reuben admins can see all
CREATE POLICY "deal_analyses_select_simple" ON public.deal_analyses
FOR SELECT USING (
  is_reuben_admin()
);

CREATE POLICY "deal_analyses_insert_simple" ON public.deal_analyses
FOR INSERT WITH CHECK (
  is_reuben_admin()
);

CREATE POLICY "deal_analyses_update_simple" ON public.deal_analyses
FOR UPDATE USING (
  is_reuben_admin()
) WITH CHECK (
  is_reuben_admin()
);

CREATE POLICY "deal_analyses_delete_simple" ON public.deal_analyses
FOR DELETE USING (
  is_reuben_admin()
);

-- Fix the existing auth functions to use simple email checks
CREATE OR REPLACE FUNCTION public.auth_is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT is_reuben_admin();
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.current_user_email() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_reuben_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.auth_is_super_admin() TO authenticated;