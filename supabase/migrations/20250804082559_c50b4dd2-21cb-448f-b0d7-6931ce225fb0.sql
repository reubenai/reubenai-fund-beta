-- Drop the existing restrictive UPDATE policy on profiles table
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can only update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create new UPDATE policy that allows super admins and Reuben admins to update any profile
CREATE POLICY "Allow profile updates for authorized users" ON public.profiles
FOR UPDATE USING (
  -- Users can update their own profile
  user_id = auth.uid() 
  OR 
  -- Reuben admins can update any profile
  is_reuben_admin() 
  OR 
  -- Super admins can update any profile
  get_user_role_simple() = 'super_admin'
);