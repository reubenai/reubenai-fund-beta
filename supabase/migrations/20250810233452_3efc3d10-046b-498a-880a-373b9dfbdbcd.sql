-- EMERGENCY SECURITY FIX: Create stricter RLS policy for funds
-- Drop the overly permissive policy and create a strict one
DROP POLICY IF EXISTS "Users can view funds from their organization" ON public.funds;

-- Create an extremely strict policy that ensures organization isolation
CREATE POLICY "Emergency strict organization fund access"
ON public.funds
FOR SELECT
USING (
  -- Super admins can see everything  
  (auth_email() LIKE '%@goreuben.com' OR auth_email() LIKE '%@reuben.com') OR
  -- Regular users can ONLY see funds from their exact organization
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth_uid()
    AND p.organization_id = funds.organization_id
    AND (p.is_deleted IS NULL OR p.is_deleted = false)
  )
);

-- Also create a stricter management policy
DROP POLICY IF EXISTS "Fund managers can manage funds from their organization" ON public.funds;

CREATE POLICY "Emergency strict fund management"
ON public.funds
FOR ALL
USING (
  -- Super admins can manage everything
  (auth_email() LIKE '%@goreuben.com' OR auth_email() LIKE '%@reuben.com') OR
  -- Fund managers can only manage funds from their exact organization
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth_uid()
    AND p.organization_id = funds.organization_id
    AND p.role IN ('super_admin', 'admin', 'fund_manager')
    AND (p.is_deleted IS NULL OR p.is_deleted = false)
  )
);