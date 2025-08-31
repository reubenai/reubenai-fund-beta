-- Fix trigger infrastructure issues

-- First, drop any existing triggers to start clean
DROP TRIGGER IF EXISTS trigger_vc_data_aggregation_crunchbase ON public.deal2_enrichment_crunchbase_export;
DROP TRIGGER IF EXISTS trigger_vc_data_aggregation_linkedin ON public.deal2_enrichment_linkedin_export;
DROP TRIGGER IF EXISTS trigger_vc_data_aggregation_linkedin_profile ON public.deal2_enrichment_linkedin_profile_export;
DROP TRIGGER IF EXISTS trigger_vc_data_aggregation_perplexity_company_vc ON public.deal2_enrichment_perplexity_company_export_vc_duplicate;
DROP TRIGGER IF EXISTS trigger_vc_data_aggregation_perplexity_founder_vc ON public.deal2_enrichment_perplexity_founder_export_vc_duplicate;

-- Create triggers on all 5 enrichment tables
-- These will fire when processing_status changes to 'processed'
CREATE TRIGGER trigger_vc_data_aggregation_crunchbase
  AFTER UPDATE OF processing_status ON public.deal2_enrichment_crunchbase_export
  FOR EACH ROW
  WHEN (NEW.processing_status = 'processed' AND OLD.processing_status IS DISTINCT FROM NEW.processing_status)
  EXECUTE FUNCTION public.trigger_vc_data_aggregation();

CREATE TRIGGER trigger_vc_data_aggregation_linkedin
  AFTER UPDATE OF processing_status ON public.deal2_enrichment_linkedin_export
  FOR EACH ROW
  WHEN (NEW.processing_status = 'processed' AND OLD.processing_status IS DISTINCT FROM NEW.processing_status)
  EXECUTE FUNCTION public.trigger_vc_data_aggregation();

CREATE TRIGGER trigger_vc_data_aggregation_linkedin_profile
  AFTER UPDATE OF processing_status ON public.deal2_enrichment_linkedin_profile_export
  FOR EACH ROW
  WHEN (NEW.processing_status = 'processed' AND OLD.processing_status IS DISTINCT FROM NEW.processing_status)
  EXECUTE FUNCTION public.trigger_vc_data_aggregation();

CREATE TRIGGER trigger_vc_data_aggregation_perplexity_company_vc
  AFTER UPDATE OF processing_status ON public.deal2_enrichment_perplexity_company_export_vc_duplicate
  FOR EACH ROW
  WHEN (NEW.processing_status = 'processed' AND OLD.processing_status IS DISTINCT FROM NEW.processing_status)
  EXECUTE FUNCTION public.trigger_vc_data_aggregation();

CREATE TRIGGER trigger_vc_data_aggregation_perplexity_founder_vc
  AFTER UPDATE OF processing_status ON public.deal2_enrichment_perplexity_founder_export_vc_duplicate
  FOR EACH ROW
  WHEN (NEW.processing_status = 'processed' AND OLD.processing_status IS DISTINCT FROM NEW.processing_status)
  EXECUTE FUNCTION public.trigger_vc_data_aggregation();