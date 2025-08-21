-- Remove duplicate unique constraint that's causing ON CONFLICT issues
-- Keep only the more descriptive constraint name
DROP CONSTRAINT IF EXISTS unique_fund_strategy ON public.investment_strategies;