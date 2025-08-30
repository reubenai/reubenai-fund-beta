-- Create function to check if value is missing/invalid
CREATE OR REPLACE FUNCTION is_missing_value(value anyelement)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF value IS NULL THEN
    RETURN true;
  END IF;
  
  IF pg_typeof(value) = 'text'::regtype THEN
    DECLARE
      text_value text := value::text;
    BEGIN
      RETURN TRIM(LOWER(text_value)) IN ('', 'not found', 'not listed');
    END;
  END IF;
  
  RETURN false;
END;
$$;

-- Create function to get nested JSON value
CREATE OR REPLACE FUNCTION get_nested_json_value(obj jsonb, path text)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  keys text[];
  result jsonb := obj;
  key text;
BEGIN
  IF obj IS NULL OR path IS NULL THEN
    RETURN NULL;
  END IF;
  
  keys := string_to_array(path, '.');
  
  FOREACH key IN ARRAY keys
  LOOP
    IF result ? key THEN
      result := result -> key;
    ELSE
      RETURN NULL;
    END IF;
  END LOOP;
  
  RETURN result;
END;
$$;

-- Create waterfall extraction function
CREATE OR REPLACE FUNCTION extract_waterfall_datapoints(target_deal_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  linkedin_data record;
  crunchbase_data record;
  perplexity_company_data record;
  vc_datapoints_data record;
  documents_data record;
  
  extracted_employee_count integer;
  extracted_founding_year integer;
  extracted_competitors text;
  extracted_business_model text;
  
  employee_source text;
  founding_source text;
  competitors_source text;
  business_model_source text;
BEGIN
  -- Get all enrichment data for the deal
  SELECT * INTO linkedin_data 
  FROM deal_enrichment_linkedin_export 
  WHERE deal_id = target_deal_id 
  ORDER BY updated_at DESC 
  LIMIT 1;
  
  SELECT * INTO crunchbase_data 
  FROM deal_enrichment_crunchbase_export 
  WHERE deal_id = target_deal_id 
  ORDER BY updated_at DESC 
  LIMIT 1;
  
  SELECT * INTO perplexity_company_data 
  FROM deal_enrichment_perplexity_company_export_vc 
  WHERE deal_id = target_deal_id 
  ORDER BY updated_at DESC 
  LIMIT 1;
  
  SELECT * INTO vc_datapoints_data 
  FROM deal_analysis_datapoints_vc 
  WHERE deal_id = target_deal_id 
  ORDER BY updated_at DESC 
  LIMIT 1;
  
  SELECT * INTO documents_data 
  FROM deal_documents 
  WHERE deal_id = target_deal_id 
    AND data_points_vc IS NOT NULL 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  -- Extract Employee Count (Waterfall Priority)
  extracted_employee_count := NULL;
  employee_source := 'fallback';
  
  -- Priority 1: LinkedIn Export - employees_in_linkedin
  IF linkedin_data.id IS NOT NULL AND NOT is_missing_value(linkedin_data.employees_in_linkedin) THEN
    extracted_employee_count := linkedin_data.employees_in_linkedin;
    employee_source := 'LinkedIn Export';
  END IF;
  
  -- Priority 2: Crunchbase Export - num_employees
  IF extracted_employee_count IS NULL AND crunchbase_data.id IS NOT NULL AND NOT is_missing_value(crunchbase_data.num_employees) THEN
    DECLARE
      cb_employees text := crunchbase_data.num_employees;
      match_result text;
    BEGIN
      -- Handle string format like "11-50"
      SELECT regexp_replace(cb_employees, '^(\d+).*', '\1') INTO match_result;
      IF match_result ~ '^\d+$' THEN
        extracted_employee_count := match_result::integer;
        employee_source := 'Crunchbase';
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Continue to next priority
    END;
  END IF;
  
  -- Priority 3: VC Datapoints JSON columns
  IF extracted_employee_count IS NULL AND vc_datapoints_data.id IS NOT NULL THEN
    DECLARE
      linkedin_stored jsonb;
      crunchbase_stored jsonb;
    BEGIN
      linkedin_stored := get_nested_json_value(vc_datapoints_data.deal_enrichment_linkedin_export, 'employees_in_linkedin');
      IF linkedin_stored IS NOT NULL AND NOT is_missing_value(linkedin_stored::text) THEN
        extracted_employee_count := linkedin_stored::text::integer;
        employee_source := 'LinkedIn Export (Stored)';
      ELSE
        crunchbase_stored := get_nested_json_value(vc_datapoints_data.deal_enrichment_crunchbase_export, 'num_employees');
        IF crunchbase_stored IS NOT NULL AND NOT is_missing_value(crunchbase_stored::text) THEN
          extracted_employee_count := crunchbase_stored::text::integer;
          employee_source := 'Crunchbase (Stored)';
        END IF;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Continue
    END;
  END IF;
  
  -- Extract Founding Year (Waterfall Priority)
  extracted_founding_year := NULL;
  founding_source := 'fallback';
  
  -- Priority 1: LinkedIn Export - founded or founding_year
  IF linkedin_data.id IS NOT NULL AND NOT is_missing_value(linkedin_data.founded) THEN
    extracted_founding_year := linkedin_data.founded;
    founding_source := 'LinkedIn Export';
  ELSIF linkedin_data.id IS NOT NULL AND NOT is_missing_value(linkedin_data.founding_year) THEN
    extracted_founding_year := linkedin_data.founding_year;
    founding_source := 'LinkedIn Export';
  END IF;
  
  -- Priority 2: Crunchbase Export - founded_date (extract year)
  IF extracted_founding_year IS NULL AND crunchbase_data.id IS NOT NULL AND NOT is_missing_value(crunchbase_data.founded_date) THEN
    BEGIN
      extracted_founding_year := EXTRACT(YEAR FROM crunchbase_data.founded_date::date);
      founding_source := 'Crunchbase';
    EXCEPTION WHEN OTHERS THEN
      -- Continue
    END;
  END IF;
  
  -- Extract Competitors (Waterfall Priority)
  extracted_competitors := NULL;
  competitors_source := 'fallback';
  
  -- Priority 1: LinkedIn Export - similar_companies
  IF linkedin_data.id IS NOT NULL AND linkedin_data.similar_companies IS NOT NULL THEN
    DECLARE
      similar_companies jsonb := linkedin_data.similar_companies;
    BEGIN
      IF jsonb_typeof(similar_companies) = 'array' THEN
        SELECT string_agg(value::text, ', ') INTO extracted_competitors
        FROM jsonb_array_elements_text(similar_companies);
      ELSE
        extracted_competitors := similar_companies::text;
      END IF;
      competitors_source := 'LinkedIn Export';
    EXCEPTION WHEN OTHERS THEN
      -- Continue to next priority
    END;
  END IF;
  
  -- Priority 2: Perplexity Company Export - key_market_players
  IF extracted_competitors IS NULL AND perplexity_company_data.id IS NOT NULL AND perplexity_company_data.raw_perplexity_response ? 'key_market_players' AND NOT is_missing_value(perplexity_company_data.raw_perplexity_response->>'key_market_players') THEN
    DECLARE
      key_players jsonb := perplexity_company_data.raw_perplexity_response->'key_market_players';
    BEGIN
      IF jsonb_typeof(key_players) = 'array' THEN
        SELECT string_agg(value::text, ', ') INTO extracted_competitors
        FROM jsonb_array_elements_text(key_players);
      ELSE
        extracted_competitors := key_players::text;
      END IF;
      competitors_source := 'Perplexity Research';
    EXCEPTION WHEN OTHERS THEN
      -- Continue
    END;
  END IF;
  
  -- Extract Business Model (Waterfall Priority)
  extracted_business_model := NULL;
  business_model_source := 'fallback';
  
  -- Priority 1: Documents - business_model
  IF documents_data.id IS NOT NULL AND NOT is_missing_value(documents_data.data_points_vc->>'business_model') THEN
    extracted_business_model := documents_data.data_points_vc->>'business_model';
    business_model_source := 'Documents';
  END IF;
  
  -- Priority 2: Perplexity sources
  IF extracted_business_model IS NULL AND perplexity_company_data.id IS NOT NULL AND perplexity_company_data.raw_perplexity_response ? 'business_model' AND NOT is_missing_value(perplexity_company_data.raw_perplexity_response->>'business_model') THEN
    extracted_business_model := perplexity_company_data.raw_perplexity_response->>'business_model';
    business_model_source := 'Perplexity Research';
  END IF;
  
  -- Update or insert into deal_analysis_datapoints_vc
  INSERT INTO deal_analysis_datapoints_vc (
    deal_id,
    fund_id,
    organization_id,
    employee_count,
    founding_year,
    competitors,
    business_model,
    source_engines,
    data_completeness_score,
    created_at,
    updated_at
  )
  SELECT 
    target_deal_id,
    d.fund_id,
    f.organization_id,
    extracted_employee_count,
    extracted_founding_year,
    CASE WHEN extracted_competitors IS NOT NULL THEN ARRAY[extracted_competitors] ELSE NULL END,
    extracted_business_model,
    ARRAY[employee_source, founding_source, competitors_source, business_model_source],
    CASE 
      WHEN extracted_employee_count IS NOT NULL THEN 25 ELSE 0 
    END +
    CASE 
      WHEN extracted_founding_year IS NOT NULL THEN 25 ELSE 0 
    END +
    CASE 
      WHEN extracted_competitors IS NOT NULL THEN 25 ELSE 0 
    END +
    CASE 
      WHEN extracted_business_model IS NOT NULL THEN 25 ELSE 0 
    END,
    now(),
    now()
  FROM deals d
  JOIN funds f ON d.fund_id = f.id
  WHERE d.id = target_deal_id
  ON CONFLICT (deal_id) DO UPDATE SET
    employee_count = COALESCE(EXCLUDED.employee_count, deal_analysis_datapoints_vc.employee_count),
    founding_year = COALESCE(EXCLUDED.founding_year, deal_analysis_datapoints_vc.founding_year),
    competitors = COALESCE(EXCLUDED.competitors, deal_analysis_datapoints_vc.competitors),
    business_model = COALESCE(EXCLUDED.business_model, deal_analysis_datapoints_vc.business_model),
    source_engines = EXCLUDED.source_engines,
    data_completeness_score = EXCLUDED.data_completeness_score,
    updated_at = now();
    
END;
$$;

-- Create trigger function for enrichment tables
CREATE OR REPLACE FUNCTION trigger_waterfall_extraction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Call waterfall extraction for the deal
  PERFORM extract_waterfall_datapoints(NEW.deal_id);
  RETURN NEW;
END;
$$;

-- Create triggers on all enrichment export tables
CREATE OR REPLACE TRIGGER waterfall_extraction_crunchbase
  AFTER INSERT OR UPDATE ON deal_enrichment_crunchbase_export
  FOR EACH ROW
  EXECUTE FUNCTION trigger_waterfall_extraction();

CREATE OR REPLACE TRIGGER waterfall_extraction_linkedin
  AFTER INSERT OR UPDATE ON deal_enrichment_linkedin_export
  FOR EACH ROW
  EXECUTE FUNCTION trigger_waterfall_extraction();

CREATE OR REPLACE TRIGGER waterfall_extraction_linkedin_profile
  AFTER INSERT OR UPDATE ON deal_enrichment_linkedin_profile_export
  FOR EACH ROW
  EXECUTE FUNCTION trigger_waterfall_extraction();

CREATE OR REPLACE TRIGGER waterfall_extraction_perplexity_company
  AFTER INSERT OR UPDATE ON deal_enrichment_perplexity_company_export_vc
  FOR EACH ROW
  EXECUTE FUNCTION trigger_waterfall_extraction();

CREATE OR REPLACE TRIGGER waterfall_extraction_perplexity_founder
  AFTER INSERT OR UPDATE ON deal_enrichment_perplexity_founder_export_vc
  FOR EACH ROW
  EXECUTE FUNCTION trigger_waterfall_extraction();

CREATE OR REPLACE TRIGGER waterfall_extraction_perplexity_market
  AFTER INSERT OR UPDATE ON deal_enrichment_perplexity_market_export_vc
  FOR EACH ROW
  EXECUTE FUNCTION trigger_waterfall_extraction();

-- Create trigger function for datapoints JSON updates
CREATE OR REPLACE FUNCTION trigger_waterfall_extraction_datapoints()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if any of the JSON enrichment columns were updated
  IF (OLD.data_points_vc IS DISTINCT FROM NEW.data_points_vc) OR
     (OLD.deal_enrichment_crunchbase_export IS DISTINCT FROM NEW.deal_enrichment_crunchbase_export) OR
     (OLD.deal_enrichment_linkedin_export IS DISTINCT FROM NEW.deal_enrichment_linkedin_export) OR
     (OLD.deal_enrichment_linkedin_profile_export IS DISTINCT FROM NEW.deal_enrichment_linkedin_profile_export) OR
     (OLD.deal_enrichment_perplexity_company_export_vc IS DISTINCT FROM NEW.deal_enrichment_perplexity_company_export_vc) OR
     (OLD.deal_enrichment_perplexity_founder_export_vc IS DISTINCT FROM NEW.deal_enrichment_perplexity_founder_export_vc) OR
     (OLD.deal_enrichment_perplexity_market_export_vc IS DISTINCT FROM NEW.deal_enrichment_perplexity_market_export_vc) THEN
    
    -- Call waterfall extraction for the deal
    PERFORM extract_waterfall_datapoints(NEW.deal_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on deal_analysis_datapoints_vc for JSON column updates
CREATE OR REPLACE TRIGGER waterfall_extraction_datapoints_json
  AFTER UPDATE ON deal_analysis_datapoints_vc
  FOR EACH ROW
  EXECUTE FUNCTION trigger_waterfall_extraction_datapoints();

-- Create function to backfill existing data
CREATE OR REPLACE FUNCTION backfill_waterfall_extractions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deal_record record;
  processed_count integer := 0;
BEGIN
  -- Process all deals that have enrichment data but missing extracted fields
  FOR deal_record IN
    SELECT DISTINCT d.id as deal_id
    FROM deals d
    WHERE EXISTS (
      SELECT 1 FROM deal_enrichment_linkedin_export le WHERE le.deal_id = d.id
      UNION
      SELECT 1 FROM deal_enrichment_crunchbase_export ce WHERE ce.deal_id = d.id
      UNION
      SELECT 1 FROM deal_enrichment_perplexity_company_export_vc pe WHERE pe.deal_id = d.id
    )
  LOOP
    -- Extract waterfall datapoints for this deal
    PERFORM extract_waterfall_datapoints(deal_record.deal_id);
    processed_count := processed_count + 1;
  END LOOP;
  
  RETURN processed_count;
END;
$$;

-- Run backfill for existing data
SELECT backfill_waterfall_extractions();