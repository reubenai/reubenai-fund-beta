-- Create the missing trigger on deal_analysis_datapoints_vc
-- This connects the existing trigger_vc_aggregation_on_update() function to an UPDATE trigger
CREATE TRIGGER trigger_vc_aggregation_on_enrichment_update
  AFTER UPDATE ON public.deal_analysis_datapoints_vc
  FOR EACH ROW
  WHEN (
    -- Only trigger when enrichment JSON fields actually change
    OLD.crunchbase_data_points_vc IS DISTINCT FROM NEW.crunchbase_data_points_vc OR
    OLD.linkedin_data_points_vc IS DISTINCT FROM NEW.linkedin_data_points_vc OR
    OLD.linkedin_profile_data_points_vc IS DISTINCT FROM NEW.linkedin_profile_data_points_vc OR
    OLD.perplexity_company_data_points_vc IS DISTINCT FROM NEW.perplexity_company_data_points_vc OR
    OLD.perplexity_founder_data_points_vc IS DISTINCT FROM NEW.perplexity_founder_data_points_vc OR
    OLD.perplexity_market_data_points_vc IS DISTINCT FROM NEW.perplexity_market_data_points_vc OR
    OLD.documents_data_points_vc IS DISTINCT FROM NEW.documents_data_points_vc
  )
  EXECUTE FUNCTION public.trigger_vc_aggregation_on_update();