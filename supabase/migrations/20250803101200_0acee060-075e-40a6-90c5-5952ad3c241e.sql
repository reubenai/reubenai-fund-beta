-- Update handle_new_user function to handle Supabase invitation metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  invited_role text;
  invited_org_id uuid;
BEGIN
  -- Handle invited users (from raw_user_meta_data set by inviteUserByEmail)
  invited_role := COALESCE(
    NEW.raw_user_meta_data ->> 'role',
    'viewer'
  );
  
  invited_org_id := COALESCE(
    (NEW.raw_user_meta_data ->> 'organization_id')::uuid,
    CASE 
      WHEN NEW.email LIKE '%@goreuben.com' OR NEW.email LIKE '%@reuben.com' THEN 
        '550e8400-e29b-41d4-a716-446655440000'::uuid
      ELSE NULL
    END
  );

  -- Check if this is hello@goreuben.com and set as super_admin
  IF NEW.email = 'hello@goreuben.com' THEN
    INSERT INTO public.profiles (user_id, organization_id, email, first_name, last_name, role)
    VALUES (
      NEW.id, 
      '550e8400-e29b-41d4-a716-446655440000',
      NEW.email,
      NEW.raw_user_meta_data ->> 'first_name',
      NEW.raw_user_meta_data ->> 'last_name',
      'super_admin'::user_role
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
      'fund_manager'::user_role
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
      'admin'::user_role
    );
  ELSE
    -- For invited users or other users, use invitation data
    INSERT INTO public.profiles (user_id, organization_id, email, first_name, last_name, role)
    VALUES (
      NEW.id,
      invited_org_id,
      NEW.email,
      NEW.raw_user_meta_data ->> 'first_name',
      NEW.raw_user_meta_data ->> 'last_name',
      invited_role::user_role
    );
  END IF;

  -- Mark invitation as accepted if it exists
  UPDATE public.user_invitations 
  SET 
    is_active = false,
    accepted_at = now()
  WHERE email = NEW.email 
    AND is_active = true;
  
  RETURN NEW;
END;
$$;