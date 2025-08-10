-- Add admin functions for safe access to admin data
-- These will bypass RLS for super admins while ensuring security

-- Function to get all profiles for admin use
CREATE OR REPLACE FUNCTION public.admin_get_all_profiles()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  email text,
  first_name text,
  last_name text,
  role user_role,
  organization_id uuid,
  is_deleted boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is super admin
  IF NOT auth_is_super_admin() THEN
    RAISE EXCEPTION 'forbidden: super admin required';
  END IF;
  
  RETURN QUERY
  SELECT p.id, p.user_id, p.email, p.first_name, p.last_name, p.role, p.organization_id, p.is_deleted, p.created_at, p.updated_at
  FROM public.profiles p
  WHERE p.is_deleted IS NOT TRUE
  ORDER BY p.created_at DESC;
END;
$$;

-- Function to get all organizations for admin use
CREATE OR REPLACE FUNCTION public.admin_get_all_organizations()
RETURNS TABLE (
  id uuid,
  name text,
  domain text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is super admin
  IF NOT auth_is_super_admin() THEN
    RAISE EXCEPTION 'forbidden: super admin required';
  END IF;
  
  RETURN QUERY
  SELECT o.id, o.name, o.domain, o.created_at, o.updated_at
  FROM public.organizations o
  ORDER BY o.created_at DESC;
END;
$$;

-- Function to get all funds for admin use
CREATE OR REPLACE FUNCTION public.admin_get_all_funds()
RETURNS TABLE (
  id uuid,
  name text,
  organization_id uuid,
  fund_type fund_type,
  target_size bigint,
  currency text,
  is_active boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is super admin
  IF NOT auth_is_super_admin() THEN
    RAISE EXCEPTION 'forbidden: super admin required';
  END IF;
  
  RETURN QUERY
  SELECT f.id, f.name, f.organization_id, f.fund_type, f.target_size, f.currency, f.is_active, f.created_at, f.updated_at
  FROM public.funds f
  ORDER BY f.created_at DESC;
END;
$$;

-- Function to update user role (admin only)
CREATE OR REPLACE FUNCTION public.admin_update_user_role(p_user_id uuid, p_role user_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is super admin
  IF NOT auth_is_super_admin() THEN
    RAISE EXCEPTION 'forbidden: super admin required';
  END IF;
  
  UPDATE public.profiles
  SET role = p_role, updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN FOUND;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.admin_get_all_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_all_organizations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_all_funds() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_user_role(uuid, user_role) TO authenticated;