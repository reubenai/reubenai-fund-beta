-- Phase 1: Auto-create datapoint records on deal creation (already exists, just updating)
CREATE OR REPLACE FUNCTION public.auto_create_deal_datapoints()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  fund_type_value text;
BEGIN
  -- Get fund_type from funds table using the fund_id
  SELECT fund_type::text INTO fund_type_value
  FROM public.funds 
  WHERE id = NEW.fund_id;
  
  -- Create initial datapoint record based on fund type
  IF fund_type_value = 'venture_capital' OR fund_type_value = 'vc' THEN
    INSERT INTO public.deal_analysis_datapoints_vc (
      deal_id,
      fund_id,
      organization_id,
      data_completeness_score,
      source_engines,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.fund_id,
      NEW.organization_id,
      0,
      '{}',
      now(),
      now()
    );
  ELSIF fund_type_value = 'private_equity' OR fund_type_value = 'pe' THEN
    INSERT INTO public.deal_analysis_datapoints_pe (
      deal_id,
      fund_id,
      organization_id,
      data_completeness_score,
      source_engines,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.fund_id,
      NEW.organization_id,
      0,
      '{}',
      now(),
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create triggers for auto-creating datapoint records on deal creation
DROP TRIGGER IF EXISTS trigger_auto_create_datapoints ON public.deals;
CREATE TRIGGER trigger_auto_create_datapoints
  AFTER INSERT ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.auto_create_deal_datapoints();

-- Create triggers for enrichment data updates using correct table names
DROP TRIGGER IF EXISTS trigger_crunchbase_export_update ON public.deal_enrichment_crunchbase_export;  
CREATE TRIGGER trigger_crunchbase_export_update
  AFTER INSERT OR UPDATE ON public.deal_enrichment_crunchbase_export
  FOR EACH ROW EXECUTE FUNCTION public.trigger_crunchbase_datapoint_update();

DROP TRIGGER IF EXISTS trigger_linkedin_export_update ON public.deal_enrichment_linkedin_export;
CREATE TRIGGER trigger_linkedin_export_update  
  AFTER INSERT OR UPDATE ON public.deal_enrichment_linkedin_export
  FOR EACH ROW EXECUTE FUNCTION public.trigger_linkedin_datapoint_update();

DROP TRIGGER IF EXISTS trigger_linkedin_profile_export_update ON public.deal_enrichment_linkedin_profile_export;
CREATE TRIGGER trigger_linkedin_profile_export_update
  AFTER INSERT OR UPDATE ON public.deal_enrichment_linkedin_profile_export  
  FOR EACH ROW EXECUTE FUNCTION public.trigger_linkedin_profile_datapoint_update();

DROP TRIGGER IF EXISTS trigger_perplexity_company_vc_export_update ON public.deal_enrichment_perplexity_company_export_vc;
CREATE TRIGGER trigger_perplexity_company_vc_export_update
  AFTER INSERT OR UPDATE ON public.deal_enrichment_perplexity_company_export_vc
  FOR EACH ROW EXECUTE FUNCTION public.trigger_perplexity_company_datapoint_update();

DROP TRIGGER IF EXISTS trigger_perplexity_company_pe_export_update ON public.deal_enrichment_perplexity_company_export_pe;
CREATE TRIGGER trigger_perplexity_company_pe_export_update
  AFTER INSERT OR UPDATE ON public.deal_enrichment_perplexity_company_export_pe
  FOR EACH ROW EXECUTE FUNCTION public.trigger_perplexity_company_datapoint_update();

DROP TRIGGER IF EXISTS trigger_perplexity_founder_vc_export_update ON public.deal_enrichment_perplexity_founder_export_vc;  
CREATE TRIGGER trigger_perplexity_founder_vc_export_update
  AFTER INSERT OR UPDATE ON public.deal_enrichment_perplexity_founder_export_vc
  FOR EACH ROW EXECUTE FUNCTION public.trigger_perplexity_founder_datapoint_update();

DROP TRIGGER IF EXISTS trigger_perplexity_founder_pe_export_update ON public.deal_enrichment_perplexity_founder_export_pe;
CREATE TRIGGER trigger_perplexity_founder_pe_export_update
  AFTER INSERT OR UPDATE ON public.deal_enrichment_perplexity_founder_export_pe  
  FOR EACH ROW EXECUTE FUNCTION public.trigger_perplexity_founder_datapoint_update();

DROP TRIGGER IF EXISTS trigger_perplexity_market_vc_export_update ON public.deal_enrichment_perplexity_market_export_vc;
CREATE TRIGGER trigger_perplexity_market_vc_export_update
  AFTER INSERT OR UPDATE ON public.deal_enrichment_perplexity_market_export_vc
  FOR EACH ROW EXECUTE FUNCTION public.trigger_perplexity_market_datapoint_update();

DROP TRIGGER IF EXISTS trigger_perplexity_market_pe_export_update ON public.deal_enrichment_perplexity_market_export_pe;  
CREATE TRIGGER trigger_perplexity_market_pe_export_update
  AFTER INSERT OR UPDATE ON public.deal_enrichment_perplexity_market_export_pe
  FOR EACH ROW EXECUTE FUNCTION public.trigger_perplexity_market_datapoint_update();

DROP TRIGGER IF EXISTS trigger_documents_update ON public.deal_documents;
CREATE TRIGGER trigger_documents_update
  AFTER INSERT OR UPDATE ON public.deal_documents
  FOR EACH ROW EXECUTE FUNCTION public.trigger_documents_datapoint_update();