-- Drop the trigger that increments analysis_version on strategy updates
DROP TRIGGER IF EXISTS trigger_invalidate_analyses_on_strategy_change ON public.investment_strategies;

-- Update the function to only log activity without touching deal_analyses
CREATE OR REPLACE FUNCTION public.invalidate_deal_analyses_on_strategy_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only log the strategy change activity (no deal analysis invalidation)
  -- This ensures strategy updates never trigger automatic re-analysis
  IF TG_OP = 'UPDATE' THEN
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

-- Re-create trigger for activity logging only
CREATE TRIGGER trigger_log_strategy_changes
  BEFORE UPDATE ON public.investment_strategies
  FOR EACH ROW
  EXECUTE FUNCTION public.invalidate_deal_analyses_on_strategy_change();