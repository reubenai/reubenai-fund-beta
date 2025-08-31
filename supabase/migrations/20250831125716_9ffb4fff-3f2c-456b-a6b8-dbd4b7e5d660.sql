-- Create the missing trigger that connects the function to the table
CREATE TRIGGER trigger_vc_aggregation_on_enrichment_update
    AFTER UPDATE ON public.deal_analysis_datapoints_vc
    FOR EACH ROW
    WHEN (
        -- Only trigger when enrichment JSONB fields actually change
        OLD.crunchbase_data_points_vc IS DISTINCT FROM NEW.crunchbase_data_points_vc OR
        OLD.perplexity_data_points_vc IS DISTINCT FROM NEW.perplexity_data_points_vc OR
        OLD.linkedin_data_points_vc IS DISTINCT FROM NEW.linkedin_data_points_vc OR
        OLD.documents_data_points_vc IS DISTINCT FROM NEW.documents_data_points_vc
    )
    EXECUTE FUNCTION public.trigger_vc_aggregation_on_update();