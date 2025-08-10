-- Emergency security audit: Test RLS policies and create emergency fix
-- First, let's see what the current policies are actually doing

-- Test what happens when we simulate Katey's session
-- We need to check if the RLS policies are being enforced properly

-- Create a test query to see what Katey should be able to access
DO $$
DECLARE
    katey_user_id uuid;
    katey_org_id uuid;
BEGIN
    -- Get Katey's details
    SELECT user_id, organization_id INTO katey_user_id, katey_org_id
    FROM public.profiles 
    WHERE email = 'katey.shaw@bearventuregroup.com';
    
    RAISE NOTICE 'Katey User ID: %', katey_user_id;
    RAISE NOTICE 'Katey Org ID: %', katey_org_id;
    
    -- Check what funds exist for her organization
    RAISE NOTICE 'Funds in Katey org:';
    FOR rec IN 
        SELECT f.name, f.organization_id 
        FROM public.funds f 
        WHERE f.organization_id = katey_org_id
    LOOP
        RAISE NOTICE '  - %: %', rec.name, rec.organization_id;
    END LOOP;
END $$;

-- Create emergency stricter RLS policy as backup
-- Drop existing overly permissive policies and create strict ones
DROP POLICY IF EXISTS "Users can view funds from their organization" ON public.funds;

-- Create a much stricter policy that explicitly checks organization matching
CREATE POLICY "Strict organization fund access"
ON public.funds
FOR SELECT
USING (
  -- Super admins can see everything  
  (auth_email() LIKE '%@goreuben.com' OR auth_email() LIKE '%@reuben.com') OR
  -- Regular users can only see funds where the fund's organization matches their profile's organization
  (
    organization_id IN (
      SELECT p.organization_id
      FROM public.profiles p
      WHERE p.user_id = auth_uid()
      AND p.organization_id = funds.organization_id  -- Extra safety check
      AND (p.is_deleted IS NULL OR p.is_deleted = false)
    )
  )
);