-- Fix investment strategies RLS policy with consistent authentication
-- Drop the problematic policy first
DROP POLICY IF EXISTS "investment_strategies_update_secure" ON public.investment_strategies;

-- Create a security definer function for consistent user access checking
CREATE OR REPLACE FUNCTION public.can_user_update_strategy(target_fund_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Check if user is Reuben admin
  SELECT CASE 
    WHEN is_reuben_admin() THEN true
    -- Check if user has proper role and organization access
    ELSE EXISTS (
      SELECT 1
      FROM funds f
      JOIN profiles p ON f.organization_id = p.organization_id
      WHERE f.id = target_fund_id
        AND p.user_id = auth.uid()
        AND (p.is_deleted IS NULL OR p.is_deleted = false)
        AND p.role IN ('super_admin', 'admin', 'fund_manager', 'analyst')
    )
  END;
$$;

-- Create new simplified RLS policy for updates
CREATE POLICY "investment_strategies_update_simplified" 
ON public.investment_strategies
FOR UPDATE
TO authenticated
USING (can_user_update_strategy(fund_id))
WITH CHECK (can_user_update_strategy(fund_id));

-- Also ensure SELECT policy exists for consistency
DROP POLICY IF EXISTS "investment_strategies_select_secure" ON public.investment_strategies;

CREATE POLICY "investment_strategies_select_simplified"
ON public.investment_strategies
FOR SELECT
TO authenticated
USING (can_user_update_strategy(fund_id));