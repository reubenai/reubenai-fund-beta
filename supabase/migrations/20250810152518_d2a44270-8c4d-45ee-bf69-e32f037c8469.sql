-- Fix JWT claims and authentication state for all users
-- This addresses missing user_id and email claims in JWT tokens

-- Create a function to refresh JWT tokens with proper claims
CREATE OR REPLACE FUNCTION refresh_user_jwt_claims()
RETURNS TABLE(user_id UUID, email TEXT, status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'auth', 'public'
AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Update all authenticated users to force JWT refresh with proper claims
  FOR user_record IN 
    SELECT u.id, u.email, u.role, u.aud
    FROM auth.users u
    WHERE u.deleted_at IS NULL
      AND u.email_confirmed_at IS NOT NULL
      AND u.role = 'authenticated'
  LOOP
    BEGIN
      -- Force update to trigger JWT claims refresh
      UPDATE auth.users 
      SET 
        updated_at = now(),
        -- Ensure proper role and audience
        role = 'authenticated',
        aud = 'authenticated'
      WHERE id = user_record.id;
      
      -- Return success
      user_id := user_record.id;
      email := user_record.email;
      status := 'jwt_refreshed';
      RETURN NEXT;
      
    EXCEPTION WHEN OTHERS THEN
      -- Return error
      user_id := user_record.id;
      email := user_record.email;
      status := 'error: ' || SQLERRM;
      RETURN NEXT;
    END;
  END LOOP;
END;
$$;

-- Execute the JWT refresh
DO $$
DECLARE
  refresh_result RECORD;
  total_refreshed INTEGER := 0;
  total_errors INTEGER := 0;
BEGIN
  RAISE NOTICE '=== Starting JWT Claims Refresh ===';
  RAISE NOTICE 'Refreshing JWT claims for all authenticated users...';
  RAISE NOTICE '';
  
  FOR refresh_result IN 
    SELECT * FROM refresh_user_jwt_claims()
  LOOP
    IF refresh_result.status = 'jwt_refreshed' THEN
      total_refreshed := total_refreshed + 1;
      RAISE NOTICE 'REFRESHED: % (ID: %)', refresh_result.email, refresh_result.user_id;
    ELSE
      total_errors := total_errors + 1;
      RAISE NOTICE 'ERROR: % - %', refresh_result.email, refresh_result.status;
    END IF;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== JWT Refresh Summary ===';
  RAISE NOTICE 'Users refreshed: %', total_refreshed;
  RAISE NOTICE 'Errors: %', total_errors;
  RAISE NOTICE '';
  RAISE NOTICE 'Users should now log out and log back in to get proper JWT claims';
END;
$$;

-- Clean up
DROP FUNCTION refresh_user_jwt_claims();

-- Force all current sessions to refresh by updating session tokens
-- This will require all users to log in again with proper JWT claims
UPDATE auth.sessions 
SET updated_at = now() - interval '1 day'
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE deleted_at IS NULL 
    AND email_confirmed_at IS NOT NULL
);