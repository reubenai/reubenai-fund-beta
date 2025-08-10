-- Phase 7.3: Deal Analysis Pre-Check Functions
-- Function to validate deal data completeness before analysis
CREATE OR REPLACE FUNCTION public.validate_deal_for_analysis(deal_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  deal_record RECORD;
  validation_result jsonb := '{}';
  issues text[] := '{}';
  warnings text[] := '{}';
  score integer := 100;
  completeness_score integer := 100;
BEGIN
  -- Get deal data
  SELECT * INTO deal_record FROM deals WHERE id = deal_id_param;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'score', 0,
      'issues', ARRAY['Deal not found'],
      'warnings', ARRAY[]::text[],
      'completeness_score', 0,
      'validation_details', '{}'::jsonb
    );
  END IF;
  
  -- Check required fields
  IF deal_record.company_name IS NULL OR trim(deal_record.company_name) = '' THEN
    issues := array_append(issues, 'Company name is required');
    score := score - 25;
    completeness_score := completeness_score - 15;
  END IF;
  
  IF deal_record.industry IS NULL OR trim(deal_record.industry) = '' THEN
    issues := array_append(issues, 'Industry is required for accurate analysis');
    score := score - 20;
    completeness_score := completeness_score - 10;
  END IF;
  
  -- Check important optional fields
  IF deal_record.website IS NULL OR trim(deal_record.website) = '' THEN
    warnings := array_append(warnings, 'No website provided - limits market research capabilities');
    score := score - 10;
    completeness_score := completeness_score - 5;
  END IF;
  
  IF deal_record.description IS NULL OR length(trim(deal_record.description)) < 50 THEN
    warnings := array_append(warnings, 'Company description is very brief - may limit analysis quality');
    score := score - 10;
    completeness_score := completeness_score - 5;
  END IF;
  
  IF deal_record.founder IS NULL OR trim(deal_record.founder) = '' THEN
    warnings := array_append(warnings, 'No founder information - limits team analysis');
    score := score - 8;
    completeness_score := completeness_score - 5;
  END IF;
  
  IF deal_record.deal_size IS NULL THEN
    warnings := array_append(warnings, 'No deal size specified - limits financial analysis');
    score := score - 8;
    completeness_score := completeness_score - 5;
  END IF;
  
  IF deal_record.valuation IS NULL THEN
    warnings := array_append(warnings, 'No valuation specified - limits financial analysis');
    score := score - 8;
    completeness_score := completeness_score - 5;
  END IF;
  
  -- Check for supporting documents
  IF NOT EXISTS (SELECT 1 FROM deal_documents WHERE deal_id = deal_id_param) THEN
    warnings := array_append(warnings, 'No supporting documents uploaded - analysis will rely on external data only');
    score := score - 15;
    completeness_score := completeness_score - 10;
  END IF;
  
  -- Check analysis readiness
  IF deal_record.analysis_queue_status = 'processing' THEN
    issues := array_append(issues, 'Deal is currently being analyzed - wait for completion');
    score := score - 50;
  END IF;
  
  -- Build validation result
  validation_result := jsonb_build_object(
    'valid', array_length(issues, 1) IS NULL,
    'score', GREATEST(0, score),
    'issues', issues,
    'warnings', warnings,
    'completeness_score', GREATEST(0, completeness_score),
    'validation_details', jsonb_build_object(
      'has_company_name', deal_record.company_name IS NOT NULL AND trim(deal_record.company_name) != '',
      'has_industry', deal_record.industry IS NOT NULL AND trim(deal_record.industry) != '',
      'has_website', deal_record.website IS NOT NULL AND trim(deal_record.website) != '',
      'has_description', deal_record.description IS NOT NULL AND length(trim(deal_record.description)) >= 50,
      'has_founder', deal_record.founder IS NOT NULL AND trim(deal_record.founder) != '',
      'has_deal_size', deal_record.deal_size IS NOT NULL,
      'has_valuation', deal_record.valuation IS NOT NULL,
      'has_documents', EXISTS (SELECT 1 FROM deal_documents WHERE deal_id = deal_id_param),
      'analysis_status', deal_record.analysis_queue_status,
      'last_analysis', deal_record.last_analysis_trigger
    ),
    'checked_at', now()
  );
  
  RETURN validation_result;
