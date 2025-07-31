-- Fix infinite recursion in RLS policies on profiles table
-- The issue is that is_reuben_admin() queries profiles table, but profiles RLS policy uses is_reuben_admin()

-- First, drop the existing problematic SELECT policy on profiles
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON public.profiles;

-- Create a new SELECT policy that doesn't cause recursion
-- This policy allows:
-- 1. Users to see their own profile (user_id = auth.uid())
-- 2. Users with @goreuben.com or @reuben.com emails to see all profiles
-- 3. Users to see other profiles in their organization
CREATE POLICY "Users can view profiles without recursion" 
ON public.profiles 
FOR SELECT 
USING (
  -- User can always see their own profile
  user_id = auth.uid() 
  OR 
  -- Reuben admin emails can see all profiles (without querying profiles table)
  (auth.email() LIKE '%@goreuben.com' OR auth.email() LIKE '%@reuben.com')
  OR 
  -- Users can see profiles in their organization (safe query)
  (organization_id IS NOT NULL AND organization_id IN (
    SELECT organization_id 
    FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND organization_id IS NOT NULL
  ))
);

-- Update the is_reuben_admin function to be safer in RLS context
-- This version prioritizes email checks over profile role checks
CREATE OR REPLACE FUNCTION public.is_reuben_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- First check email domains (no table queries needed)
  IF (auth.email() LIKE '%@goreuben.com' OR auth.email() LIKE '%@reuben.com') THEN
    RETURN true;
  END IF;
  
  -- Only check profile role if email check fails
  -- This is safer because it won't be called from profiles RLS in most cases
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  );
END;
$function$;