-- Fix pipeline_stages RLS policy to allow super_admin access across organizations
DROP POLICY IF EXISTS "Users can view pipeline stages for accessible funds" ON pipeline_stages;

CREATE POLICY "Users can view pipeline stages for accessible funds" 
ON pipeline_stages 
FOR SELECT 
TO authenticated 
USING (
  -- Allow Reuben team admin access
  is_reuben_admin() 
  OR 
  -- Allow super_admin users to access all funds
  (
    SELECT role = 'super_admin'
    FROM profiles 
    WHERE user_id = auth.uid()
  )
  OR 
  -- Regular organization-based access
  (
    fund_id IN (
      SELECT f.id
      FROM funds f
      JOIN profiles p ON (f.organization_id = p.organization_id)
      WHERE p.user_id = auth.uid()
    )
  )
);