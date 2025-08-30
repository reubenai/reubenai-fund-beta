-- Create function to sync competitors from VC datapoints to deals table
CREATE OR REPLACE FUNCTION public.sync_competitors_to_deals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only update if competitors actually changed
  IF NEW.competitors IS DISTINCT FROM OLD.competitors THEN
    UPDATE public.deals 
    SET 
      competitors = NEW.competitors,
      updated_at = now()
    WHERE id = NEW.deal_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger on deal_analysis_datapoints_vc for competitors updates
CREATE TRIGGER sync_competitors_to_deals_trigger
  AFTER UPDATE OF competitors ON public.deal_analysis_datapoints_vc
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_competitors_to_deals();