-- Add policies for organizations table  
CREATE POLICY "reuben_organizations_access" 
ON public.organizations 
FOR ALL 
USING (public.is_reuben_email())
WITH CHECK (public.is_reuben_email());

-- Create a policy for regular users to view their own organization
CREATE POLICY "users_view_own_org" 
ON public.organizations 
FOR SELECT 
USING (
  id IN (
    SELECT organization_id 
    FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND (is_deleted IS NULL OR is_deleted = false)
    LIMIT 1
  )
);