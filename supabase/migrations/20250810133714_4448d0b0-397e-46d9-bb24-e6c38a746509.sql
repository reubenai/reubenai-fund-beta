-- FINAL FIX: Eliminate ALL function dependencies in RLS policies
-- Use direct email checks without any function calls

-- Drop ALL existing policies first
DROP POLICY IF EXISTS "profiles_select_simple" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_simple" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_simple" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_simple" ON public.profiles;

DROP POLICY IF EXISTS "organizations_select_simple" ON public.organizations;
DROP POLICY IF EXISTS "organizations_insert_simple" ON public.organizations;
DROP POLICY IF EXISTS "organizations_update_simple" ON public.organizations;
DROP POLICY IF EXISTS "organizations_delete_simple" ON public.organizations;

DROP POLICY IF EXISTS "funds_select_simple" ON public.funds;
DROP POLICY IF EXISTS "funds_insert_simple" ON public.funds;
DROP POLICY IF EXISTS "funds_update_simple" ON public.funds;
DROP POLICY IF EXISTS "funds_delete_simple" ON public.funds;

DROP POLICY IF EXISTS "deals_select_simple" ON public.deals;
DROP POLICY IF EXISTS "deals_insert_simple" ON public.deals;
DROP POLICY IF EXISTS "deals_update_simple" ON public.deals;
DROP POLICY IF EXISTS "deals_delete_simple" ON public.deals;

DROP POLICY IF EXISTS "deal_analyses_select_simple" ON public.deals;
DROP POLICY IF EXISTS "deal_analyses_insert_simple" ON public.deals;
DROP POLICY IF EXISTS "deal_analyses_update_simple" ON public.deals;
DROP POLICY IF EXISTS "deal_analyses_delete_simple" ON public.deals;

-- Create ULTRA SIMPLE policies with direct email checks ONLY

-- PROFILES: Direct email check only
CREATE POLICY "profiles_ultra_simple" ON public.profiles
FOR ALL USING (
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@goreuben.com' OR
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@reuben.com' OR
  user_id = auth.uid()
) WITH CHECK (
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@goreuben.com' OR
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@reuben.com' OR
  user_id = auth.uid()
);

-- ORGANIZATIONS: Direct email check only
CREATE POLICY "organizations_ultra_simple" ON public.organizations
FOR ALL USING (
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@goreuben.com' OR
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@reuben.com'
) WITH CHECK (
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@goreuben.com' OR
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@reuben.com'
);

-- FUNDS: Direct email check only
CREATE POLICY "funds_ultra_simple" ON public.funds
FOR ALL USING (
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@goreuben.com' OR
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@reuben.com'
) WITH CHECK (
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@goreuben.com' OR
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@reuben.com'
);

-- DEALS: Direct email check only
CREATE POLICY "deals_ultra_simple" ON public.deals
FOR ALL USING (
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@goreuben.com' OR
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@reuben.com'
) WITH CHECK (
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@goreuben.com' OR
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@reuben.com'
);

-- DEAL_ANALYSES: Direct email check only
CREATE POLICY "deal_analyses_ultra_simple" ON public.deal_analyses
FOR ALL USING (
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@goreuben.com' OR
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@reuben.com'
) WITH CHECK (
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@goreuben.com' OR
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@reuben.com'
);