-- Add unique constraint on fund_id to fix upsert operations
-- First, let's check if there are any duplicate fund_id entries and remove them
WITH duplicates AS (
  SELECT fund_id, MIN(id) as keep_id
  FROM public.investment_strategies
  GROUP BY fund_id
  HAVING COUNT(*) > 1
)
DELETE FROM public.investment_strategies 
WHERE id NOT IN (SELECT keep_id FROM duplicates)
AND fund_id IN (SELECT fund_id FROM duplicates);

-- Now add the unique constraint on fund_id
ALTER TABLE public.investment_strategies 
ADD CONSTRAINT investment_strategies_fund_id_unique UNIQUE (fund_id);