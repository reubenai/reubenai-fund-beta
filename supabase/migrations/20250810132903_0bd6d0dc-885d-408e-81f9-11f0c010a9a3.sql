-- Fix remaining search_path issues and grant proper permissions
-- Fix auth functions to be accessible
GRANT EXECUTE ON FUNCTION auth_org_id() TO authenticated;
GRANT EXECUTE ON FUNCTION auth_user_id() TO authenticated;  
GRANT EXECUTE ON FUNCTION auth_role() TO authenticated;
GRANT EXECUTE ON FUNCTION auth_is_super_admin() TO authenticated;

-- Fix any remaining functions that might be missing search_path
CREATE OR REPLACE FUNCTION is_reuben_email()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.email() LIKE '%@goreuben.com' OR auth.email() LIKE '%@reuben.com';
$$;

CREATE OR REPLACE FUNCTION auth_email()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT current_setting('request.jwt.claims', true)::jsonb ->> 'email';
$$;

CREATE OR REPLACE FUNCTION auth_uid()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid();
$$;