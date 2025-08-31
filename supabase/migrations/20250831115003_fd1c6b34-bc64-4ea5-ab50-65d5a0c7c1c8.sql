-- Create trigger function for VC data aggregation on UPDATE
CREATE OR REPLACE FUNCTION public.trigger_vc_aggregation_on_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  fund_type_value text;
  has_changes boolean := false;
BEGIN
  -- Check if this is a VC deal
  SELECT f.fund_type::text INTO fund_type_value
  FROM public.deals d
  JOIN public.funds f ON d.fund_id = f.id
  WHERE d.id = NEW.deal_id;
  
  IF fund_type_value != 'venture_capital' AND fund_type_value != 'vc' THEN
    RAISE LOG 'Skipping VC aggregation for non-VC deal: %', NEW.deal_id;
    RETURN NEW;
  END IF;
  
  -- Check if any enrichment fields have actually changed
  has_changes := (
    OLD.documents_data_points_vc IS DISTINCT FROM NEW.documents_data_points_vc OR
    OLD.deal_enrichment_crunchbase_export IS DISTINCT FROM NEW.deal_enrichment_crunchbase_export OR
    OLD.deal_enrichment_linkedin_export IS DISTINCT FROM NEW.deal_enrichment_linkedin_export OR
    OLD.deal_enrichment_linkedin_profile_export IS DISTINCT FROM NEW.deal_enrichment_linkedin_profile_export OR
    OLD.deal_enrichment_perplexity_company_export_vc IS DISTINCT FROM NEW.deal_enrichment_perplexity_company_export_vc OR
    OLD.deal_enrichment_perplexity_founder_export_vc IS DISTINCT FROM NEW.deal_enrichment_perplexity_founder_export_vc OR
    OLD.deal_enrichment_perplexity_market_export_vc IS DISTINCT FROM NEW.deal_enrichment_perplexity_market_export_vc
  );
  
  -- Only trigger aggregation if enrichment data actually changed
  IF has_changes THEN
    RAISE LOG 'VC enrichment data changed for deal %, triggering aggregation', NEW.deal_id;
    
    -- Call the existing VC data aggregation function
    PERFORM public.trigger_vc_data_aggregation_direct(NEW.deal_id);
    
    RAISE LOG 'VC data aggregation triggered for deal %', NEW.deal_id;
  ELSE
    RAISE LOG 'No enrichment data changes detected for deal %, skipping aggregation', NEW.deal_id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in VC aggregation trigger for deal %: %', NEW.deal_id, SQLERRM;
    -- Don't fail the update if aggregation fails
    RETURN NEW;
END;
$function$;

-- Create the UPDATE trigger on deal_analysis_datapoints_vc
DROP TRIGGER IF EXISTS trigger_vc_aggregation_on_enrichment_update ON public.deal_analysis_datapoints_vc;

CREATE TRIGGER trigger_vc_aggregation_on_enrichment_update
  AFTER UPDATE ON public.deal_analysis_datapoints_vc
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_vc_aggregation_on_update();