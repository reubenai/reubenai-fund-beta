-- Fix investment_strategies RLS policies without user_metadata security issues

-- Drop the insecure policies
DROP POLICY IF EXISTS "investment_strategies_select_jwt" ON public.investment_strategies;
DROP POLICY IF EXISTS "investment_strategies_insert_jwt" ON public.investment_strategies;
DROP POLICY IF EXISTS "investment_strategies_update_jwt" ON public.investment_strategies;
DROP POLICY IF EXISTS "investment_strategies_delete_jwt" ON public.investment_strategies;

-- Create secure policies that use profiles table instead of JWT user_metadata
CREATE POLICY "investment_strategies_select_secure" 
ON public.investment_strategies 
FOR SELECT 
USING (
  -- Super admin access
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@goreuben.com' OR
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@reuben.com' OR
  -- Organization-based access using profiles table
  fund_id IN (
    SELECT f.id 
    FROM public.funds f 
    JOIN public.profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid() 
    AND (p.is_deleted IS NULL OR p.is_deleted = false)
  )
);

CREATE POLICY "investment_strategies_insert_secure" 
ON public.investment_strategies 
FOR INSERT 
WITH CHECK (
  -- Super admin access
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@goreuben.com' OR
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@reuben.com' OR
  -- Organization-based access using profiles table
  fund_id IN (
    SELECT f.id 
    FROM public.funds f 
    JOIN public.profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid() 
    AND (p.is_deleted IS NULL OR p.is_deleted = false)
    AND p.role = ANY (ARRAY['super_admin'::user_role, 'admin'::user_role, 'fund_manager'::user_role, 'analyst'::user_role])
  )
);

CREATE POLICY "investment_strategies_update_secure" 
ON public.investment_strategies 
FOR UPDATE 
USING (
  -- Super admin access
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@goreuben.com' OR
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@reuben.com' OR
  -- Organization-based access using profiles table
  fund_id IN (
    SELECT f.id 
    FROM public.funds f 
    JOIN public.profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid() 
    AND (p.is_deleted IS NULL OR p.is_deleted = false)
    AND p.role = ANY (ARRAY['super_admin'::user_role, 'admin'::user_role, 'fund_manager'::user_role, 'analyst'::user_role])
  )
)
WITH CHECK (
  -- Super admin access
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@goreuben.com' OR
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@reuben.com' OR
  -- Organization-based access using profiles table
  fund_id IN (
    SELECT f.id 
    FROM public.funds f 
    JOIN public.profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid() 
    AND (p.is_deleted IS NULL OR p.is_deleted = false)
    AND p.role = ANY (ARRAY['super_admin'::user_role, 'admin'::user_role, 'fund_manager'::user_role, 'analyst'::user_role])
  )
);

CREATE POLICY "investment_strategies_delete_secure" 
ON public.investment_strategies 
FOR DELETE 
USING (
  -- Only super admin can delete
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@goreuben.com' OR
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@reuben.com'
);