-- Update RLS policies to give super admins full visibility

-- Update organizations SELECT policy to allow super admins to see all organizations
DROP POLICY IF EXISTS "Users can view their organization" ON public.organizations;
CREATE POLICY "Users can view their organization" 
ON public.organizations 
FOR SELECT 
USING (
  is_reuben_admin() OR 
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'super_admin' OR
  id IN (
    SELECT profiles.organization_id
    FROM profiles
    WHERE profiles.user_id = auth.uid()
  )
);

-- Update profiles SELECT policy to allow super admins to see all profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (
  is_reuben_admin() OR 
  role = 'super_admin' OR
  user_id = auth.uid()
);

-- Update funds SELECT policy to allow super admins to see all funds
DROP POLICY IF EXISTS "Users can view funds in their organization" ON public.funds;
CREATE POLICY "Users can view funds in their organization" 
ON public.funds 
FOR SELECT 
USING (
  is_reuben_admin() OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  ) OR
  organization_id IN (
    SELECT profiles.organization_id
    FROM profiles
    WHERE profiles.user_id = auth.uid()
  )
);