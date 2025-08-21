-- Remove duplicate unique constraint that's causing ON CONFLICT issues
-- Keep only the more descriptive constraint name
ALTER TABLE public.investment_strategies DROP CONSTRAINT IF EXISTS unique_fund_strategy;