END;
$function$;

-- Function to get analysis readiness for multiple deals
CREATE OR REPLACE FUNCTION public.get_deals_analysis_readiness(fund_id_param uuid)
RETURNS TABLE(
  deal_id uuid,
  company_name text,
  validation_score integer,
  is_ready boolean,
  issue_count integer,
  warning_count integer,
  completeness_score integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH deal_validations AS (
    SELECT 
      d.id,
      d.company_name,
      public.validate_deal_for_analysis(d.id) as validation_data
    FROM deals d
    WHERE d.fund_id = fund_id_param
    AND d.status NOT IN ('rejected', 'invested')
  )
  SELECT 
    dv.id as deal_id,
    dv.company_name,
    (dv.validation_data->>'score')::integer as validation_score,
    (dv.validation_data->>'valid')::boolean as is_ready,
    array_length(ARRAY(SELECT jsonb_array_elements_text(dv.validation_data->'issues')), 1) as issue_count,
    array_length(ARRAY(SELECT jsonb_array_elements_text(dv.validation_data->'warnings')), 1) as warning_count,
    (dv.validation_data->>'completeness_score')::integer as completeness_score
  FROM deal_validations dv
  ORDER BY validation_score DESC, dv.company_name;
END;
$function$;

-- Function to validate fund strategy before analysis
CREATE OR REPLACE FUNCTION public.validate_fund_strategy_for_analysis(fund_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  strategy_record RECORD;
  fund_record RECORD;
  validation_result jsonb := '{}';
  issues text[] := '{}';
  warnings text[] := '{}';
  score integer := 100;
BEGIN
  -- Get fund and strategy data
  SELECT * INTO fund_record FROM funds WHERE id = fund_id_param;
  SELECT * INTO strategy_record FROM investment_strategies WHERE fund_id = fund_id_param;
  
  IF fund_record IS NULL THEN
    RETURN jsonb_build_object(
      'valid', false,
      'score', 0,
      'issues', ARRAY['Fund not found'],
      'warnings', ARRAY[]::text[]
    );
  END IF;
  
  IF strategy_record IS NULL THEN
    issues := array_append(issues, 'No investment strategy configured - analysis will use default criteria');
    score := score - 40;
  ELSE
    -- Check strategy completeness
    IF strategy_record.enhanced_criteria IS NULL OR strategy_record.enhanced_criteria = '{}'::jsonb THEN
      warnings := array_append(warnings, 'Investment criteria not fully configured');
      score := score - 15;
    END IF;
    
    IF strategy_record.exciting_threshold IS NULL THEN
      warnings := array_append(warnings, 'No exciting threshold set - using default (85)');
      score := score - 5;
    END IF;
    
    IF strategy_record.promising_threshold IS NULL THEN
      warnings := array_append(warnings, 'No promising threshold set - using default (70)');
      score := score - 5;
    END IF;
    
    IF strategy_record.needs_development_threshold IS NULL THEN
      warnings := array_append(warnings, 'No needs development threshold set - using default (50)');
      score := score - 5;
    END IF;
    
    IF array_length(strategy_record.industries, 1) IS NULL THEN
      warnings := array_append(warnings, 'No target industries specified');
      score := score - 10;
    END IF;
    
    IF array_length(strategy_record.geography, 1) IS NULL THEN
      warnings := array_append(warnings, 'No target geography specified');
      score := score - 10;
    END IF;
  END IF;
  
  -- Build validation result
  validation_result := jsonb_build_object(
    'valid', array_length(issues, 1) IS NULL,
    'score', GREATEST(0, score),
    'issues', issues,
    'warnings', warnings,
    'strategy_configured', strategy_record IS NOT NULL,
    'fund_details', jsonb_build_object(
      'name', fund_record.name,
      'type', fund_record.fund_type,
      'has_strategy', strategy_record IS NOT NULL
    ),
    'checked_at', now()
  );
  
  RETURN validation_result;
END;
$function$;