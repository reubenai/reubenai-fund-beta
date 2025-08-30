-- Fix sync function with correct enum values
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
    AND f.fund_type = 'venture_capital';
    
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
    AND f.fund_type = 'venture_capital';
    
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
    AND f.fund_type = 'venture_capital';
    
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
    AND f.fund_type = 'private_equity';
  
  GET DIAGNOSTICS crunchbase_pe_count = ROW_COUNT;
  
  -- Return sync results
  RETURN QUERY VALUES 
    ('crunchbase_vc', crunchbase_vc_count),
    ('linkedin_vc', linkedin_vc_count),
    ('perplexity_company_vc', perplexity_company_vc_count),
    ('crunchbase_pe', crunchbase_pe_count);
END;
$function$;

-- Also fix the trigger functions with correct enum values
CREATE OR REPLACE FUNCTION public.trigger_crunchbase_datapoint_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  fund_type_value fund_type;
BEGIN
  -- Get fund type for this deal
  SELECT f.fund_type INTO fund_type_value
  FROM public.deals d
  JOIN public.funds f ON d.fund_id = f.id
  WHERE d.id = NEW.deal_id;
  
  IF fund_type_value = 'venture_capital' THEN
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
    
  ELSIF fund_type_value = 'private_equity' THEN
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

-- Fix LinkedIn trigger too
CREATE OR REPLACE FUNCTION public.trigger_linkedin_datapoint_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  fund_type_value fund_type;
BEGIN
  -- Get fund type for this deal
  SELECT f.fund_type INTO fund_type_value
  FROM public.deals d
  JOIN public.funds f ON d.fund_id = f.id
  WHERE d.id = NEW.deal_id;
  
  IF fund_type_value = 'venture_capital' THEN
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
    
  ELSIF fund_type_value = 'private_equity' THEN
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

-- Fix LinkedIn profile trigger
CREATE OR REPLACE FUNCTION public.trigger_linkedin_profile_datapoint_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  fund_type_value fund_type;
BEGIN
  -- Get fund type for this deal
  SELECT f.fund_type INTO fund_type_value
  FROM public.deals d
  JOIN public.funds f ON d.fund_id = f.id
  WHERE d.id = NEW.deal_id;
  
  IF fund_type_value = 'venture_capital' THEN
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
    
  ELSIF fund_type_value = 'private_equity' THEN
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