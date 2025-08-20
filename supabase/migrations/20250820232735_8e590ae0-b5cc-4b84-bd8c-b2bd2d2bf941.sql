-- Fix strategy activity logging to capture real authenticated users
-- Change from SECURITY DEFINER to SECURITY INVOKER so auth.uid() returns the actual user

CREATE OR REPLACE FUNCTION public.invalidate_deal_analyses_on_strategy_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY INVOKER  -- Changed from SECURITY DEFINER to capture actual user
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Mark all deal analyses for this fund as needing re-analysis
  UPDATE public.deal_analyses 
  SET analysis_version = analysis_version + 1,
      updated_at = now()
  WHERE deal_id IN (
    SELECT id FROM public.deals WHERE fund_id = NEW.fund_id
  );
  
  -- Log the strategy change (only for updates, not initial creation)
  -- Now auth.uid() will properly return the authenticated user's ID
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.activity_events (
      user_id,
      fund_id,
      activity_type,
      title,
      description,
      context_data
    ) VALUES (
      auth.uid(),  -- This will now return the actual authenticated user
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
        )
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;