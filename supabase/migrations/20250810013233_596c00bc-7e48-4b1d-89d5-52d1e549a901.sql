-- Emergency fix for infinite recursion in RLS policies
-- Drop problematic policies and recreate with safe functions

-- First, temporarily disable RLS to prevent lockout
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.funds DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies that might be causing recursion
DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

DROP POLICY IF EXISTS "funds_delete" ON public.funds;
DROP POLICY IF EXISTS "funds_insert" ON public.funds;
DROP POLICY IF EXISTS "funds_select" ON public.funds;
DROP POLICY IF EXISTS "funds_update" ON public.funds;

DROP POLICY IF EXISTS "deals_delete" ON public.deals;
DROP POLICY IF EXISTS "deals_insert" ON public.deals;
DROP POLICY IF EXISTS "deals_select" ON public.deals;
DROP POLICY IF EXISTS "deals_update" ON public.deals;

-- Create a simple, non-recursive function to check super admin by email
CREATE OR REPLACE FUNCTION public.is_super_admin_by_email()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@goreuben.com' OR
    (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@reuben.com',
    false
  );
$$;

-- Create function to get org ID from JWT
CREATE OR REPLACE FUNCTION public.get_jwt_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
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

-- Ensure the user exists in profiles table
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

-- Update existing profile if it exists
UPDATE public.profiles 
SET 
  role = 'super_admin'::user_role,
  organization_id = '550e8400-e29b-41d4-a716-446655440000'::uuid,
  email = 'kat@goreuben.com'
WHERE user_id = '3df436f2-2160-4f23-a0c6-fca907858b5a';

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- Create simple, safe RLS policies for profiles
CREATE POLICY "Super admins can manage all profiles"
ON public.profiles
FOR ALL
USING (is_super_admin_by_email())
WITH CHECK (is_super_admin_by_email());

CREATE POLICY "Users can view and manage their own profile"
ON public.profiles
FOR ALL
USING (user_id = nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub','')::uuid)
WITH CHECK (user_id = nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub','')::uuid);

-- Create simple, safe RLS policies for funds
CREATE POLICY "Super admins can manage all funds"
ON public.funds
FOR ALL
USING (is_super_admin_by_email())
WITH CHECK (is_super_admin_by_email());

CREATE POLICY "Users can access funds in their organization"
ON public.funds
FOR SELECT
USING (organization_id = get_jwt_org_id());

-- Create simple, safe RLS policies for deals
CREATE POLICY "Super admins can manage all deals"
ON public.deals
FOR ALL
USING (is_super_admin_by_email())
WITH CHECK (is_super_admin_by_email());

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.funds TO authenticated;
GRANT ALL ON public.deals TO authenticated;