-- Fix the infinite recursion issue in profiles RLS policy
-- The problem is the policy that checks organization membership by querying profiles again

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON public.profiles;

-- Create a simpler, non-recursive policy
CREATE POLICY "Users can view profiles in their organization" 
ON public.profiles 
FOR SELECT 
USING (
  is_reuben_admin() OR 
  user_id = auth.uid() OR 
  (
    organization_id IS NOT NULL AND 
    organization_id = (
      SELECT p.organization_id 
      FROM public.profiles p 
      WHERE p.user_id = auth.uid() 
      LIMIT 1
    )
  )
);