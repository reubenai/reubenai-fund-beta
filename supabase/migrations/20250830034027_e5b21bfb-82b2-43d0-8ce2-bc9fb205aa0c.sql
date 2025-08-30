-- Fix search path security warnings for new functions
CREATE OR REPLACE FUNCTION public.extract_vc_data_from_crunchbase(crunchbase_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  extracted_data jsonb := '{}';
BEGIN
  IF crunchbase_data IS NULL THEN
    RETURN extracted_data;
  END IF;
  
  -- Extract funding rounds
  IF crunchbase_data ? 'funding_rounds' THEN
    extracted_data := jsonb_set(extracted_data, '{funding_rounds}', crunchbase_data->'funding_rounds');
  END IF;
  
  -- Extract investors
  IF crunchbase_data ? 'investors' THEN
    extracted_data := jsonb_set(extracted_data, '{investors}', crunchbase_data->'investors');
  END IF;
  
  -- Extract valuation
  IF crunchbase_data ? 'valuation' THEN
    extracted_data := jsonb_set(extracted_data, '{valuation}', crunchbase_data->'valuation');
  END IF;
  
  -- Extract employee count
  IF crunchbase_data ? 'employee_count' THEN
    extracted_data := jsonb_set(extracted_data, '{employee_count}', crunchbase_data->'employee_count');
  END IF;
  
  -- Extract founding year
  IF crunchbase_data ? 'founded_year' THEN
    extracted_data := jsonb_set(extracted_data, '{founding_year}', crunchbase_data->'founded_year');
  END IF;
  
  RETURN extracted_data;
END;
$function$;

CREATE OR REPLACE FUNCTION public.extract_pe_data_from_crunchbase(crunchbase_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  extracted_data jsonb := '{}';
BEGIN
  IF crunchbase_data IS NULL THEN
    RETURN extracted_data;
  END IF;
  
  -- Extract employee count
  IF crunchbase_data ? 'employee_count' THEN
    extracted_data := jsonb_set(extracted_data, '{employee_count}', crunchbase_data->'employee_count');
  END IF;
  
  -- Extract founding year
  IF crunchbase_data ? 'founded_year' THEN
    extracted_data := jsonb_set(extracted_data, '{founding_year}', crunchbase_data->'founded_year');
  END IF;
  
  -- Extract revenue data
  IF crunchbase_data ? 'revenue' THEN
    extracted_data := jsonb_set(extracted_data, '{revenue_data}', crunchbase_data->'revenue');
  END IF;
  
  -- Extract acquisition history
  IF crunchbase_data ? 'acquisitions' THEN
    extracted_data := jsonb_set(extracted_data, '{acquisition_opportunities}', crunchbase_data->'acquisitions');
  END IF;
  
  RETURN extracted_data;
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