-- Drop the industry change trigger and function that's causing deal creation failures

-- Drop the trigger first
DROP TRIGGER IF EXISTS trigger_industry_change_analysis ON public.deals;

-- Drop the problematic function
DROP FUNCTION IF EXISTS public.invalidate_analyses_on_industry_change();