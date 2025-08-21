-- Activate automatic versioning trigger for investment strategies
CREATE TRIGGER investment_strategy_versioning_trigger
  BEFORE UPDATE ON public.investment_strategies
  FOR EACH ROW
  EXECUTE FUNCTION public.create_strategy_version();

-- Add search path security to the versioning function
ALTER FUNCTION public.create_strategy_version() SET search_path TO 'public';