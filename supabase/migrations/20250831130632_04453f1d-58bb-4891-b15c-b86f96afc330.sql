-- Drop the existing trigger and recreate it to only watch source_engines
DROP TRIGGER IF EXISTS trigger_vc_aggregation_on_enrichment_update ON public.deal_analysis_datapoints_vc;

-- Create the trigger that only fires when source_engines changes
CREATE TRIGGER trigger_vc_aggregation_on_enrichment_update
    AFTER UPDATE ON public.deal_analysis_datapoints_vc
    FOR EACH ROW
    WHEN (
        -- Only trigger when source_engines field actually changes
        OLD.source_engines IS DISTINCT FROM NEW.source_engines
    )
    EXECUTE FUNCTION public.trigger_vc_aggregation_on_update();