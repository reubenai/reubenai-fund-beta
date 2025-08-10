-- Final security fixes for the 3 remaining SECURITY DEFINER issues
-- These are likely coming from functions we need to fix

-- Fix any remaining functions missing search_path
CREATE OR REPLACE FUNCTION user_can_access_activity(activity_fund_id uuid, activity_deal_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- Reuben emails have access to everything
  SELECT CASE 
    WHEN auth_is_super_admin() THEN true
    -- Regular users: check organization membership via fund_id OR deal_id
    WHEN activity_fund_id IS NOT NULL THEN user_can_access_fund(activity_fund_id)
    WHEN activity_deal_id IS NOT NULL THEN EXISTS (
      SELECT 1
      FROM deals d
      WHERE d.id = activity_deal_id
        AND d.organization_id = auth_org_id()
    )
    ELSE false
  END;
$$;

CREATE OR REPLACE FUNCTION user_can_manage_activity(activity_fund_id uuid, activity_deal_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- Reuben emails can manage everything
  SELECT CASE 
    WHEN auth_is_super_admin() THEN true
    -- Regular users: check management permissions via fund_id OR deal_id
    WHEN activity_fund_id IS NOT NULL THEN user_can_manage_fund(activity_fund_id)
    WHEN activity_deal_id IS NOT NULL THEN EXISTS (
      SELECT 1
      FROM deals d
      WHERE d.id = activity_deal_id
        AND d.organization_id = auth_org_id()
    )
    ELSE false
  END;
$$;

-- Update all admin functions to have proper grants
CREATE OR REPLACE FUNCTION admin_get_all_funds_with_orgs()
RETURNS TABLE(id uuid, name text, organization_id uuid, fund_type fund_type, description text, target_size bigint, currency text, is_active boolean, created_at timestamp with time zone, updated_at timestamp with time zone, organization_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only super admins can access this function
  IF NOT auth_is_super_admin() THEN
    RAISE EXCEPTION 'Access denied: Super admin required';
  END IF;
  
  RETURN QUERY
  SELECT 
    f.id,
    f.name,
    f.organization_id,
    f.fund_type,
    f.description,
    f.target_size,
    f.currency,
    f.is_active,
    f.created_at,
    f.updated_at,
    o.name as organization_name
  FROM public.funds f
  LEFT JOIN public.organizations o ON f.organization_id = o.id
  WHERE f.is_active = true
  ORDER BY f.created_at DESC;
END;
$$;