-- Create trigger functions to automatically sync enrichment data to datapoints tables

-- Crunchbase trigger function
CREATE OR REPLACE FUNCTION public.trigger_crunchbase_datapoint_update()
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
    -- Update VC datapoints with Crunchbase data
    UPDATE public.deal_analysis_datapoints_vc 
    SET 
      deal_enrichment_crunchbase_export = NEW.raw_brightdata_response,
      source_engines = CASE WHEN 'crunchbase' = ANY(source_engines) 
        THEN source_engines
        ELSE array_append(source_engines, 'crunchbase') END,
      data_completeness_score = data_completeness_score + 10,
      updated_at = now()
    WHERE deal_id = NEW.deal_id;
    
  ELSIF fund_type_value = 'private_equity' OR fund_type_value = 'pe' THEN
    -- Update PE datapoints with Crunchbase data
    UPDATE public.deal_analysis_datapoints_pe 
    SET 
      deal_enrichment_crunchbase_export = NEW.raw_brightdata_response,
      source_engines = CASE WHEN 'crunchbase' = ANY(source_engines) 
        THEN source_engines
        ELSE array_append(source_engines, 'crunchbase') END,
      data_completeness_score = data_completeness_score + 10,
      updated_at = now()
    WHERE deal_id = NEW.deal_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- LinkedIn export trigger function
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
      deal_enrichment_linkedin_export = NEW.raw_brightdata_response,
      source_engines = CASE WHEN 'linkedin' = ANY(source_engines) 
        THEN source_engines
        ELSE array_append(source_engines, 'linkedin') END,
      data_completeness_score = data_completeness_score + 10,
      updated_at = now()
    WHERE deal_id = NEW.deal_id;
    
  ELSIF fund_type_value = 'private_equity' OR fund_type_value = 'pe' THEN
    -- Update PE datapoints with LinkedIn data
    UPDATE public.deal_analysis_datapoints_pe 
    SET 
      deal_enrichment_linkedin_export = NEW.raw_brightdata_response,
      source_engines = CASE WHEN 'linkedin' = ANY(source_engines) 
        THEN source_engines
        ELSE array_append(source_engines, 'linkedin') END,
      data_completeness_score = data_completeness_score + 10,
      updated_at = now()
    WHERE deal_id = NEW.deal_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- LinkedIn profile trigger function
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
    -- Update VC datapoints with LinkedIn profile data
    UPDATE public.deal_analysis_datapoints_vc 
    SET 
      deal_enrichment_linkedin_profile_export = NEW.raw_brightdata_response,
      source_engines = CASE WHEN 'linkedin_profile' = ANY(source_engines) 
        THEN source_engines
        ELSE array_append(source_engines, 'linkedin_profile') END,
      data_completeness_score = data_completeness_score + 10,
      updated_at = now()
    WHERE deal_id = NEW.deal_id;
    
  ELSIF fund_type_value = 'private_equity' OR fund_type_value = 'pe' THEN
    -- Update PE datapoints with LinkedIn profile data
    UPDATE public.deal_analysis_datapoints_pe 
    SET 
      deal_enrichment_linkedin_profile_export = NEW.raw_brightdata_response,
      source_engines = CASE WHEN 'linkedin_profile' = ANY(source_engines) 
        THEN source_engines
        ELSE array_append(source_engines, 'linkedin_profile') END,
      data_completeness_score = data_completeness_score + 10,
      updated_at = now()
    WHERE deal_id = NEW.deal_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Perplexity company trigger function for VC
CREATE OR REPLACE FUNCTION public.trigger_perplexity_company_vc_datapoint_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update VC datapoints with Perplexity company data
  UPDATE public.deal_analysis_datapoints_vc 
  SET 
    deal_enrichment_perplexity_company_export_vc = NEW.raw_perplexity_response,
    source_engines = CASE WHEN 'perplexity_company' = ANY(source_engines) 
      THEN source_engines
      ELSE array_append(source_engines, 'perplexity_company') END,
    data_completeness_score = data_completeness_score + 15,
    updated_at = now()
  WHERE deal_id = NEW.deal_id;
  
  RETURN NEW;
