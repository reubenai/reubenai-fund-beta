-- Fix RLS policy for deals table to allow organization-based access
-- The current policy only allows Reuben admins, blocking all fund managers

-- Drop the overly restrictive policy
DROP POLICY IF EXISTS "deals_ultra_simple" ON public.deals;

-- Create proper policies for organization-based access
CREATE POLICY "Super admins can manage all deals"
ON public.deals
FOR ALL
TO authenticated
USING (
  -- Reuben emails have full access
  (auth.email() ~~ '%@goreuben.com' OR auth.email() ~~ '%@reuben.com')
)
WITH CHECK (
  (auth.email() ~~ '%@goreuben.com' OR auth.email() ~~ '%@reuben.com')
);

-- Allow fund managers and analysts to access deals in their organization
CREATE POLICY "Users can access deals in their organization"
ON public.deals
FOR SELECT
TO authenticated
USING (
  -- Super admins get full access via separate policy above
  (auth.email() ~~ '%@goreuben.com' OR auth.email() ~~ '%@reuben.com') OR
  -- Regular users: check organization via fund
  (fund_id IN (
    SELECT f.id 
    FROM funds f
    JOIN profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid() 
      AND (p.is_deleted IS NULL OR p.is_deleted = false)
  ))
);

-- Allow fund managers to create deals in their organization
CREATE POLICY "Fund managers can create deals in their organization"
ON public.deals
FOR INSERT
TO authenticated
WITH CHECK (
  -- Super admins get full access
  (auth.email() ~~ '%@goreuben.com' OR auth.email() ~~ '%@reuben.com') OR
  -- Fund managers and admins can create deals in their organization
  (fund_id IN (
    SELECT f.id 
    FROM funds f
    JOIN profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid() 
      AND p.role IN ('super_admin', 'admin', 'fund_manager')
      AND (p.is_deleted IS NULL OR p.is_deleted = false)
  ))
);

-- Allow fund managers to update deals in their organization
CREATE POLICY "Fund managers can update deals in their organization"
ON public.deals
FOR UPDATE
TO authenticated
USING (
  -- Super admins get full access
  (auth.email() ~~ '%@goreuben.com' OR auth.email() ~~ '%@reuben.com') OR
  -- Fund managers and admins can update deals in their organization
  (fund_id IN (
    SELECT f.id 
    FROM funds f
    JOIN profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid() 
      AND p.role IN ('super_admin', 'admin', 'fund_manager')
      AND (p.is_deleted IS NULL OR p.is_deleted = false)
  ))
)
WITH CHECK (
  -- Super admins get full access
  (auth.email() ~~ '%@goreuben.com' OR auth.email() ~~ '%@reuben.com') OR
  -- Fund managers and admins can update deals in their organization
  (fund_id IN (
    SELECT f.id 
    FROM funds f
    JOIN profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid() 
      AND p.role IN ('super_admin', 'admin', 'fund_manager')
      AND (p.is_deleted IS NULL OR p.is_deleted = false)
  ))
);

-- Allow fund managers to delete deals in their organization
CREATE POLICY "Fund managers can delete deals in their organization"
ON public.deals
FOR DELETE
TO authenticated
USING (
  -- Super admins get full access
  (auth.email() ~~ '%@goreuben.com' OR auth.email() ~~ '%@reuben.com') OR
  -- Fund managers and admins can delete deals in their organization
  (fund_id IN (
    SELECT f.id 
    FROM funds f
    JOIN profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid() 
      AND p.role IN ('super_admin', 'admin', 'fund_manager')
      AND (p.is_deleted IS NULL OR p.is_deleted = false)
  ))
);