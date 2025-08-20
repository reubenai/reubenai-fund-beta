-- Remove duplicate constraint to fix ON CONFLICT specification error
-- Keep the original unique_fund_strategy constraint which was working
ALTER TABLE public.investment_strategies 
DROP CONSTRAINT IF EXISTS investment_strategies_fund_id_unique;

-- Verify the original constraint still exists
-- The unique_fund_strategy constraint should handle all upsert scenarios