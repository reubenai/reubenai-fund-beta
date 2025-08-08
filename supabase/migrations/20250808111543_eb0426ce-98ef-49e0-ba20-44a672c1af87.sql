-- Create bulletproof security definer functions that handle all user types
CREATE OR REPLACE FUNCTION public.user_can_access_fund(target_fund_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
  -- Reuben emails have access to everything
  SELECT CASE 
    WHEN auth.email() LIKE '%@goreuben.com' OR auth.email() LIKE '%@reuben.com' THEN true
    -- Regular users: check organization membership
    ELSE EXISTS (
      SELECT 1
      FROM funds f
      JOIN profiles p ON f.organization_id = p.organization_id
      WHERE f.id = target_fund_id
        AND p.user_id = auth.uid()
        AND (p.is_deleted IS NULL OR p.is_deleted = false)
    )
  END;
$$;

-- Create bulletproof function for management permissions
CREATE OR REPLACE FUNCTION public.user_can_manage_fund(target_fund_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
  -- Reuben emails can manage everything
  SELECT CASE 
    WHEN auth.email() LIKE '%@goreuben.com' OR auth.email() LIKE '%@reuben.com' THEN true
    -- Regular users: check organization membership AND role
    ELSE EXISTS (
      SELECT 1
      FROM funds f
      JOIN profiles p ON f.organization_id = p.organization_id
      WHERE f.id = target_fund_id
        AND p.user_id = auth.uid()
        AND p.role = ANY (ARRAY['super_admin'::user_role, 'admin'::user_role, 'fund_manager'::user_role])
        AND (p.is_deleted IS NULL OR p.is_deleted = false)
    )
  END;
$$;

-- Update RLS policies to use ONLY the security definer functions (no OR clauses to avoid conflicts)
DROP POLICY IF EXISTS "Users can view pipeline stages for accessible funds" ON public.pipeline_stages;
DROP POLICY IF EXISTS "Users can manage pipeline stages for manageable funds" ON public.pipeline_stages;

CREATE POLICY "Users can view pipeline stages for accessible funds"
ON public.pipeline_stages
FOR SELECT
TO authenticated
USING (user_can_access_fund(fund_id));

CREATE POLICY "Users can manage pipeline stages for manageable funds"
ON public.pipeline_stages
FOR ALL
TO authenticated
USING (user_can_manage_fund(fund_id))
WITH CHECK (user_can_manage_fund(fund_id));

-- Update deals RLS policies to use ONLY the security definer functions
DROP POLICY IF EXISTS "Users can view deals for accessible funds" ON public.deals;
DROP POLICY IF EXISTS "Users can manage deals for manageable funds" ON public.deals;

CREATE POLICY "Users can view deals for accessible funds"
ON public.deals
FOR SELECT
TO authenticated
USING (user_can_access_fund(fund_id));

CREATE POLICY "Users can manage deals for manageable funds"
ON public.deals
FOR ALL
TO authenticated
USING (user_can_manage_fund(fund_id))
WITH CHECK (user_can_manage_fund(fund_id));