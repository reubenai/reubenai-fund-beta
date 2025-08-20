-- Fix RLS policies for investment_strategies to allow proper access

-- Drop the current policies that might be too restrictive
DROP POLICY IF EXISTS "investment_strategies_select" ON public.investment_strategies;
DROP POLICY IF EXISTS "investment_strategies_insert" ON public.investment_strategies;
DROP POLICY IF EXISTS "investment_strategies_update" ON public.investment_strategies;
DROP POLICY IF EXISTS "investment_strategies_delete" ON public.investment_strategies;

-- Create more permissive policies that match the JWT structure
CREATE POLICY "investment_strategies_select_jwt" 
ON public.investment_strategies 
FOR SELECT 
USING (
  -- Super admin access
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@goreuben.com' OR
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@reuben.com' OR
  -- Organization-based access using JWT org_id
  fund_id IN (
    SELECT f.id 
    FROM public.funds f 
    WHERE f.organization_id = ((current_setting('request.jwt.claims', true)::jsonb ->> 'user_metadata')::jsonb ->> 'organization_id')::uuid
  )
);

CREATE POLICY "investment_strategies_insert_jwt" 
ON public.investment_strategies 
FOR INSERT 
WITH CHECK (
  -- Super admin access
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@goreuben.com' OR
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@reuben.com' OR
  -- Organization-based access using JWT org_id  
  fund_id IN (
    SELECT f.id 
    FROM public.funds f 
    WHERE f.organization_id = ((current_setting('request.jwt.claims', true)::jsonb ->> 'user_metadata')::jsonb ->> 'organization_id')::uuid
  )
);

CREATE POLICY "investment_strategies_update_jwt" 
ON public.investment_strategies 
FOR UPDATE 
USING (
  -- Super admin access
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@goreuben.com' OR
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@reuben.com' OR
  -- Organization-based access using JWT org_id
  fund_id IN (
    SELECT f.id 
    FROM public.funds f 
    WHERE f.organization_id = ((current_setting('request.jwt.claims', true)::jsonb ->> 'user_metadata')::jsonb ->> 'organization_id')::uuid
  )
)
WITH CHECK (
  -- Super admin access
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@goreuben.com' OR
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@reuben.com' OR
  -- Organization-based access using JWT org_id
  fund_id IN (
    SELECT f.id 
    FROM public.funds f 
    WHERE f.organization_id = ((current_setting('request.jwt.claims', true)::jsonb ->> 'user_metadata')::jsonb ->> 'organization_id')::uuid
  )
);

CREATE POLICY "investment_strategies_delete_jwt" 
ON public.investment_strategies 
FOR DELETE 
USING (
  -- Only super admin can delete
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@goreuben.com' OR
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@reuben.com'
);