-- Migrate all users from profiles to auth system with unified password
-- Set password to "ReubenDemo123!" for all users while preserving roles

-- Create comprehensive function to migrate all users
CREATE OR REPLACE FUNCTION migrate_all_profile_users_to_auth()
RETURNS TABLE(email TEXT, user_id UUID, status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  profile_record RECORD;
  new_password TEXT := 'ReubenDemo123!';
BEGIN
  -- Loop through all profiles
  FOR profile_record IN 
    SELECT p.user_id, p.email, p.role 
    FROM public.profiles p 
    WHERE p.email IS NOT NULL AND p.email != ''
  LOOP
    BEGIN
      -- Check if auth user already exists
      IF EXISTS (SELECT 1 FROM auth.users WHERE id = profile_record.user_id) THEN
        -- Update existing auth user password
        UPDATE auth.users 
        SET 
          encrypted_password = crypt(new_password, gen_salt('bf')),
          email_confirmed_at = COALESCE(email_confirmed_at, now()),
          updated_at = now()
        WHERE id = profile_record.user_id;
        
        -- Return success status
        email := profile_record.email;
        user_id := profile_record.user_id;
        status := 'password_updated';
        RETURN NEXT;
        
      ELSE
        -- Create new auth user with profile UUID
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
          profile_record.user_id,
          profile_record.email,
          crypt(new_password, gen_salt('bf')),
          now(),
          now(),
          now(),
          '',
          '',
          '',
          'authenticated',
          'authenticated'
        );
        
        -- Return success status
        email := profile_record.email;
        user_id := profile_record.user_id;
        status := 'user_created';
        RETURN NEXT;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      -- Return error status
      email := profile_record.email;
      user_id := profile_record.user_id;
      status := 'error: ' || SQLERRM;
      RETURN NEXT;
    END;
  END LOOP;
END;
$$;

-- Execute the migration and show results
DO $$
DECLARE
  migration_result RECORD;
  total_processed INTEGER := 0;
  total_created INTEGER := 0;
  total_updated INTEGER := 0;
  total_errors INTEGER := 0;
BEGIN
  RAISE NOTICE '=== Starting Profile to Auth Migration ===';
  RAISE NOTICE 'Setting all passwords to: ReubenDemo123!';
  RAISE NOTICE '';
  
  -- Run the migration
  FOR migration_result IN 
    SELECT * FROM migrate_all_profile_users_to_auth()
  LOOP
    total_processed := total_processed + 1;
    
    IF migration_result.status = 'user_created' THEN
      total_created := total_created + 1;
      RAISE NOTICE 'CREATED: % (ID: %)', migration_result.email, migration_result.user_id;
    ELSIF migration_result.status = 'password_updated' THEN
      total_updated := total_updated + 1;
      RAISE NOTICE 'UPDATED: % (ID: %)', migration_result.email, migration_result.user_id;
    ELSE
      total_errors := total_errors + 1;
      RAISE NOTICE 'ERROR: % - %', migration_result.email, migration_result.status;
    END IF;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== Migration Summary ===';
  RAISE NOTICE 'Total processed: %', total_processed;
  RAISE NOTICE 'Users created: %', total_created;
  RAISE NOTICE 'Passwords updated: %', total_updated;
  RAISE NOTICE 'Errors: %', total_errors;
  RAISE NOTICE '';
  RAISE NOTICE 'All users can now log in with password: ReubenDemo123!';
  RAISE NOTICE 'Roles preserved in profiles table (RLS policies unchanged)';
END;
$$;

-- Clean up the migration function
DROP FUNCTION migrate_all_profile_users_to_auth();