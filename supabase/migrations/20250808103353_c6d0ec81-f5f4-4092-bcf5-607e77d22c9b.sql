-- COMPLETE RESET: Disable RLS temporarily to break all recursion
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop ALL policies to ensure clean slate
DROP POLICY IF EXISTS "Allow user to view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow user to update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Reuben email admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Reuben email admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Reuben email admins can delete profiles" ON public.profiles;

-- Drop ALL functions that might cause recursion
DROP FUNCTION IF EXISTS public.get_user_role_simple();
DROP FUNCTION IF EXISTS public.is_reuben_admin();
DROP FUNCTION IF EXISTS public.get_user_role();
DROP FUNCTION IF EXISTS public.can_edit_fund_data();
DROP FUNCTION IF EXISTS public.can_manage_funds();
DROP FUNCTION IF EXISTS public.can_manage_users();
DROP FUNCTION IF EXISTS public.can_create_funds();
DROP FUNCTION IF EXISTS public.can_create_ic_meetings();
DROP FUNCTION IF EXISTS public.has_document_management_access();

-- Create ONE simple function for email check only
CREATE OR REPLACE FUNCTION public.is_reuben_email()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT auth.email() LIKE '%@goreuben.com' OR auth.email() LIKE '%@reuben.com';
$$;

-- Re-enable RLS with ONLY the simplest policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create ultra-simple policies with no function dependencies
CREATE POLICY "users_own_profile" 
ON public.profiles 
FOR ALL 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Separate super simple policy for Reuben emails
CREATE POLICY "reuben_all_access" 
ON public.profiles 
FOR ALL 
USING (public.is_reuben_email())
WITH CHECK (public.is_reuben_email());

-- Fix funds table policies too
ALTER TABLE public.funds DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Reuben admins can view all funds" ON public.funds;
DROP POLICY IF EXISTS "Users can view funds in their org" ON public.funds;
DROP POLICY IF EXISTS "Reuben admins can manage all funds" ON public.funds;

ALTER TABLE public.funds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reuben_funds_access" 
ON public.funds 
FOR ALL 
USING (public.is_reuben_email())
WITH CHECK (public.is_reuben_email());

CREATE POLICY "org_funds_access" 
ON public.funds 
FOR SELECT 
USING (
  organization_id = (
    SELECT organization_id 
    FROM public.profiles 
    WHERE user_id = auth.uid() 
    LIMIT 1
  )
);