END;
$function$;

-- Perplexity company trigger function for PE (structured data)
CREATE OR REPLACE FUNCTION public.trigger_perplexity_company_pe_datapoint_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update PE datapoints with Perplexity company structured data
  UPDATE public.deal_analysis_datapoints_pe 
  SET 
    deal_enrichment_perplexity_company_export_pe = jsonb_build_object(
      'company_overview', NEW.company_overview,
      'business_model', NEW.business_model,
      'competitive_landscape', NEW.competitive_landscape,
      'market_position', NEW.market_position,
      'growth_metrics', NEW.growth_metrics,
      'financial_highlights', NEW.financial_highlights,
      'operational_metrics', NEW.operational_metrics,
      'key_success_factors', NEW.key_success_factors,
      'risk_factors', NEW.risk_factors,
      'industry_trends', NEW.industry_trends,
      'data_quality_score', NEW.data_quality_score,
      'confidence_level', NEW.confidence_level
    ),
    source_engines = CASE WHEN 'perplexity_company' = ANY(source_engines) 
      THEN source_engines
      ELSE array_append(source_engines, 'perplexity_company') END,
    data_completeness_score = data_completeness_score + 15,
    updated_at = now()
  WHERE deal_id = NEW.deal_id;
  
  RETURN NEW;
END;
$function$;

-- Create database triggers on enrichment tables
CREATE TRIGGER trigger_crunchbase_datapoint_sync
    AFTER INSERT OR UPDATE ON public.deal_enrichment_crunchbase_export
    FOR EACH ROW
    WHEN (NEW.raw_brightdata_response IS NOT NULL)
    EXECUTE FUNCTION public.trigger_crunchbase_datapoint_update();

CREATE TRIGGER trigger_linkedin_datapoint_sync
    AFTER INSERT OR UPDATE ON public.deal_enrichment_linkedin_export
    FOR EACH ROW
    WHEN (NEW.raw_brightdata_response IS NOT NULL)
    EXECUTE FUNCTION public.trigger_linkedin_datapoint_update();

CREATE TRIGGER trigger_linkedin_profile_datapoint_sync
    AFTER INSERT OR UPDATE ON public.deal_enrichment_linkedin_profile_export
    FOR EACH ROW
    WHEN (NEW.raw_brightdata_response IS NOT NULL)
    EXECUTE FUNCTION public.trigger_linkedin_profile_datapoint_update();

CREATE TRIGGER trigger_perplexity_company_vc_datapoint_sync
    AFTER INSERT OR UPDATE ON public.deal_enrichment_perplexity_company_export_vc
    FOR EACH ROW
    WHEN (NEW.raw_perplexity_response IS NOT NULL)
    EXECUTE FUNCTION public.trigger_perplexity_company_vc_datapoint_update();

CREATE TRIGGER trigger_perplexity_company_pe_datapoint_sync
    AFTER INSERT OR UPDATE ON public.deal_enrichment_perplexity_company_export_pe
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_perplexity_company_pe_datapoint_update();

