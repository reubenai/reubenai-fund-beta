-- Create function to sync founding year from VC datapoints to deals table
CREATE OR REPLACE FUNCTION public.sync_founding_year_to_deals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only update if founding_year actually changed
  IF NEW.founding_year IS DISTINCT FROM OLD.founding_year THEN
    UPDATE public.deals 
    SET 
      founding_year = NEW.founding_year,
      updated_at = now()
    WHERE id = NEW.deal_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger on deal_analysis_datapoints_vc for founding_year updates
CREATE TRIGGER sync_founding_year_to_deals_trigger
  AFTER UPDATE OF founding_year ON public.deal_analysis_datapoints_vc
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_founding_year_to_deals();