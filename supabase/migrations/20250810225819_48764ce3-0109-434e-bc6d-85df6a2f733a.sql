-- Fix pipeline_stages RLS policies to allow users to access stages for their organization's funds

-- Drop existing policies that might be restricting access
DROP POLICY IF EXISTS "Users can view pipeline stages for their organization's funds" ON public.pipeline_stages;
DROP POLICY IF EXISTS "Users can manage pipeline stages for their organization's funds" ON public.pipeline_stages;

-- Create proper RLS policies for pipeline_stages
CREATE POLICY "Users can view pipeline stages for accessible funds"
ON public.pipeline_stages
FOR SELECT
USING (
  -- Super admins can see everything
  auth_is_super_admin() OR
  -- Regular users can see stages for funds in their organization
  EXISTS (
    SELECT 1 FROM public.funds f
    WHERE f.id = pipeline_stages.fund_id
    AND f.organization_id = auth_org_id()
  )
);

CREATE POLICY "Users can manage pipeline stages for accessible funds"
ON public.pipeline_stages
FOR ALL
USING (
  -- Super admins can manage everything
  auth_is_super_admin() OR
  -- Fund managers and admins can manage stages for their organization's funds
  EXISTS (
    SELECT 1 FROM public.funds f
    JOIN public.profiles p ON f.organization_id = p.organization_id
    WHERE f.id = pipeline_stages.fund_id
    AND p.user_id = auth_uid()
    AND p.role IN ('super_admin', 'admin', 'fund_manager')
    AND (p.is_deleted IS NULL OR p.is_deleted = false)
  )
);

-- Ensure RLS is enabled
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;