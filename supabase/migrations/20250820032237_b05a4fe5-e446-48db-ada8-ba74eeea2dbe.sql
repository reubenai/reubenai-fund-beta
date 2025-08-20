-- Add unique constraint on fund_id to fix upsert operations
-- First, remove any duplicate fund_id entries keeping the most recent one
DELETE FROM public.investment_strategies 
WHERE id NOT IN (
  SELECT DISTINCT ON (fund_id) id
  FROM public.investment_strategies
  ORDER BY fund_id, created_at DESC
);

-- Now add the unique constraint on fund_id
ALTER TABLE public.investment_strategies 
ADD CONSTRAINT investment_strategies_fund_id_unique UNIQUE (fund_id);