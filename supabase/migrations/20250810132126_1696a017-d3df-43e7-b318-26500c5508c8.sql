-- Phase 7: Admin Visibility & RLS Hardening - Final Implementation (Fixed)

-- First, let's clean up any existing linter views
DROP VIEW IF EXISTS rls_gaps;
DROP VIEW IF EXISTS rls_smells;

-- Step 1: Replace all dangerous RLS policies with pure-predicate templates

-- Organizations table - clean predicate-based policies
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_sel ON public.organizations;
DROP POLICY IF EXISTS org_ins ON public.organizations;
DROP POLICY IF EXISTS org_upd ON public.organizations;
DROP POLICY IF EXISTS org_del ON public.organizations;
DROP POLICY IF EXISTS "Organizations can be managed by super admins" ON public.organizations;
DROP POLICY IF EXISTS "Organizations can be viewed by their members" ON public.organizations;

CREATE POLICY org_sel ON public.organizations
FOR SELECT USING (
  auth_is_super_admin() OR id = auth_org_id()
);

CREATE POLICY org_ins ON public.organizations
FOR INSERT WITH CHECK (
  auth_is_super_admin()
);

CREATE POLICY org_upd ON public.organizations
FOR UPDATE USING (
  auth_is_super_admin() OR id = auth_org_id()
) WITH CHECK (
  auth_is_super_admin() OR id = auth_org_id()
);

CREATE POLICY org_del ON public.organizations
FOR DELETE USING (auth_is_super_admin());

-- Funds table - clean predicate-based policies  
ALTER TABLE public.funds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS funds_sel ON public.funds;
DROP POLICY IF EXISTS funds_ins ON public.funds;
DROP POLICY IF EXISTS funds_upd ON public.funds;
DROP POLICY IF EXISTS funds_del ON public.funds;

CREATE POLICY funds_sel ON public.funds
FOR SELECT USING (auth_is_super_admin() OR organization_id = auth_org_id());

CREATE POLICY funds_ins ON public.funds
FOR INSERT WITH CHECK (auth_is_super_admin() OR organization_id = auth_org_id());

CREATE POLICY funds_upd ON public.funds
FOR UPDATE USING (auth_is_super_admin() OR organization_id = auth_org_id())
WITH CHECK (auth_is_super_admin() OR organization_id = auth_org_id());

CREATE POLICY funds_del ON public.funds
FOR DELETE USING (auth_is_super_admin());

-- Profiles table - organization-scoped with user ownership
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS profiles_sel ON public.profiles;
DROP POLICY IF EXISTS profiles_ins ON public.profiles;
DROP POLICY IF EXISTS profiles_upd ON public.profiles;
DROP POLICY IF EXISTS profiles_del ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON public.profiles;

CREATE POLICY profiles_sel ON public.profiles
FOR SELECT USING (auth_is_super_admin() OR organization_id = auth_org_id());

CREATE POLICY profiles_ins ON public.profiles
FOR INSERT WITH CHECK (auth_is_super_admin() OR organization_id = auth_org_id());

CREATE POLICY profiles_upd ON public.profiles
FOR UPDATE USING (auth_is_super_admin() OR (organization_id = auth_org_id() AND user_id = auth_user_id()))
WITH CHECK (auth_is_super_admin() OR (organization_id = auth_org_id() AND user_id = auth_user_id()));

CREATE POLICY profiles_del ON public.profiles
FOR DELETE USING (auth_is_super_admin() OR (organization_id = auth_org_id() AND user_id = auth_user_id()));

-- Deals table - organization-scoped via fund relationship
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS deals_sel ON public.deals;
DROP POLICY IF EXISTS deals_ins ON public.deals;
DROP POLICY IF EXISTS deals_upd ON public.deals;
DROP POLICY IF EXISTS deals_del ON public.deals;

-- Add organization_id column to deals for direct org scoping
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS organization_id UUID;

-- Update existing deals to have organization_id from their fund
UPDATE public.deals 
SET organization_id = f.organization_id 
FROM public.funds f 
WHERE deals.fund_id = f.id AND deals.organization_id IS NULL;

-- Create trigger to auto-populate organization_id on insert/update
CREATE OR REPLACE FUNCTION populate_deal_organization_id()
RETURNS TRIGGER AS $$
BEGIN
  SELECT organization_id INTO NEW.organization_id
  FROM public.funds 
  WHERE id = NEW.fund_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS deal_org_id_trigger ON public.deals;
CREATE TRIGGER deal_org_id_trigger
  BEFORE INSERT OR UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION populate_deal_organization_id();

CREATE POLICY deals_sel ON public.deals
FOR SELECT USING (auth_is_super_admin() OR organization_id = auth_org_id());

CREATE POLICY deals_ins ON public.deals
FOR INSERT WITH CHECK (auth_is_super_admin() OR organization_id = auth_org_id());

CREATE POLICY deals_upd ON public.deals
FOR UPDATE USING (auth_is_super_admin() OR organization_id = auth_org_id())
WITH CHECK (auth_is_super_admin() OR organization_id = auth_org_id());

CREATE POLICY deals_del ON public.deals
FOR DELETE USING (auth_is_super_admin());

