-- Create missing deal_analysis_datapoints_vc records for all enriched VC deals
-- First, insert missing records for VC deals that have enrichment data but no datapoints record
INSERT INTO public.deal_analysis_datapoints_vc (
  deal_id,
  fund_id, 
  organization_id,
  source_engines,
  data_completeness_score,
  created_at,
  updated_at
)
SELECT DISTINCT
  d.id as deal_id,
  d.fund_id,
  d.organization_id,
  ARRAY[]::text[] as source_engines,
  0 as data_completeness_score,
  now() as created_at,
  now() as updated_at
FROM deals d
JOIN funds f ON d.fund_id = f.id
WHERE f.fund_type = 'venture_capital'
  AND d.id NOT IN (SELECT deal_id FROM deal_analysis_datapoints_vc)
  AND (
    -- Has Crunchbase data
    d.id IN (SELECT deal_id FROM deal_enrichment_crunchbase_export) OR
    -- Has LinkedIn data  
    d.id IN (SELECT deal_id FROM deal_enrichment_linkedin_export) OR
    -- Has Perplexity Company data
    d.id IN (SELECT deal_id FROM deal_enrichment_perplexity_company_export_vc) OR
    -- Has Perplexity Founder data
    d.id IN (SELECT deal_id FROM deal_enrichment_perplexity_founder_export_vc) OR
    -- Has Perplexity Market data
    d.id IN (SELECT deal_id FROM deal_enrichment_perplexity_market_export_vc)
  );

-- Now sync existing Perplexity Company data
UPDATE public.deal_analysis_datapoints_vc 
SET 
  deal_enrichment_perplexity_company_export_vc = pce.raw_perplexity_response,
  source_engines = CASE 
    WHEN 'perplexity_company' = ANY(source_engines) 
    THEN source_engines
    ELSE array_append(source_engines, 'perplexity_company') 
  END,
  data_completeness_score = data_completeness_score + 15,
  updated_at = now()
FROM deal_enrichment_perplexity_company_export_vc pce
WHERE deal_analysis_datapoints_vc.deal_id = pce.deal_id
  AND pce.raw_perplexity_response IS NOT NULL;

-- Sync existing Perplexity Founder data  
UPDATE public.deal_analysis_datapoints_vc
SET 
  deal_enrichment_perplexity_founder_export_vc = pfe.raw_perplexity_response,
  source_engines = CASE 
    WHEN 'perplexity_founder' = ANY(source_engines) 
    THEN source_engines
    ELSE array_append(source_engines, 'perplexity_founder') 
  END,
  data_completeness_score = data_completeness_score + 15,
  updated_at = now()
FROM deal_enrichment_perplexity_founder_export_vc pfe
WHERE deal_analysis_datapoints_vc.deal_id = pfe.deal_id
  AND pfe.raw_perplexity_response IS NOT NULL;

-- Sync existing Perplexity Market data
UPDATE public.deal_analysis_datapoints_vc
SET 
  deal_enrichment_perplexity_market_export_vc = pme.raw_perplexity_response,
  source_engines = CASE 
    WHEN 'perplexity_market' = ANY(source_engines) 
    THEN source_engines
    ELSE array_append(source_engines, 'perplexity_market') 
  END,
  data_completeness_score = data_completeness_score + 15,
  updated_at = now()
FROM deal_enrichment_perplexity_market_export_vc pme
WHERE deal_analysis_datapoints_vc.deal_id = pme.deal_id
  AND pme.raw_perplexity_response IS NOT NULL;

-- Sync existing Crunchbase data
UPDATE public.deal_analysis_datapoints_vc
SET 
  deal_enrichment_crunchbase_export = cbe.data_retrieved,
  source_engines = CASE 
    WHEN 'crunchbase' = ANY(source_engines) 
    THEN source_engines
    ELSE array_append(source_engines, 'crunchbase') 
  END,
  data_completeness_score = data_completeness_score + 20,
  updated_at = now()
FROM deal_enrichment_crunchbase_export cbe
WHERE deal_analysis_datapoints_vc.deal_id = cbe.deal_id
  AND cbe.data_retrieved IS NOT NULL;

-- Sync existing LinkedIn data
UPDATE public.deal_analysis_datapoints_vc
SET 
  deal_enrichment_linkedin_export = le.data_retrieved,
  source_engines = CASE 
    WHEN 'linkedin' = ANY(source_engines) 
    THEN source_engines
    ELSE array_append(source_engines, 'linkedin') 
  END,
  data_completeness_score = data_completeness_score + 10,
  updated_at = now()
FROM deal_enrichment_linkedin_export le
WHERE deal_analysis_datapoints_vc.deal_id = le.deal_id
  AND le.data_retrieved IS NOT NULL;

-- Create missing triggers that were supposed to be there
-- Trigger for Perplexity Company updates
DROP TRIGGER IF EXISTS trigger_perplexity_company_datapoint_update ON deal_enrichment_perplexity_company_export_vc;
CREATE TRIGGER trigger_perplexity_company_datapoint_update
  AFTER INSERT OR UPDATE ON deal_enrichment_perplexity_company_export_vc
  FOR EACH ROW
  EXECUTE FUNCTION trigger_perplexity_company_datapoint_update();

-- Trigger for Perplexity Founder updates  
DROP TRIGGER IF EXISTS trigger_perplexity_founder_datapoint_update ON deal_enrichment_perplexity_founder_export_vc;
CREATE TRIGGER trigger_perplexity_founder_datapoint_update
  AFTER INSERT OR UPDATE ON deal_enrichment_perplexity_founder_export_vc
  FOR EACH ROW
  EXECUTE FUNCTION trigger_perplexity_founder_datapoint_update();

-- Create the missing trigger functions
CREATE OR REPLACE FUNCTION public.trigger_perplexity_company_datapoint_update()
RETURNS TRIGGER AS $$
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
      data_completeness_score = data_completeness_score + 15,
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
      data_completeness_score = data_completeness_score + 15,
      updated_at = now()
    WHERE deal_id = NEW.deal_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.trigger_perplexity_founder_datapoint_update()
RETURNS TRIGGER AS $$
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
      data_completeness_score = data_completeness_score + 15,
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
      data_completeness_score = data_completeness_score + 15,
      updated_at = now()
    WHERE deal_id = NEW.deal_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;