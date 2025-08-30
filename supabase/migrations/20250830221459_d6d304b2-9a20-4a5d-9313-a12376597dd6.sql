-- Drop the strategy change trigger and function that's causing deal creation failures

-- First drop any triggers that use this function
DROP TRIGGER IF EXISTS trigger_strategy_change_analysis ON public.investment_strategies;

-- Drop the problematic function
DROP FUNCTION IF EXISTS public.invalidate_analyses_on_strategy_change();