-- Create security definer function to check user access to fund
CREATE OR REPLACE FUNCTION public.user_can_access_fund(target_fund_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM funds f
    JOIN profiles p ON f.organization_id = p.organization_id
    WHERE f.id = target_fund_id
      AND p.user_id = auth.uid()
      AND (p.is_deleted IS NULL OR p.is_deleted = false)
  );
$$;

-- Create security definer function to check if user can manage fund
CREATE OR REPLACE FUNCTION public.user_can_manage_fund(target_fund_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM funds f
    JOIN profiles p ON f.organization_id = p.organization_id
    WHERE f.id = target_fund_id
      AND p.user_id = auth.uid()
      AND p.role = ANY (ARRAY['super_admin'::user_role, 'admin'::user_role, 'fund_manager'::user_role])
      AND (p.is_deleted IS NULL OR p.is_deleted = false)
  );
$$;

-- Drop existing pipeline_stages policy and recreate with security definer function
DROP POLICY IF EXISTS "Users can manage pipeline stages with proper access" ON public.pipeline_stages;

-- Create new RLS policies for pipeline_stages using security definer functions
CREATE POLICY "Users can view pipeline stages for accessible funds"
ON public.pipeline_stages
FOR SELECT
TO authenticated
USING (user_can_access_fund(fund_id) OR is_reuben_email());

CREATE POLICY "Users can manage pipeline stages for manageable funds"
ON public.pipeline_stages
FOR ALL
TO authenticated
USING (user_can_manage_fund(fund_id) OR is_reuben_email())
WITH CHECK (user_can_manage_fund(fund_id) OR is_reuben_email());

-- Create RLS policies for deals table using security definer functions  
CREATE POLICY "Users can view deals for accessible funds"
ON public.deals
FOR SELECT
TO authenticated
USING (user_can_access_fund(fund_id) OR is_reuben_email());

CREATE POLICY "Users can manage deals for manageable funds"
ON public.deals
FOR ALL
TO authenticated
USING (user_can_manage_fund(fund_id) OR is_reuben_email())
WITH CHECK (user_can_manage_fund(fund_id) OR is_reuben_email());