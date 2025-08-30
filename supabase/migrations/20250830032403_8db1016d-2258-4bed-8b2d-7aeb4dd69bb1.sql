-- Phase 1: Auto-create datapoint records on deal creation
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

-- Phase 2: Helper function to extract VC data from Crunchbase
CREATE OR REPLACE FUNCTION public.extract_vc_data_from_crunchbase(crunchbase_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
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

-- Phase 2: Helper function to extract PE data from Crunchbase  
CREATE OR REPLACE FUNCTION public.extract_pe_data_from_crunchbase(crunchbase_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
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
    extracted_data := jsonb_set(extracted_data, '{founding_year}', crunchbase_data->'founding_year');
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

-- Phase 3: Crunchbase trigger function
CREATE OR REPLACE FUNCTION public.trigger_crunchbase_datapoint_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  fund_type_value text;
  extracted_vc_data jsonb;
  extracted_pe_data jsonb;
BEGIN
  -- Get fund type for this deal
  SELECT f.fund_type::text INTO fund_type_value
  FROM public.deals d
  JOIN public.funds f ON d.fund_id = f.id
  WHERE d.id = NEW.deal_id;
  
  IF fund_type_value = 'venture_capital' OR fund_type_value = 'vc' THEN
    -- Extract VC-specific data
    extracted_vc_data := extract_vc_data_from_crunchbase(NEW.enrichment_data);
    
    -- Update VC datapoints
    UPDATE public.deal_analysis_datapoints_vc 
    SET 
      deal_enrichment_crunchbase_export = NEW.enrichment_data,
      funding_rounds = CASE WHEN extracted_vc_data ? 'funding_rounds' 
        THEN (extracted_vc_data->>'funding_rounds')::jsonb 
        ELSE funding_rounds END,
      investors = CASE WHEN extracted_vc_data ? 'investors'
        THEN array(SELECT jsonb_array_elements_text(extracted_vc_data->'investors'))
        ELSE investors END,
      valuation = CASE WHEN extracted_vc_data ? 'valuation'
        THEN (extracted_vc_data->>'valuation')::bigint
        ELSE valuation END,
      employee_count = CASE WHEN extracted_vc_data ? 'employee_count'
        THEN (extracted_vc_data->>'employee_count')::integer
        ELSE employee_count END,
      founding_year = CASE WHEN extracted_vc_data ? 'founding_year'
        THEN (extracted_vc_data->>'founding_year')::integer
        ELSE founding_year END,
      source_engines = array_append(
        CASE WHEN 'crunchbase' = ANY(source_engines) THEN source_engines
        ELSE array_append(source_engines, 'crunchbase') END
      ),
      data_completeness_score = data_completeness_score + 10,
      updated_at = now()
    WHERE deal_id = NEW.deal_id;
    
  ELSIF fund_type_value = 'private_equity' OR fund_type_value = 'pe' THEN
    -- Extract PE-specific data
    extracted_pe_data := extract_pe_data_from_crunchbase(NEW.enrichment_data);
    
    -- Update PE datapoints
    UPDATE public.deal_analysis_datapoints_pe 
    SET 
      deal_enrichment_crunchbase_export = NEW.enrichment_data,
      employee_count = CASE WHEN extracted_pe_data ? 'employee_count'
        THEN (extracted_pe_data->>'employee_count')::integer
        ELSE employee_count END,
      founding_year = CASE WHEN extracted_pe_data ? 'founding_year'
        THEN (extracted_pe_data->>'founding_year')::integer
        ELSE founding_year END,
      source_engines = array_append(
        CASE WHEN 'crunchbase' = ANY(source_engines) THEN source_engines
        ELSE array_append(source_engines, 'crunchbase') END
      ),
      data_completeness_score = data_completeness_score + 10,
      updated_at = now()
    WHERE deal_id = NEW.deal_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Phase 3: LinkedIn trigger function
CREATE OR REPLACE FUNCTION public.trigger_linkedin_datapoint_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  fund_type_value text;
BEGIN
  -- Get fund type for this deal
  SELECT f.fund_type::text INTO fund_type_value
  FROM public.deals d
  JOIN public.funds f ON d.fund_id = f.id
  WHERE d.id = NEW.deal_id;
  
  IF fund_type_value = 'venture_capital' OR fund_type_value = 'vc' THEN
    -- Update VC datapoints with LinkedIn data
    UPDATE public.deal_analysis_datapoints_vc 
    SET 
      deal_enrichment_linkedin_export = NEW.enrichment_data,
      source_engines = array_append(
        CASE WHEN 'linkedin' = ANY(source_engines) THEN source_engines
        ELSE array_append(source_engines, 'linkedin') END
      ),
      data_completeness_score = data_completeness_score + 8,
      updated_at = now()
    WHERE deal_id = NEW.deal_id;
    
  ELSIF fund_type_value = 'private_equity' OR fund_type_value = 'pe' THEN
    -- Update PE datapoints with LinkedIn data
    UPDATE public.deal_analysis_datapoints_pe 
    SET 
      deal_enrichment_linkedin_export = NEW.enrichment_data,
      source_engines = array_append(
        CASE WHEN 'linkedin' = ANY(source_engines) THEN source_engines
        ELSE array_append(source_engines, 'linkedin') END
      ),
      data_completeness_score = data_completeness_score + 8,
      updated_at = now()
    WHERE deal_id = NEW.deal_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Phase 3: LinkedIn Profile trigger function
CREATE OR REPLACE FUNCTION public.trigger_linkedin_profile_datapoint_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER  
SET search_path TO 'public'
AS $function$
DECLARE
  fund_type_value text;
BEGIN
  -- Get fund type for this deal
  SELECT f.fund_type::text INTO fund_type_value
  FROM public.deals d
  JOIN public.funds f ON d.fund_id = f.id
  WHERE d.id = NEW.deal_id;
  
  IF fund_type_value = 'venture_capital' OR fund_type_value = 'vc' THEN
    -- Update VC datapoints with LinkedIn Profile data
    UPDATE public.deal_analysis_datapoints_vc 
    SET 
      deal_enrichment_linkedin_profile_export = NEW.enrichment_data,
      source_engines = array_append(
        CASE WHEN 'linkedin_profile' = ANY(source_engines) THEN source_engines
        ELSE array_append(source_engines, 'linkedin_profile') END
      ),
      data_completeness_score = data_completeness_score + 12,
      updated_at = now()
    WHERE deal_id = NEW.deal_id;
    
  ELSIF fund_type_value = 'private_equity' OR fund_type_value = 'pe' THEN
    -- Update PE datapoints with LinkedIn Profile data
    UPDATE public.deal_analysis_datapoints_pe 
    SET 
      deal_enrichment_linkedin_profile_export = NEW.enrichment_data,
      source_engines = array_append(
        CASE WHEN 'linkedin_profile' = ANY(source_engines) THEN source_engines
        ELSE array_append(source_engines, 'linkedin_profile') END
      ),
      data_completeness_score = data_completeness_score + 12,
      updated_at = now()
    WHERE deal_id = NEW.deal_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Phase 3: Perplexity Company trigger function
CREATE OR REPLACE FUNCTION public.trigger_perplexity_company_datapoint_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  fund_type_value text;
BEGIN
  -- Get fund type for this deal
  SELECT f.fund_type::text INTO fund_type_value
  FROM public.deals d
  JOIN public.funds f ON d.fund_id = f.id
  WHERE d.id = NEW.deal_id;
  
  IF fund_type_value = 'venture_capital' OR fund_type_value = 'vc' THEN
    -- Update VC datapoints with Perplexity Company data
    UPDATE public.deal_analysis_datapoints_vc 
    SET 
      deal_enrichment_perplexity_company_export_vc = NEW.enrichment_data,
      source_engines = array_append(
        CASE WHEN 'perplexity_company' = ANY(source_engines) THEN source_engines
        ELSE array_append(source_engines, 'perplexity_company') END
      ),
      data_completeness_score = data_completeness_score + 15,
      updated_at = now()
    WHERE deal_id = NEW.deal_id;
    
  ELSIF fund_type_value = 'private_equity' OR fund_type_value = 'pe' THEN
    -- Update PE datapoints with Perplexity Company data
    UPDATE public.deal_analysis_datapoints_pe 
    SET 
      deal_enrichment_perplexity_company_export_pe = NEW.enrichment_data,
      source_engines = array_append(
        CASE WHEN 'perplexity_company' = ANY(source_engines) THEN source_engines
        ELSE array_append(source_engines, 'perplexity_company') END
      ),
      data_completeness_score = data_completeness_score + 15,
      updated_at = now()
    WHERE deal_id = NEW.deal_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Phase 3: Perplexity Founder trigger function  
CREATE OR REPLACE FUNCTION public.trigger_perplexity_founder_datapoint_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  fund_type_value text;
BEGIN
  -- Get fund type for this deal
  SELECT f.fund_type::text INTO fund_type_value
  FROM public.deals d
  JOIN public.funds f ON d.fund_id = f.id
  WHERE d.id = NEW.deal_id;
  
  IF fund_type_value = 'venture_capital' OR fund_type_value = 'vc' THEN
    -- Update VC datapoints with Perplexity Founder data
    UPDATE public.deal_analysis_datapoints_vc 
    SET 
      deal_enrichment_perplexity_founder_export_vc = NEW.enrichment_data,
      source_engines = array_append(
        CASE WHEN 'perplexity_founder' = ANY(source_engines) THEN source_engines
        ELSE array_append(source_engines, 'perplexity_founder') END
      ),
      data_completeness_score = data_completeness_score + 12,
      updated_at = now()
    WHERE deal_id = NEW.deal_id;
    
  ELSIF fund_type_value = 'private_equity' OR fund_type_value = 'pe' THEN
    -- Update PE datapoints with Perplexity Founder data
    UPDATE public.deal_analysis_datapoints_pe 
    SET 
      deal_enrichment_perplexity_founder_export_pe = NEW.enrichment_data,
      source_engines = array_append(
        CASE WHEN 'perplexity_founder' = ANY(source_engines) THEN source_engines
        ELSE array_append(source_engines, 'perplexity_founder') END
      ),
      data_completeness_score = data_completeness_score + 12,
      updated_at = now()
    WHERE deal_id = NEW.deal_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Phase 3: Perplexity Market trigger function
CREATE OR REPLACE FUNCTION public.trigger_perplexity_market_datapoint_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  fund_type_value text;
BEGIN
  -- Get fund type for this deal
  SELECT f.fund_type::text INTO fund_type_value
  FROM public.deals d
  JOIN public.funds f ON d.fund_id = f.id
  WHERE d.id = NEW.deal_id;
  
  IF fund_type_value = 'venture_capital' OR fund_type_value = 'vc' THEN
    -- Update VC datapoints with Perplexity Market data
    UPDATE public.deal_analysis_datapoints_vc 
    SET 
      deal_enrichment_perplexity_market_export_vc = NEW.enrichment_data,
      source_engines = array_append(
        CASE WHEN 'perplexity_market' = ANY(source_engines) THEN source_engines
        ELSE array_append(source_engines, 'perplexity_market') END
      ),
      data_completeness_score = data_completeness_score + 15,
      updated_at = now()
    WHERE deal_id = NEW.deal_id;
    
  ELSIF fund_type_value = 'private_equity' OR fund_type_value = 'pe' THEN
    -- Update PE datapoints with Perplexity Market data
    UPDATE public.deal_analysis_datapoints_pe 
    SET 
      deal_enrichment_perplexity_market_export_pe = NEW.enrichment_data,
      source_engines = array_append(
        CASE WHEN 'perplexity_market' = ANY(source_engines) THEN source_engines
        ELSE array_append(source_engines, 'perplexity_market') END
      ),
      data_completeness_score = data_completeness_score + 15,
      updated_at = now()
    WHERE deal_id = NEW.deal_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Phase 3: Documents trigger function
CREATE OR REPLACE FUNCTION public.trigger_documents_datapoint_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  fund_type_value text;
  document_data jsonb;
BEGIN
  -- Only process if document has analysis data
  IF NEW.data_points_vc IS NULL AND NEW.data_points_pe IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get fund type for this deal
  SELECT f.fund_type::text INTO fund_type_value
  FROM public.deals d
  JOIN public.funds f ON d.fund_id = f.id
  WHERE d.id = NEW.deal_id;
  
  IF fund_type_value = 'venture_capital' OR fund_type_value = 'vc' AND NEW.data_points_vc IS NOT NULL THEN
    -- Update VC datapoints with document data
    UPDATE public.deal_analysis_datapoints_vc 
    SET 
      documents_data_points_vc = NEW.data_points_vc,
      source_engines = array_append(
        CASE WHEN 'documents' = ANY(source_engines) THEN source_engines
        ELSE array_append(source_engines, 'documents') END
      ),
      data_completeness_score = data_completeness_score + 20,
      updated_at = now()
    WHERE deal_id = NEW.deal_id;
    
  ELSIF fund_type_value = 'private_equity' OR fund_type_value = 'pe' AND NEW.data_points_pe IS NOT NULL THEN
    -- Update PE datapoints with document data
    UPDATE public.deal_analysis_datapoints_pe 
    SET 
      documents_data_points_pe = NEW.data_points_pe,
      source_engines = array_append(
        CASE WHEN 'documents' = ANY(source_engines) THEN source_engines
        ELSE array_append(source_engines, 'documents') END
      ),
      data_completeness_score = data_completeness_score + 20,
      updated_at = now()
    WHERE deal_id = NEW.deal_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create triggers for auto-creating datapoint records on deal creation
DROP TRIGGER IF EXISTS trigger_auto_create_datapoints ON public.deals;
CREATE TRIGGER trigger_auto_create_datapoints
  AFTER INSERT ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.auto_create_deal_datapoints();

-- Create triggers for enrichment data updates
DROP TRIGGER IF EXISTS trigger_crunchbase_update ON public.deal_enrichment_crunchbase;  
CREATE TRIGGER trigger_crunchbase_update
  AFTER INSERT OR UPDATE ON public.deal_enrichment_crunchbase
  FOR EACH ROW EXECUTE FUNCTION public.trigger_crunchbase_datapoint_update();

DROP TRIGGER IF EXISTS trigger_linkedin_update ON public.deal_enrichment_linkedin;
CREATE TRIGGER trigger_linkedin_update  
  AFTER INSERT OR UPDATE ON public.deal_enrichment_linkedin
  FOR EACH ROW EXECUTE FUNCTION public.trigger_linkedin_datapoint_update();

DROP TRIGGER IF EXISTS trigger_linkedin_profile_update ON public.deal_enrichment_linkedin_profile;
CREATE TRIGGER trigger_linkedin_profile_update
  AFTER INSERT OR UPDATE ON public.deal_enrichment_linkedin_profile  
  FOR EACH ROW EXECUTE FUNCTION public.trigger_linkedin_profile_datapoint_update();

DROP TRIGGER IF EXISTS trigger_perplexity_company_update ON public.deal_enrichment_perplexity_company;
CREATE TRIGGER trigger_perplexity_company_update
  AFTER INSERT OR UPDATE ON public.deal_enrichment_perplexity_company
  FOR EACH ROW EXECUTE FUNCTION public.trigger_perplexity_company_datapoint_update();

DROP TRIGGER IF EXISTS trigger_perplexity_founder_vc_update ON public.deal_enrichment_perplexity_founder_vc;  
CREATE TRIGGER trigger_perplexity_founder_vc_update
  AFTER INSERT OR UPDATE ON public.deal_enrichment_perplexity_founder_vc
  FOR EACH ROW EXECUTE FUNCTION public.trigger_perplexity_founder_datapoint_update();

DROP TRIGGER IF EXISTS trigger_perplexity_founder_pe_update ON public.deal_enrichment_perplexity_founder_pe;
CREATE TRIGGER trigger_perplexity_founder_pe_update
  AFTER INSERT OR UPDATE ON public.deal_enrichment_perplexity_founder_pe  
  FOR EACH ROW EXECUTE FUNCTION public.trigger_perplexity_founder_datapoint_update();

DROP TRIGGER IF EXISTS trigger_perplexity_market_vc_update ON public.deal_enrichment_perplexity_market_vc;
CREATE TRIGGER trigger_perplexity_market_vc_update
  AFTER INSERT OR UPDATE ON public.deal_enrichment_perplexity_market_vc
  FOR EACH ROW EXECUTE FUNCTION public.trigger_perplexity_market_datapoint_update();

DROP TRIGGER IF EXISTS trigger_perplexity_market_pe_update ON public.deal_enrichment_perplexity_market_pe;  
CREATE TRIGGER trigger_perplexity_market_pe_update
  AFTER INSERT OR UPDATE ON public.deal_enrichment_perplexity_market_pe
  FOR EACH ROW EXECUTE FUNCTION public.trigger_perplexity_market_datapoint_update();

DROP TRIGGER IF EXISTS trigger_documents_update ON public.deal_documents;
CREATE TRIGGER trigger_documents_update
  AFTER INSERT OR UPDATE ON public.deal_documents
  FOR EACH ROW EXECUTE FUNCTION public.trigger_documents_datapoint_update();