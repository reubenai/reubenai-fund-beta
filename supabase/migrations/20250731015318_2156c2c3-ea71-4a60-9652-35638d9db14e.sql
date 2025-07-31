-- DEFINITIVE FIX: Remove ALL potential recursion sources
-- Step 1: Temporarily disable RLS on profiles to break the cycle
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies on profiles
DROP POLICY IF EXISTS "Users can view profiles without recursion" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Step 3: Create a completely recursion-free function for admin checks
-- This function ONLY checks email domains - NO TABLE QUERIES
CREATE OR REPLACE FUNCTION public.is_admin_by_email()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $$
  SELECT (auth.email() LIKE '%@goreuben.com' OR auth.email() LIKE '%@reuben.com');
$$;

-- Step 4: Re-enable RLS with SUPER SIMPLE policies that cannot cause recursion
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can always see their own profile (no function calls)
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (user_id = auth.uid());

-- Policy 2: Admin emails can see all profiles (email check only)
CREATE POLICY "Admin emails can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (auth.email() LIKE '%@goreuben.com' OR auth.email() LIKE '%@reuben.com');

-- Policy 3: Users can update their own profile
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (user_id = auth.uid());

-- Policy 4: Users can insert their own profile
CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Step 5: Update is_reuben_admin to use the safe email-only function
CREATE OR REPLACE FUNCTION public.is_reuben_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $$
  -- ONLY use email check - no profile table queries to prevent recursion
  SELECT (auth.email() LIKE '%@goreuben.com' OR auth.email() LIKE '%@reuben.com');
$$;