-- Create the missing trigger on deal_analysis_datapoints_vc with correct column names
CREATE TRIGGER trigger_vc_aggregation_on_enrichment_update
  AFTER UPDATE ON public.deal_analysis_datapoints_vc
  FOR EACH ROW
  WHEN (
    -- Only trigger when enrichment JSON fields actually change
    OLD.deal_enrichment_crunchbase_export IS DISTINCT FROM NEW.deal_enrichment_crunchbase_export OR
    OLD.deal_enrichment_linkedin_export IS DISTINCT FROM NEW.deal_enrichment_linkedin_export OR
    OLD.deal_enrichment_linkedin_profile_export IS DISTINCT FROM NEW.deal_enrichment_linkedin_profile_export OR
    OLD.deal_enrichment_perplexity_company_export_vc IS DISTINCT FROM NEW.deal_enrichment_perplexity_company_export_vc OR
    OLD.deal_enrichment_perplexity_founder_export_vc IS DISTINCT FROM NEW.deal_enrichment_perplexity_founder_export_vc OR
    OLD.deal_enrichment_perplexity_market_export_vc IS DISTINCT FROM NEW.deal_enrichment_perplexity_market_export_vc OR
    OLD.documents_data_points_vc IS DISTINCT FROM NEW.documents_data_points_vc
  )
  EXECUTE FUNCTION public.trigger_vc_aggregation_on_update();