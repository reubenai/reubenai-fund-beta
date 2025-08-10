-- Fix RLS policies for funds table to allow organization-based access
DROP POLICY IF EXISTS "funds_ultra_simple" ON public.funds;

-- Create proper RLS policies for funds
CREATE POLICY "Super admins can manage all funds" 
ON public.funds 
FOR ALL 
USING (
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@goreuben.com' OR
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@reuben.com'
)
WITH CHECK (
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@goreuben.com' OR
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@reuben.com'
);

CREATE POLICY "Users can view funds from their organization" 
ON public.funds 
FOR SELECT 
USING (
  organization_id IN (
    SELECT p.organization_id 
    FROM public.profiles p 
    WHERE p.user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid
  )
);

CREATE POLICY "Fund managers can manage funds from their organization" 
ON public.funds 
FOR ALL 
USING (
  organization_id IN (
    SELECT p.organization_id 
    FROM public.profiles p 
    WHERE p.user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid
      AND p.role IN ('super_admin', 'admin', 'fund_manager')
  )
)
WITH CHECK (
  organization_id IN (
    SELECT p.organization_id 
    FROM public.profiles p 
    WHERE p.user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid
      AND p.role IN ('super_admin', 'admin', 'fund_manager')
  )
);