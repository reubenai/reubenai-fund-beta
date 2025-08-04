-- Fix role hierarchy and permissions across the platform
-- This addresses critical security and access control issues

-- 1. Update the role checking function to properly handle super_admin access
CREATE OR REPLACE FUNCTION public.get_user_role_simple()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  user_role_value text;
BEGIN
  -- Check if this is a Reuben admin first (no profile lookup needed)
  IF (auth.email() LIKE '%@goreuben.com' OR auth.email() LIKE '%@reuben.com') THEN
    RETURN 'super_admin';
  END IF;
  
  -- Get role from profiles table
  SELECT role::text INTO user_role_value
  FROM public.profiles 
  WHERE user_id = auth.uid();
  
  RETURN COALESCE(user_role_value, 'viewer');
END;
$function$;

-- 2. Create a comprehensive access checking function
CREATE OR REPLACE FUNCTION public.has_fund_access(check_fund_id uuid, required_access text DEFAULT 'view')
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  user_role_value text;
  user_org_id uuid;
  fund_org_id uuid;
BEGIN
  -- Get user role
  user_role_value := public.get_user_role_simple();
  
  -- Super admins have access to everything
  IF user_role_value = 'super_admin' THEN
    RETURN true;
  END IF;
  
  -- Get user's organization
  SELECT organization_id INTO user_org_id
  FROM public.profiles 
  WHERE user_id = auth.uid();
  
  -- Get fund's organization
  SELECT organization_id INTO fund_org_id
  FROM public.funds 
  WHERE id = check_fund_id;
  
  -- Must be in same organization
  IF user_org_id IS NULL OR fund_org_id IS NULL OR user_org_id != fund_org_id THEN
    RETURN false;
  END IF;
  
  -- Check access level based on role and required access
  CASE required_access
    WHEN 'view' THEN
      RETURN user_role_value IN ('super_admin', 'admin', 'fund_manager', 'analyst', 'viewer');
    WHEN 'edit' THEN
      RETURN user_role_value IN ('super_admin', 'admin', 'fund_manager', 'analyst');
    WHEN 'manage' THEN
      RETURN user_role_value IN ('super_admin', 'admin', 'fund_manager');
    WHEN 'admin' THEN
      RETURN user_role_value IN ('super_admin', 'admin');
    ELSE
      RETURN false;
  END CASE;
END;
$function$;

-- 3. Update funds table RLS policies
DROP POLICY IF EXISTS "Users can view funds in their organization" ON public.funds;
DROP POLICY IF EXISTS "Users can manage funds based on role" ON public.funds;

CREATE POLICY "Super admins and org members can view funds"
ON public.funds FOR SELECT
USING (
  public.get_user_role_simple() = 'super_admin' OR
  organization_id IN (
    SELECT profiles.organization_id
    FROM profiles
    WHERE profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Admins and fund managers can manage funds"
ON public.funds FOR ALL
USING (
  public.get_user_role_simple() = 'super_admin' OR
  (organization_id IN (
    SELECT profiles.organization_id
    FROM profiles
    WHERE profiles.user_id = auth.uid()
  ) AND public.get_user_role_simple() IN ('admin', 'fund_manager'))
)
WITH CHECK (
  public.get_user_role_simple() = 'super_admin' OR
  (organization_id IN (
    SELECT profiles.organization_id
    FROM profiles
    WHERE profiles.user_id = auth.uid()
  ) AND public.get_user_role_simple() IN ('admin', 'fund_manager'))
);

-- 4. Update deals table RLS policies
DROP POLICY IF EXISTS "Users can view deals in their organization" ON public.deals;
DROP POLICY IF EXISTS "Users can manage deals based on role" ON public.deals;

CREATE POLICY "Users can view deals with proper access"
ON public.deals FOR SELECT
USING (
  public.get_user_role_simple() = 'super_admin' OR
  public.has_fund_access(fund_id, 'view')
);

CREATE POLICY "Users can manage deals with proper access"
ON public.deals FOR ALL
USING (
  public.get_user_role_simple() = 'super_admin' OR
  public.has_fund_access(fund_id, 'edit')
)
WITH CHECK (
  public.get_user_role_simple() = 'super_admin' OR
  public.has_fund_access(fund_id, 'edit')
);

-- 5. Update deal_analyses table RLS policies
DROP POLICY IF EXISTS "Users can view deal analyses in their organization" ON public.deal_analyses;
DROP POLICY IF EXISTS "Users can manage deal analyses based on role" ON public.deal_analyses;

CREATE POLICY "Users can view deal analyses with proper access"
ON public.deal_analyses FOR SELECT
USING (
  public.get_user_role_simple() = 'super_admin' OR
  deal_id IN (
    SELECT d.id FROM deals d 
    WHERE public.has_fund_access(d.fund_id, 'view')
  )
);

CREATE POLICY "Users can manage deal analyses with proper access"
ON public.deal_analyses FOR ALL
USING (
  public.get_user_role_simple() = 'super_admin' OR
  deal_id IN (
    SELECT d.id FROM deals d 
    WHERE public.has_fund_access(d.fund_id, 'edit')
  )
)
WITH CHECK (
  public.get_user_role_simple() = 'super_admin' OR
  deal_id IN (
    SELECT d.id FROM deals d 
    WHERE public.has_fund_access(d.fund_id, 'edit')
  )
);

-- 6. Ensure organizations table exists and has proper RLS
CREATE POLICY IF NOT EXISTS "Super admins can view all organizations"
ON public.organizations FOR SELECT
USING (public.get_user_role_simple() = 'super_admin');

CREATE POLICY IF NOT EXISTS "Users can view their organization"
ON public.organizations FOR SELECT
USING (
  id IN (
    SELECT profiles.organization_id
    FROM profiles
    WHERE profiles.user_id = auth.uid()
  )
);

-- 7. Update profiles RLS to allow super admins to see all profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON public.profiles;

CREATE POLICY "Users can view accessible profiles"
ON public.profiles FOR SELECT
USING (
  user_id = auth.uid() OR 
  public.get_user_role_simple() = 'super_admin' OR
  (organization_id IN (
    SELECT profiles.organization_id
    FROM profiles
    WHERE profiles.user_id = auth.uid()
  ) AND public.get_user_role_simple() IN ('admin', 'fund_manager'))
);

CREATE POLICY "Users can manage their own profile"
ON public.profiles FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Super admins can manage all profiles"
ON public.profiles FOR ALL
USING (public.get_user_role_simple() = 'super_admin')
WITH CHECK (public.get_user_role_simple() = 'super_admin');