-- Sync function to populate existing NULL records
CREATE OR REPLACE FUNCTION public.sync_existing_enrichment_data()
RETURNS TABLE(sync_type text, records_updated integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  crunchbase_vc_count INTEGER := 0;
  linkedin_vc_count INTEGER := 0;
  perplexity_company_vc_count INTEGER := 0;
  crunchbase_pe_count INTEGER := 0;
  linkedin_pe_count INTEGER := 0;
  perplexity_company_pe_count INTEGER := 0;
BEGIN
  -- Sync Crunchbase data for VC
  UPDATE public.deal_analysis_datapoints_vc 
  SET 
    deal_enrichment_crunchbase_export = cb.raw_brightdata_response,
    source_engines = CASE WHEN 'crunchbase' = ANY(source_engines) 
      THEN source_engines
      ELSE array_append(source_engines, 'crunchbase') END,
    data_completeness_score = data_completeness_score + 10,
    updated_at = now()
  FROM public.deal_enrichment_crunchbase_export cb
  JOIN public.deals d ON d.id = cb.deal_id
  JOIN public.funds f ON f.id = d.fund_id
  WHERE deal_analysis_datapoints_vc.deal_id = cb.deal_id
    AND deal_analysis_datapoints_vc.deal_enrichment_crunchbase_export IS NULL
    AND cb.raw_brightdata_response IS NOT NULL
    AND (f.fund_type = 'venture_capital' OR f.fund_type = 'vc');
    
  GET DIAGNOSTICS crunchbase_vc_count = ROW_COUNT;
  
  -- Sync LinkedIn data for VC
  UPDATE public.deal_analysis_datapoints_vc 
  SET 
    deal_enrichment_linkedin_export = le.raw_brightdata_response,
    source_engines = CASE WHEN 'linkedin' = ANY(source_engines) 
      THEN source_engines
      ELSE array_append(source_engines, 'linkedin') END,
    data_completeness_score = data_completeness_score + 10,
    updated_at = now()
  FROM public.deal_enrichment_linkedin_export le
  JOIN public.deals d ON d.id = le.deal_id
  JOIN public.funds f ON f.id = d.fund_id
  WHERE deal_analysis_datapoints_vc.deal_id = le.deal_id
    AND deal_analysis_datapoints_vc.deal_enrichment_linkedin_export IS NULL
    AND le.raw_brightdata_response IS NOT NULL
    AND (f.fund_type = 'venture_capital' OR f.fund_type = 'vc');
    
  GET DIAGNOSTICS linkedin_vc_count = ROW_COUNT;
    
  -- Sync Perplexity company data for VC
  UPDATE public.deal_analysis_datapoints_vc 
  SET 
    deal_enrichment_perplexity_company_export_vc = pc.raw_perplexity_response,
    source_engines = CASE WHEN 'perplexity_company' = ANY(source_engines) 
      THEN source_engines
      ELSE array_append(source_engines, 'perplexity_company') END,
    data_completeness_score = data_completeness_score + 15,
    updated_at = now()
  FROM public.deal_enrichment_perplexity_company_export_vc pc
  JOIN public.deals d ON d.id = pc.deal_id
  JOIN public.funds f ON f.id = d.fund_id
  WHERE deal_analysis_datapoints_vc.deal_id = pc.deal_id
    AND deal_analysis_datapoints_vc.deal_enrichment_perplexity_company_export_vc IS NULL
    AND pc.raw_perplexity_response IS NOT NULL
    AND (f.fund_type = 'venture_capital' OR f.fund_type = 'vc');
    
  GET DIAGNOSTICS perplexity_company_vc_count = ROW_COUNT;
    
  -- Sync Crunchbase data for PE
  UPDATE public.deal_analysis_datapoints_pe 
  SET 
    deal_enrichment_crunchbase_export = cb.raw_brightdata_response,
    source_engines = CASE WHEN 'crunchbase' = ANY(source_engines) 
      THEN source_engines
      ELSE array_append(source_engines, 'crunchbase') END,
    data_completeness_score = data_completeness_score + 10,
    updated_at = now()
  FROM public.deal_enrichment_crunchbase_export cb
  JOIN public.deals d ON d.id = cb.deal_id
  JOIN public.funds f ON f.id = d.fund_id
  WHERE deal_analysis_datapoints_pe.deal_id = cb.deal_id
    AND deal_analysis_datapoints_pe.deal_enrichment_crunchbase_export IS NULL
    AND cb.raw_brightdata_response IS NOT NULL
    AND (f.fund_type = 'private_equity' OR f.fund_type = 'pe');
  
  GET DIAGNOSTICS crunchbase_pe_count = ROW_COUNT;
  
  -- Return sync results
  RETURN QUERY VALUES 
    ('crunchbase_vc', crunchbase_vc_count),
    ('linkedin_vc', linkedin_vc_count),
    ('perplexity_company_vc', perplexity_company_vc_count),
    ('crunchbase_pe', crunchbase_pe_count);
END;
$function$;