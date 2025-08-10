-- Create auth users for existing profiles without breaking RLS
-- This migration adds users to auth.users that already exist in profiles

-- First, let's create a temporary function to safely create auth users
CREATE OR REPLACE FUNCTION create_auth_user_for_existing_profile(
  user_email TEXT,
  temp_password TEXT DEFAULT 'TempPass123!'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id UUID;
  existing_profile_id UUID;
BEGIN
  -- Check if profile exists
  SELECT user_id INTO existing_profile_id 
  FROM public.profiles 
  WHERE email = user_email;
  
  IF existing_profile_id IS NULL THEN
    RAISE EXCEPTION 'No profile found for email: %', user_email;
  END IF;
  
  -- Check if auth user already exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
    RAISE NOTICE 'Auth user already exists for: %', user_email;
    RETURN existing_profile_id;
  END IF;
  
  -- Create the auth user with the same UUID as the profile
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    email_change_token_new,
    recovery_token,
    aud,
    role
  ) VALUES (
    existing_profile_id,
    user_email,
    crypt(temp_password, gen_salt('bf')),
    now(),
    now(),
    now(),
    '',
    '',
    '',
    'authenticated',
    'authenticated'
  );
  
  RETURN existing_profile_id;
END;
$$;

-- Create auth users for the existing profiles
DO $$
DECLARE
  result_id UUID;
BEGIN
  -- Create auth user for rachel.cheng@pollockcapital.com
  BEGIN
    SELECT create_auth_user_for_existing_profile('rachel.cheng@pollockcapital.com') INTO result_id;
    RAISE NOTICE 'Created auth user for rachel.cheng@pollockcapital.com with ID: %', result_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error creating auth user for rachel.cheng@pollockcapital.com: %', SQLERRM;
  END;
  
  -- Create auth user for katey.shaw@bearventuregroup.com
  BEGIN
    SELECT create_auth_user_for_existing_profile('katey.shaw@bearventuregroup.com') INTO result_id;
    RAISE NOTICE 'Created auth user for katey.shaw@bearventuregroup.com with ID: %', result_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error creating auth user for katey.shaw@bearventuregroup.com: %', SQLERRM;
  END;
END;
$$;

-- Clean up the temporary function
DROP FUNCTION create_auth_user_for_existing_profile(TEXT, TEXT);