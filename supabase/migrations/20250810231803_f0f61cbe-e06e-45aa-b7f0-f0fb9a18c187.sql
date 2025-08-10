-- Fix broken user profiles and ensure auth system works for everyone
-- First, fix katey.shaw's profile (currently deleted and missing org)
UPDATE public.profiles 
SET 
  is_deleted = false,
  updated_at = now()
WHERE email = 'katey.shaw@bearventuregroup.com';

-- Create Bear Venture Group organization if it doesn't exist
INSERT INTO public.organizations (id, name, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'Bear Venture Group',
  now(),
  now()
WHERE NOT EXISTS (SELECT 1 FROM public.organizations WHERE name = 'Bear Venture Group');

-- Update katey's profile with the correct organization
UPDATE public.profiles 
SET 
  organization_id = (SELECT id FROM public.organizations WHERE name = 'Bear Venture Group' LIMIT 1),
  updated_at = now()
WHERE email = 'katey.shaw@bearventuregroup.com' 
AND (organization_id IS NULL OR is_deleted = true);

-- Ensure all auth.users have corresponding profiles (safety check)
-- This will create missing profiles for any auth.users without them
INSERT INTO public.profiles (user_id, email, role, organization_id, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  'viewer'::user_role,
  NULL, -- Will need manual assignment by admin
  now(),
  now()
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE p.user_id IS NULL;

-- Create a function to automatically create profiles when users sign up
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    'viewer'::user_role,
    now(),
    now()
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create profiles for new users
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();