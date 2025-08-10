-- Check and fix pipeline_stages RLS policies

-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can view pipeline stages for accessible funds" ON public.pipeline_stages;
DROP POLICY IF EXISTS "Users can manage pipeline stages for accessible funds" ON public.pipeline_stages;
DROP POLICY IF EXISTS "Users can view pipeline stages for their organization's funds" ON public.pipeline_stages;
DROP POLICY IF EXISTS "Users can manage pipeline stages for their organization's funds" ON public.pipeline_stages;

-- Create simplified and working RLS policies
CREATE POLICY "Allow users to view pipeline stages for their organization"
ON public.pipeline_stages
FOR SELECT
USING (
  -- Super admins can see everything
  (auth_email() LIKE '%@goreuben.com' OR auth_email() LIKE '%@reuben.com') OR
  -- Regular users can see stages for funds in their organization using JWT claims
  EXISTS (
    SELECT 1 FROM public.funds f
    WHERE f.id = pipeline_stages.fund_id
    AND f.organization_id = ((current_setting('request.jwt.claims', true)::jsonb ->> 'org_id')::uuid)
  )
);

CREATE POLICY "Allow users to manage pipeline stages for accessible funds" 
ON public.pipeline_stages
FOR ALL
USING (
  -- Super admins can manage everything
  (auth_email() LIKE '%@goreuben.com' OR auth_email() LIKE '%@reuben.com') OR
  -- Fund managers can manage stages for their organization's funds
  EXISTS (
    SELECT 1 FROM public.funds f
    WHERE f.id = pipeline_stages.fund_id
    AND f.organization_id = ((current_setting('request.jwt.claims', true)::jsonb ->> 'org_id')::uuid)
  )
);

-- Ensure RLS is enabled
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;