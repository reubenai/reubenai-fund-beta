-- Check existing policies and create proper role-based access for investment_strategies_v2

-- First, let's see what policies exist on investment_strategies_v2
-- DROP existing restrictive policies if they exist
DROP POLICY IF EXISTS "Super admins can manage all strategies v2" ON public.investment_strategies_v2;
DROP POLICY IF EXISTS "Org isolation for strategies v2" ON public.investment_strategies_v2;

-- Create a function to check if user can access strategy v2 (similar to V1)
CREATE OR REPLACE FUNCTION public.can_user_access_strategy_v2(target_fund_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT CASE 
    WHEN auth_is_super_admin() THEN true
    ELSE EXISTS (
      SELECT 1
      FROM public.funds f
      JOIN public.profiles p ON f.organization_id = p.organization_id
      WHERE f.id = target_fund_id
        AND p.user_id = auth.uid()
        AND p.role IN ('super_admin', 'admin', 'fund_manager', 'analyst', 'viewer')
        AND (p.is_deleted IS NULL OR p.is_deleted = false)
    )
  END;
$$;

-- Create a function to check if user can update strategy v2
CREATE OR REPLACE FUNCTION public.can_user_update_strategy_v2(target_fund_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT CASE 
    WHEN auth_is_super_admin() THEN true
    ELSE EXISTS (
      SELECT 1
      FROM public.funds f
      JOIN public.profiles p ON f.organization_id = p.organization_id
      WHERE f.id = target_fund_id
        AND p.user_id = auth.uid()
        AND p.role IN ('super_admin', 'admin', 'fund_manager', 'analyst')
        AND (p.is_deleted IS NULL OR p.is_deleted = false)
    )
  END;
$$;

-- Create proper RLS policies for investment_strategies_v2
CREATE POLICY "Users can view strategies v2 for accessible funds"
ON public.investment_strategies_v2
FOR SELECT
USING (can_user_access_strategy_v2(fund_id));

CREATE POLICY "Users can insert strategies v2 for manageable funds"
ON public.investment_strategies_v2
FOR INSERT
WITH CHECK (can_user_update_strategy_v2(fund_id));

CREATE POLICY "Users can update strategies v2 for manageable funds"
ON public.investment_strategies_v2
FOR UPDATE
USING (can_user_update_strategy_v2(fund_id))
WITH CHECK (can_user_update_strategy_v2(fund_id));

CREATE POLICY "Users can delete strategies v2 for manageable funds"
ON public.investment_strategies_v2
FOR DELETE
USING (can_user_update_strategy_v2(fund_id));