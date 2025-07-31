-- Create hello@goreuben.com user as super admin in Reuben Ventures organization
-- Note: This user needs to sign up through the UI first, then this profile will be created automatically
-- via the handle_new_user trigger, but we need to update their role to super_admin

-- First, let's check if there are any demo users or if we need to prepare for the new user
-- We'll create a function to handle updating user roles after signup

CREATE OR REPLACE FUNCTION public.set_user_role(
  user_email text,
  new_role user_role,
  org_id uuid DEFAULT '550e8400-e29b-41d4-a716-446655440000'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Find user by email
  SELECT user_id INTO target_user_id
  FROM public.profiles
  WHERE email = user_email;
  
  -- If user exists, update their role and organization
  IF target_user_id IS NOT NULL THEN
    UPDATE public.profiles
    SET 
      role = new_role,
      organization_id = org_id,
      updated_at = now()
    WHERE user_id = target_user_id;
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Update the handle_new_user function to automatically set hello@goreuben.com as super_admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Check if this is hello@goreuben.com and set as super_admin
  IF NEW.email = 'hello@goreuben.com' THEN
    INSERT INTO public.profiles (user_id, organization_id, email, first_name, last_name, role)
    VALUES (
      NEW.id, 
      '550e8400-e29b-41d4-a716-446655440000',
      NEW.email,
      NEW.raw_user_meta_data ->> 'first_name',
      NEW.raw_user_meta_data ->> 'last_name',
      'super_admin'
    );
  -- Check if this is the demo user
  ELSIF NEW.email = 'demo@goreuben.com' THEN
    INSERT INTO public.profiles (user_id, organization_id, email, first_name, last_name, role)
    VALUES (
      NEW.id, 
      '550e8400-e29b-41d4-a716-446655440000',
      NEW.email,
      'Demo',
      'User',
      'fund_manager'
    );
  -- Check if this is a @goreuben.com or @reuben.com email (auto-assign as admin)
  ELSIF NEW.email LIKE '%@goreuben.com' OR NEW.email LIKE '%@reuben.com' THEN
    INSERT INTO public.profiles (user_id, organization_id, email, first_name, last_name, role)
    VALUES (
      NEW.id, 
      '550e8400-e29b-41d4-a716-446655440000',
      NEW.email,
      NEW.raw_user_meta_data ->> 'first_name',
      NEW.raw_user_meta_data ->> 'last_name',
      'admin'
    );
  ELSE
    -- For other users, they'll need to be assigned to an organization later
    INSERT INTO public.profiles (user_id, email, first_name, last_name, role)
    VALUES (
      NEW.id,
      NEW.email,
      NEW.raw_user_meta_data ->> 'first_name',
      NEW.raw_user_meta_data ->> 'last_name',
      'viewer'
    );
  END IF;
  RETURN NEW;
END;
$$;