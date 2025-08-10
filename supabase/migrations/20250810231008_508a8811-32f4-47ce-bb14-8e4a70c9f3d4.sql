-- Create emergency fix - use simpler RLS policy that works with profile data instead of JWT claims

-- Drop current policies that rely on JWT org_id (which is null)
DROP POLICY IF EXISTS "Allow users to view pipeline stages for their organization" ON public.pipeline_stages;
DROP POLICY IF EXISTS "Allow users to manage pipeline stages for accessible funds" ON public.pipeline_stages;

-- Create working RLS policy using profiles table instead of JWT claims  
CREATE POLICY "Users can view pipeline stages for their accessible funds"
ON public.pipeline_stages
FOR SELECT
USING (
  -- Super admins can see everything
  (auth_email() LIKE '%@goreuben.com' OR auth_email() LIKE '%@reuben.com') OR
  -- Regular users can see stages for funds through their profile's organization
  EXISTS (
    SELECT 1 FROM public.funds f
    JOIN public.profiles p ON f.organization_id = p.organization_id
    WHERE f.id = pipeline_stages.fund_id
    AND p.user_id = auth_uid()
    AND (p.is_deleted IS NULL OR p.is_deleted = false)
  )
);

CREATE POLICY "Users can manage pipeline stages for their accessible funds"
ON public.pipeline_stages  
FOR ALL
USING (
  -- Super admins can manage everything
  (auth_email() LIKE '%@goreuben.com' OR auth_email() LIKE '%@reuben.com') OR
  -- Users can manage stages through their profile's organization  
  EXISTS (
    SELECT 1 FROM public.funds f
    JOIN public.profiles p ON f.organization_id = p.organization_id
    WHERE f.id = pipeline_stages.fund_id
    AND p.user_id = auth_uid()
    AND p.role IN ('super_admin', 'admin', 'fund_manager', 'analyst')
    AND (p.is_deleted IS NULL OR p.is_deleted = false)
  )
);