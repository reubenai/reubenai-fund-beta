-- Add missing RLS policies for investment_strategies table to fix activity tracking
-- This ensures activity queries that reference investment strategies can access the data
-- WITHOUT modifying any existing functionality

-- Enable RLS (safe if already enabled)
ALTER TABLE public.investment_strategies ENABLE ROW LEVEL SECURITY;

-- View policy for users with access to the fund
CREATE POLICY "Users can view investment strategies for accessible funds"
ON public.investment_strategies
FOR SELECT
TO authenticated
USING (user_can_access_fund(fund_id));

-- Manage policy for users who can manage the fund
CREATE POLICY "Users can manage investment strategies for manageable funds"
ON public.investment_strategies
FOR ALL
TO authenticated
USING (user_can_manage_fund(fund_id))
WITH CHECK (user_can_manage_fund(fund_id));

-- Admin policy aligned with existing patterns
CREATE POLICY "Reuben admins can manage all investment strategies"
ON public.investment_strategies
FOR ALL
TO authenticated
USING (is_reuben_email())
WITH CHECK (is_reuben_email());