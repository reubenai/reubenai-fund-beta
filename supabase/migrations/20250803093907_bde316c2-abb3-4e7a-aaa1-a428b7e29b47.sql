-- Update the handle_new_user function to work with invitation system
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  invited_role text;
  invited_org_id uuid;
  invitation_exists boolean := false;
BEGIN
  -- Check if user was invited through our invitation system
  SELECT EXISTS(
    SELECT 1 FROM public.user_invitations 
    WHERE email = NEW.email 
    AND is_active = false 
    AND accepted_at IS NOT NULL
  ) INTO invitation_exists;

  IF invitation_exists THEN
    -- Get invitation details for invited users
    SELECT 
      ui.role,
      ui.organization_id
    INTO 
      invited_role,
      invited_org_id
    FROM public.user_invitations ui
    WHERE ui.email = NEW.email 
    AND ui.is_active = false 
    AND ui.accepted_at IS NOT NULL
    ORDER BY ui.accepted_at DESC
    LIMIT 1;
  ELSE
    -- Handle legacy invitation metadata if present
    invited_role := COALESCE(
      NEW.raw_user_meta_data ->> 'invited_role', 
      'viewer'
    );
    
    invited_org_id := COALESCE(
      (NEW.raw_user_meta_data ->> 'invited_organization_id')::uuid,
      CASE 
        WHEN NEW.email LIKE '%@goreuben.com' OR NEW.email LIKE '%@reuben.com' THEN 
          '550e8400-e29b-41d4-a716-446655440000'::uuid
        ELSE NULL
      END
    );
  END IF;

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
  
  RETURN NEW;
END;
$$;