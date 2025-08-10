-- Update admin functions to exclude deleted users and show accurate fund counts

-- Update admin_get_all_profiles to exclude deleted users
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
  SELECT 
    p.id,
    p.user_id,
    p.email,
    p.first_name,
    p.last_name,
    p.role,
    p.organization_id,
    p.is_deleted,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.is_deleted IS NULL OR p.is_deleted = false  -- Exclude deleted users
  ORDER BY p.created_at DESC;
END;
$$;

-- Update dashboard_stats view to show accurate counts
DROP VIEW IF EXISTS public.dashboard_stats;
CREATE VIEW public.dashboard_stats AS
SELECT 
  (SELECT COUNT(*) FROM public.organizations WHERE name IS NOT NULL) as orgs_active,
  (SELECT COUNT(*) FROM public.profiles WHERE is_deleted IS NULL OR is_deleted = false) as users_total,
  (SELECT COUNT(*) FROM public.funds WHERE is_active = true) as funds_active,
  (SELECT COUNT(*) FROM public.deals WHERE status NOT IN ('rejected', 'archived')) as deals_pipeline;