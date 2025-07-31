-- Update database functions to prevent recursive RLS issues
-- Use SECURITY DEFINER to prevent recursion on role checks

-- First, create a simple non-recursive function to get user role from profiles
CREATE OR REPLACE FUNCTION public.get_user_role_simple()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
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
$$;

-- Create safe access control functions that don't cause recursion
CREATE OR REPLACE FUNCTION public.can_create_funds()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  user_role_value text;
BEGIN
  user_role_value := public.get_user_role_simple();
  RETURN user_role_value IN ('super_admin', 'admin', 'fund_manager');
END;
$$;

CREATE OR REPLACE FUNCTION public.can_edit_fund_data()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  user_role_value text;
BEGIN
  user_role_value := public.get_user_role_simple();
  RETURN user_role_value IN ('super_admin', 'admin', 'fund_manager', 'analyst');
END;
$$;

CREATE OR REPLACE FUNCTION public.can_manage_funds()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  user_role_value text;
BEGIN
  user_role_value := public.get_user_role_simple();
  RETURN user_role_value IN ('super_admin', 'admin', 'fund_manager');
END;
$$;

CREATE OR REPLACE FUNCTION public.has_document_management_access()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  user_role_value text;
BEGIN
  user_role_value := public.get_user_role_simple();
  RETURN user_role_value IN ('super_admin', 'admin', 'fund_manager', 'analyst');
END;
$$;

CREATE OR REPLACE FUNCTION public.can_manage_users()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  user_role_value text;
BEGIN
  user_role_value := public.get_user_role_simple();
  RETURN user_role_value = 'super_admin';
END;
$$;

CREATE OR REPLACE FUNCTION public.can_create_ic_meetings()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  user_role_value text;
BEGIN
  user_role_value := public.get_user_role_simple();
  RETURN user_role_value IN ('super_admin', 'admin', 'fund_manager');
END;
$$;