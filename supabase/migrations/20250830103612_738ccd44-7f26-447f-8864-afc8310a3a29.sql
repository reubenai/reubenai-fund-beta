-- Fix Perplexity enrichment trigger functions to use correct field name
-- The triggers were trying to access NEW.data_retrieved but Perplexity tables have raw_perplexity_response

-- Fix trigger for Perplexity Company enrichment
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
      deal_enrichment_perplexity_company_export_vc = NEW.raw_perplexity_response,
      source_engines = CASE WHEN 'perplexity_company' = ANY(source_engines) 
        THEN source_engines
        ELSE array_append(source_engines, 'perplexity_company') END,
      data_completeness_score = data_completeness_score + 20,
      updated_at = now()
    WHERE deal_id = NEW.deal_id;
    
  ELSIF fund_type_value = 'private_equity' OR fund_type_value = 'pe' THEN
    -- Update PE datapoints with Perplexity Company data
    UPDATE public.deal_analysis_datapoints_pe 
    SET 
      deal_enrichment_perplexity_company_export_pe = NEW.raw_perplexity_response,
      source_engines = CASE WHEN 'perplexity_company' = ANY(source_engines) 
        THEN source_engines
        ELSE array_append(source_engines, 'perplexity_company') END,
      data_completeness_score = data_completeness_score + 20,
      updated_at = now()
    WHERE deal_id = NEW.deal_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix trigger for Perplexity Founder enrichment
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
      deal_enrichment_perplexity_founder_export_vc = NEW.raw_perplexity_response,
      source_engines = CASE WHEN 'perplexity_founder' = ANY(source_engines) 
        THEN source_engines
        ELSE array_append(source_engines, 'perplexity_founder') END,
      data_completeness_score = data_completeness_score + 20,
      updated_at = now()
    WHERE deal_id = NEW.deal_id;
    
  ELSIF fund_type_value = 'private_equity' OR fund_type_value = 'pe' THEN
    -- Update PE datapoints with Perplexity Founder data
    UPDATE public.deal_analysis_datapoints_pe 
    SET 
      deal_enrichment_perplexity_founder_export_pe = NEW.raw_perplexity_response,
      source_engines = CASE WHEN 'perplexity_founder' = ANY(source_engines) 
        THEN source_engines
        ELSE array_append(source_engines, 'perplexity_founder') END,
      data_completeness_score = data_completeness_score + 20,
      updated_at = now()
    WHERE deal_id = NEW.deal_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix trigger for Perplexity Market enrichment  
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
      deal_enrichment_perplexity_market_export_vc = NEW.raw_perplexity_response,
      source_engines = CASE WHEN 'perplexity_market' = ANY(source_engines) 
        THEN source_engines
        ELSE array_append(source_engines, 'perplexity_market') END,
      data_completeness_score = data_completeness_score + 15,
      updated_at = now()
    WHERE deal_id = NEW.deal_id;
    
  ELSIF fund_type_value = 'private_equity' OR fund_type_value = 'pe' THEN
    -- Update PE datapoints with Perplexity Market data
    UPDATE public.deal_analysis_datapoints_pe 
    SET 
      deal_enrichment_perplexity_market_export_pe = NEW.raw_perplexity_response,
      source_engines = CASE WHEN 'perplexity_market' = ANY(source_engines) 
        THEN source_engines
        ELSE array_append(source_engines, 'perplexity_market') END,
      data_completeness_score = data_completeness_score + 15,
      updated_at = now()
    WHERE deal_id = NEW.deal_id;
  END IF;
  
  RETURN NEW;
END;
$function$;