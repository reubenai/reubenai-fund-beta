-- COMPLETE RESET: Drop all dependent objects with CASCADE
DROP FUNCTION IF EXISTS public.get_user_role_simple() CASCADE;
DROP FUNCTION IF EXISTS public.is_reuben_admin() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.can_edit_fund_data() CASCADE;
DROP FUNCTION IF EXISTS public.can_manage_funds() CASCADE;
DROP FUNCTION IF EXISTS public.can_manage_users() CASCADE;
DROP FUNCTION IF EXISTS public.can_create_funds() CASCADE;
DROP FUNCTION IF EXISTS public.can_create_ic_meetings() CASCADE;
DROP FUNCTION IF EXISTS public.has_document_management_access() CASCADE;

-- Create ONE simple function for email check only
CREATE OR REPLACE FUNCTION public.is_reuben_email()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT auth.email() LIKE '%@goreuben.com' OR auth.email() LIKE '%@reuben.com';
$$;

-- Re-enable RLS on profiles with ONLY the simplest policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create ultra-simple policies
CREATE POLICY "users_own_profile" 
ON public.profiles 
FOR ALL 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "reuben_all_access" 
ON public.profiles 
FOR ALL 
USING (public.is_reuben_email())
WITH CHECK (public.is_reuben_email());

-- Fix deals table
CREATE POLICY "reuben_deals_access" 
ON public.deals 
FOR ALL 
USING (public.is_reuben_email())
WITH CHECK (public.is_reuben_email());

-- Fix deal_analyses table  
CREATE POLICY "reuben_analyses_access" 
ON public.deal_analyses 
FOR ALL 
USING (public.is_reuben_email())
WITH CHECK (public.is_reuben_email());

-- Fix funds table
CREATE POLICY "reuben_funds_access" 
ON public.funds 
FOR ALL 
USING (public.is_reuben_email())
WITH CHECK (public.is_reuben_email());