-- Comprehensive RLS Policy Fix - Complete the plan

-- Part 1: Complete Investment Strategies policies cleanup
DROP POLICY IF EXISTS "investment_strategies_insert_secure" ON public.investment_strategies;
DROP POLICY IF EXISTS "investment_strategies_delete_secure" ON public.investment_strategies;

-- Create INSERT policy for investment strategies
CREATE POLICY "investment_strategies_insert_simplified"
ON public.investment_strategies
FOR INSERT
TO authenticated
WITH CHECK (can_user_update_strategy(fund_id));

-- Create DELETE policy for investment strategies  
CREATE POLICY "investment_strategies_delete_simplified"
ON public.investment_strategies
FOR DELETE
TO authenticated
USING (can_user_update_strategy(fund_id));

-- Part 2: Fix Funds Table Policies - Replace mixed auth with consistent approach
DROP POLICY IF EXISTS "Ultra secure organization fund access" ON public.funds;
DROP POLICY IF EXISTS "Fund managers can create funds in their organization" ON public.funds;
DROP POLICY IF EXISTS "Users can view funds in their organization" ON public.funds;

-- Create security definer function for fund access
CREATE OR REPLACE FUNCTION public.can_user_access_fund(target_fund_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE 
    WHEN is_reuben_admin() THEN true
    ELSE EXISTS (
      SELECT 1
      FROM funds f
      JOIN profiles p ON f.organization_id = p.organization_id
      WHERE f.id = target_fund_id
        AND p.user_id = auth.uid()
        AND (p.is_deleted IS NULL OR p.is_deleted = false)
    )
  END;
$$;

-- Create security definer function for fund management
CREATE OR REPLACE FUNCTION public.can_user_manage_fund(target_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE 
    WHEN is_reuben_admin() THEN true
    ELSE EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.user_id = auth.uid()
        AND p.organization_id = target_org_id
        AND (p.is_deleted IS NULL OR p.is_deleted = false)
        AND p.role IN ('super_admin', 'admin', 'fund_manager')
    )
  END;
$$;

-- New simplified funds policies
CREATE POLICY "funds_select_simplified"
ON public.funds
FOR SELECT
TO authenticated
USING (can_user_access_fund(id));

CREATE POLICY "funds_insert_simplified"
ON public.funds
FOR INSERT
TO authenticated
WITH CHECK (can_user_manage_fund(organization_id));

CREATE POLICY "funds_update_simplified"
ON public.funds
FOR UPDATE
TO authenticated
USING (can_user_manage_fund(organization_id))
WITH CHECK (can_user_manage_fund(organization_id));

CREATE POLICY "funds_delete_simplified"
ON public.funds
FOR DELETE
TO authenticated
USING (can_user_manage_fund(organization_id));

-- Part 3: Fix Profiles Table Policies - Remove JWT claims parsing
DROP POLICY IF EXISTS "Users can update own profile with email validation" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON public.profiles;
DROP POLICY IF EXISTS "JWT Super admin profile access" ON public.profiles;

-- Create security definer function for profile access
CREATE OR REPLACE FUNCTION public.can_user_access_profile(target_user_id uuid, target_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE 
    WHEN is_reuben_admin() THEN true
    WHEN auth.uid() = target_user_id THEN true
    ELSE EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.user_id = auth.uid()
        AND p.organization_id = target_org_id
        AND (p.is_deleted IS NULL OR p.is_deleted = false)
    )
  END;
$$;

-- New simplified profiles policies
CREATE POLICY "profiles_select_simplified"
ON public.profiles
FOR SELECT
TO authenticated
USING (can_user_access_profile(user_id, organization_id));

CREATE POLICY "profiles_update_simplified"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR is_reuben_admin())
WITH CHECK (auth.uid() = user_id OR is_reuben_admin());

CREATE POLICY "profiles_insert_simplified"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Part 4: Add monitoring for RLS conflicts
CREATE TABLE IF NOT EXISTS public.rls_policy_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  operation text NOT NULL,
  user_id uuid,
  error_message text,
  context_data jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on the logging table
ALTER TABLE public.rls_policy_logs ENABLE ROW LEVEL SECURITY;

-- Policy for RLS logs (Reuben admins only)
CREATE POLICY "rls_logs_admin_only"
ON public.rls_policy_logs
FOR ALL
TO authenticated
USING (is_reuben_admin())
WITH CHECK (is_reuben_admin());