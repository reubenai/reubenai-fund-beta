-- Update RLS policy to allow all authenticated users to create organizations
DROP POLICY IF EXISTS "Super admins and admins can create organizations" ON public.organizations;

CREATE POLICY "All authenticated users can create organizations" 
ON public.organizations 
FOR INSERT 
TO authenticated
WITH CHECK (true);