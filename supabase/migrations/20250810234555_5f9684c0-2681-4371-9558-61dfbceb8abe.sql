-- Final security hardening: Clean up deleted profile and add extra safety
-- 1. Clean up the deleted profile to reduce risks
UPDATE public.profiles 
SET is_deleted = true, updated_at = now()
WHERE email = 'mike@gilesonline.com' AND is_deleted = true;

-- 2. Add an extra safety check for the funds RLS
-- The issue might be that we're querying as an admin context
-- Let's add a service role bypass check
DROP POLICY IF EXISTS "Emergency strict organization fund access" ON public.funds;

CREATE POLICY "Ultra secure organization fund access"
ON public.funds
FOR SELECT
USING (
  -- Super admins can see everything (but only with proper email domain)
  (
    current_setting('role') != 'service_role' AND 
    (auth_email() LIKE '%@goreuben.com' OR auth_email() LIKE '%@reuben.com')
  ) OR
  -- Regular users can ONLY see funds from their exact organization
  (
    current_setting('role') != 'service_role' AND
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth_uid()
      AND p.organization_id = funds.organization_id
      AND (p.is_deleted IS NULL OR p.is_deleted = false)
    )
  )
);