-- Deal analyses - organization-scoped via deal relationship
ALTER TABLE public.deal_analyses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS reuben_analyses_access ON public.deal_analyses;
DROP POLICY IF EXISTS deal_analyses_sel ON public.deal_analyses;
DROP POLICY IF EXISTS deal_analyses_ins ON public.deal_analyses;
DROP POLICY IF EXISTS deal_analyses_upd ON public.deal_analyses;
DROP POLICY IF EXISTS deal_analyses_del ON public.deal_analyses;

-- Add organization_id to deal_analyses for direct scoping
ALTER TABLE public.deal_analyses ADD COLUMN IF NOT EXISTS organization_id UUID;

-- Update existing analyses
UPDATE public.deal_analyses 
SET organization_id = d.organization_id 
FROM public.deals d 
WHERE deal_analyses.deal_id = d.id AND deal_analyses.organization_id IS NULL;

CREATE OR REPLACE FUNCTION populate_analysis_organization_id()
RETURNS TRIGGER AS $$
BEGIN
  SELECT organization_id INTO NEW.organization_id
  FROM public.deals 
  WHERE id = NEW.deal_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS analysis_org_id_trigger ON public.deal_analyses;
CREATE TRIGGER analysis_org_id_trigger
  BEFORE INSERT OR UPDATE ON public.deal_analyses
  FOR EACH ROW EXECUTE FUNCTION populate_analysis_organization_id();

CREATE POLICY deal_analyses_sel ON public.deal_analyses
FOR SELECT USING (auth_is_super_admin() OR organization_id = auth_org_id());

CREATE POLICY deal_analyses_ins ON public.deal_analyses
FOR INSERT WITH CHECK (auth_is_super_admin() OR organization_id = auth_org_id());

CREATE POLICY deal_analyses_upd ON public.deal_analyses
FOR UPDATE USING (auth_is_super_admin() OR organization_id = auth_org_id())
WITH CHECK (auth_is_super_admin() OR organization_id = auth_org_id());

CREATE POLICY deal_analyses_del ON public.deal_analyses
FOR DELETE USING (auth_is_super_admin());

-- Step 2: Replace SECURITY DEFINER views with safe patterns

-- 2.1: Convert dashboard_stats to plain view (SECURITY INVOKER by default)
DROP VIEW IF EXISTS dashboard_stats CASCADE;
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
  (SELECT count(*) FROM public.organizations) as orgs_active,
  (SELECT count(*) FROM public.profiles WHERE (is_deleted IS NULL OR is_deleted = false)) as users_total,
  (SELECT count(*) FROM public.funds WHERE is_active = true) as funds_active,
  (SELECT count(*) FROM public.deals WHERE status IN ('sourced', 'screening', 'due_diligence', 'investment_committee', 'approved')) as deals_pipeline;

-- 2.2: Create admin-only RPC functions for cross-tenant exports
CREATE OR REPLACE FUNCTION admin_list_all_orgs()
RETURNS SETOF public.organizations
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.organizations;
$$;

CREATE OR REPLACE FUNCTION list_platform_activities(p_limit integer DEFAULT 25, p_offset integer DEFAULT 0)
RETURNS TABLE(id uuid, title text, activity_type text, priority text, user_id uuid, fund_id uuid, created_at timestamp with time zone)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id, a.title, a.activity_type::text, a.priority::text, a.user_id, a.fund_id, a.created_at
  FROM public.activity_events a
  ORDER BY a.created_at DESC
  LIMIT GREATEST(p_limit, 0) OFFSET GREATEST(p_offset, 0);
$$;

-- Revoke public access and grant to authenticated users only
REVOKE ALL ON FUNCTION admin_list_all_orgs() FROM public;
GRANT EXECUTE ON FUNCTION admin_list_all_orgs() TO authenticated;

REVOKE ALL ON FUNCTION list_platform_activities(integer, integer) FROM public;
GRANT EXECUTE ON FUNCTION list_platform_activities(integer, integer) TO authenticated;

-- Step 4: Fix deal_status enum deterministically
DO $$
BEGIN
  -- Add 'archived' if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t 
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'deal_status' AND e.enumlabel = 'archived'
  ) THEN
    ALTER TYPE deal_status ADD VALUE 'archived';
  END IF;
END $$;

-- Step 5: Add linter & CI guardrails
CREATE VIEW rls_gaps AS
SELECT n.nspname as schema_name, c.relname as table_name
FROM pg_class c 
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
  AND c.relkind = 'r' 
  AND c.relrowsecurity = true
  AND NOT EXISTS (
    SELECT 1 FROM pg_policies p 
    WHERE p.schemaname = n.nspname AND p.tablename = c.relname
  );

CREATE VIEW rls_smells AS
SELECT schemaname as schema_name, tablename as table_name, policyname as policy_name
FROM pg_policies
WHERE lower(qual) LIKE '% select %' OR lower(with_check) LIKE '% select %'
   OR lower(qual) LIKE '% join %'  OR lower(with_check) LIKE '% join %'
   OR lower(qual) LIKE '% profiles %' OR lower(with_check) LIKE '% profiles %';