-- Remove ALL existing policies on profiles table to prevent recursion
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Reuben admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Reuben admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Reuben admins can delete users" ON public.profiles;

-- Remove any other policies that might exist
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can delete users" ON public.profiles;

-- Create completely new, simple policies that don't reference any functions
CREATE POLICY "Allow user to view own profile" 
ON public.profiles 
FOR SELECT 
USING (
  user_id = auth.uid() 
  AND (is_deleted IS NULL OR is_deleted = false)
);

CREATE POLICY "Allow user to update own profile" 
ON public.profiles 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Simple email-based policies for Reuben admins (no function calls)
CREATE POLICY "Reuben email admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.email() LIKE '%@goreuben.com' 
  OR auth.email() LIKE '%@reuben.com'
);

CREATE POLICY "Reuben email admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (
  auth.email() LIKE '%@goreuben.com' 
  OR auth.email() LIKE '%@reuben.com'
)
WITH CHECK (
  auth.email() LIKE '%@goreuben.com' 
  OR auth.email() LIKE '%@reuben.com'
);

CREATE POLICY "Reuben email admins can delete profiles" 
ON public.profiles 
FOR UPDATE 
USING (
  auth.email() LIKE '%@goreuben.com' 
  OR auth.email() LIKE '%@reuben.com'
)
WITH CHECK (
  auth.email() LIKE '%@goreuben.com' 
  OR auth.email() LIKE '%@reuben.com'
);

-- Also fix funds policies to not reference profile functions
DROP POLICY IF EXISTS "Users can view funds in their organization" ON public.funds;
DROP POLICY IF EXISTS "Users can manage funds based on role" ON public.funds;

-- Create simple funds policies  
CREATE POLICY "Reuben admins can view all funds" 
ON public.funds 
FOR SELECT 
USING (
  auth.email() LIKE '%@goreuben.com' 
  OR auth.email() LIKE '%@reuben.com'
);

CREATE POLICY "Users can view funds in their org" 
ON public.funds 
FOR SELECT 
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND (is_deleted IS NULL OR is_deleted = false)
  )
);

CREATE POLICY "Reuben admins can manage all funds" 
ON public.funds 
FOR ALL 
USING (
  auth.email() LIKE '%@goreuben.com' 
  OR auth.email() LIKE '%@reuben.com'
)
WITH CHECK (
  auth.email() LIKE '%@goreuben.com' 
  OR auth.email() LIKE '%@reuben.com'
);