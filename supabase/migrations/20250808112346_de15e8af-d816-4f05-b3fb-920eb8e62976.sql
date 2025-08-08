-- Add missing RLS policies for investment_strategies table to fix activity tracking
-- This ensures activity queries that reference investment strategies can access the data
-- WITHOUT modifying any existing functionality

-- First, ensure RLS is enabled on investment_strategies (safe if already enabled)
ALTER TABLE public.investment_strategies ENABLE ROW LEVEL SECURITY;

-- Create safe RLS policies for investment_strategies using existing security definer functions
-- These only ADD access, they don't restrict anything that currently works

CREATE POLICY "Users can view investment strategies for accessible funds"
ON public.investment_strategies
FOR SELECT
TO authenticated
USING (user_can_access_fund(fund_id));

CREATE POLICY "Users can manage investment strategies for manageable funds"
ON public.investment_strategies
FOR ALL
TO authenticated
USING (user_can_manage_fund(fund_id))
WITH CHECK (user_can_manage_fund(fund_id));

-- Add Reuben admin access (consistent with other tables)
CREATE POLICY "Reuben admins can manage all investment strategies"
ON public.investment_strategies
FOR ALL
TO authenticated
USING (is_reuben_email())
WITH CHECK (is_reuben_email());