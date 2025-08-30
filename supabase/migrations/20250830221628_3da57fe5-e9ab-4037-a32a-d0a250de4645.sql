-- Drop the strategy change trigger and function properly

-- Drop the trigger first (correct name)
DROP TRIGGER IF EXISTS trigger_invalidate_deal_analyses_on_strategy_change ON public.investment_strategies;

-- Now drop the function
DROP FUNCTION IF EXISTS public.invalidate_analyses_on_strategy_change();