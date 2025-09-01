-- Fix the trigger function to handle null user context during migrations
CREATE OR REPLACE FUNCTION public.invalidate_deal_analyses_on_strategy_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only log the strategy change activity if there's an authenticated user
  -- Skip during migrations when auth.uid() is null
  IF TG_OP = 'UPDATE' AND auth.uid() IS NOT NULL THEN
    INSERT INTO public.activity_events (
      user_id,
      fund_id,
      activity_type,
      title,
      description,
      context_data
    ) VALUES (
      auth.uid(),
      NEW.fund_id,
      'criteria_updated',
      'Investment Strategy Updated',
      'Investment strategy criteria and thresholds have been updated',
      jsonb_build_object(
        'strategy_id', NEW.id,
        'fund_type', NEW.fund_type,
        'updated_fields', jsonb_build_object(
          'enhanced_criteria_changed', OLD.enhanced_criteria != NEW.enhanced_criteria,
          'thresholds_changed', 
            OLD.exciting_threshold != NEW.exciting_threshold OR
            OLD.promising_threshold != NEW.promising_threshold OR
            OLD.needs_development_threshold != NEW.needs_development_threshold
        ),
        'note', 'Strategy update does not trigger automatic deal re-analysis'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Now fix fund type consistency in investment_strategies table
-- Update existing records to use database-consistent fund types
UPDATE public.investment_strategies 
SET fund_type = 'venture_capital' 
WHERE fund_type = 'vc';

UPDATE public.investment_strategies 
SET fund_type = 'private_equity' 
WHERE fund_type = 'pe';

-- Add constraint to ensure only valid fund types are used
ALTER TABLE public.investment_strategies 
DROP CONSTRAINT IF EXISTS investment_strategies_fund_type_check;

ALTER TABLE public.investment_strategies 
ADD CONSTRAINT investment_strategies_fund_type_check 
CHECK (fund_type IN ('venture_capital', 'private_equity'));

-- Update the fund_type column comment for clarity
COMMENT ON COLUMN public.investment_strategies.fund_type IS 
'Fund type must match funds.fund_type values: venture_capital or private_equity';