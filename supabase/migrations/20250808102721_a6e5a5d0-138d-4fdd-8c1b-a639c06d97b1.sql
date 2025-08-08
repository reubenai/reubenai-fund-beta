-- Fix infinite recursion in RLS policies by updating is_reuben_admin function
-- and removing circular dependencies

-- Update is_reuben_admin function to be completely safe (no table queries)
CREATE OR REPLACE FUNCTION public.is_reuben_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  -- ONLY use email check - no profile table queries to prevent recursion
  SELECT (auth.email() LIKE '%@goreuben.com' OR auth.email() LIKE '%@reuben.com');
$function$;

-- Update get_user_role_simple to be safer
CREATE OR REPLACE FUNCTION public.get_user_role_simple()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
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
  WHERE user_id = auth.uid()
    AND (is_deleted IS NULL OR is_deleted = false);
  
  RETURN COALESCE(user_role_value, 'viewer');
END;
$function$;

-- Fix profiles policies to prevent infinite recursion
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can delete users" ON public.profiles;

-- Create safe policies for profiles table
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (user_id = auth.uid() AND (is_deleted IS NULL OR is_deleted = false));

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (user_id = auth.uid() AND (is_deleted IS NULL OR is_deleted = false))
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Reuben admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (auth.email() LIKE '%@goreuben.com' OR auth.email() LIKE '%@reuben.com');

CREATE POLICY "Reuben admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (auth.email() LIKE '%@goreuben.com' OR auth.email() LIKE '%@reuben.com')
WITH CHECK (auth.email() LIKE '%@goreuben.com' OR auth.email() LIKE '%@reuben.com');

CREATE POLICY "Reuben admins can delete users" 
ON public.profiles 
FOR UPDATE 
USING (auth.email() LIKE '%@goreuben.com' OR auth.email() LIKE '%@reuben.com')
WITH CHECK (auth.email() LIKE '%@goreuben.com' OR auth.email() LIKE '%@reuben.com');