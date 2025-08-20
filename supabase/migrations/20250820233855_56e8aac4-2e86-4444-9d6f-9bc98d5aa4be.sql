-- Add database constraint to ensure every fund has exactly one strategy
-- This enforces the simplified CREATE->UPDATE pattern

-- First, verify all existing funds have strategies (should already be true due to trigger)
DO $$
BEGIN
  -- Check if any funds are missing strategies
  IF EXISTS (
    SELECT 1 FROM public.funds f 
    LEFT JOIN public.investment_strategies s ON f.id = s.fund_id 
    WHERE s.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Some funds are missing investment strategies. All funds should have default strategies.';
  END IF;
END
$$;

-- Add unique constraint to ensure one strategy per fund
ALTER TABLE public.investment_strategies 
ADD CONSTRAINT unique_strategy_per_fund 
UNIQUE (fund_id);

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT unique_strategy_per_fund ON public.investment_strategies 
IS 'Ensures each fund has exactly one investment strategy. Funds get default strategies via trigger on creation.';