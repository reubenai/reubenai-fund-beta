-- Fix RLS disabled error by enabling RLS on all public tables that need it
-- Check and enable RLS on common tables

-- Enable RLS on all main tables
ALTER TABLE public.roles_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_archival_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_memory_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_memory_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_strategies ENABLE ROW LEVEL SECURITY;

-- Add policies for roles_catalog (read-only for all authenticated)
CREATE POLICY "roles_catalog_sel" ON public.roles_catalog
FOR SELECT USING (true);

-- Add policies for investment_strategies
CREATE POLICY "strategies_sel" ON public.investment_strategies
FOR SELECT USING (
  auth_is_super_admin()
  OR EXISTS (
    SELECT 1 FROM public.funds f 
    WHERE f.id = investment_strategies.fund_id 
    AND f.organization_id = auth_org_id()
  )
);

CREATE POLICY "strategies_ins" ON public.investment_strategies
FOR INSERT WITH CHECK (
  auth_is_super_admin()
  OR EXISTS (
    SELECT 1 FROM public.funds f 
    WHERE f.id = investment_strategies.fund_id 
    AND f.organization_id = auth_org_id()
  )
);

CREATE POLICY "strategies_upd" ON public.investment_strategies
FOR UPDATE USING (
  auth_is_super_admin()
  OR EXISTS (
    SELECT 1 FROM public.funds f 
    WHERE f.id = investment_strategies.fund_id 
    AND f.organization_id = auth_org_id()
  )
) WITH CHECK (
  auth_is_super_admin()
  OR EXISTS (
    SELECT 1 FROM public.funds f 
    WHERE f.id = investment_strategies.fund_id 
    AND f.organization_id = auth_org_id()
  )
);

CREATE POLICY "strategies_del" ON public.investment_strategies
FOR DELETE USING (
  auth_is_super_admin()
);

-- Grant permissions for investment_strategies
GRANT SELECT, INSERT, UPDATE, DELETE ON public.investment_strategies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_archival_config TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fund_memory_entries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fund_memory_insights TO authenticated;
GRANT SELECT ON public.roles_catalog TO authenticated;