-- Fix the auto_create_memo_sections_for_new_deal trigger function to include required fields
CREATE OR REPLACE FUNCTION auto_create_memo_sections_for_new_deal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  fund_type_value TEXT;
  vc_sections JSONB;
  pe_sections JSONB;
BEGIN
  -- Get fund type
  SELECT f.fund_type INTO fund_type_value
  FROM funds f
  WHERE f.id = NEW.fund_id;

  -- Define default sections based on fund type
  vc_sections := jsonb_build_object(
    'executive_summary', '',
    'company_overview', '',
    'market_opportunity', '',
    'product_service', '',
    'business_model', '',
    'competitive_landscape', '',
    'management_team', '',
    'financial_analysis', '',
    'investment_terms', '',
    'risks_mitigants', '',
    'exit_strategy', '',
    'investment_recommendation', ''
  );

  pe_sections := jsonb_build_object(
    'executive_summary', '',
    'financial_performance', '',
    'market_position', '',
    'operational_excellence', '',
    'management_leadership', '',
    'growth_value_creation', '',
    'risk_assessment', '',
    'strategic_timing', '',
    'exit_value_realization', '',
    'investment_recommendation', ''
  );

  -- Create default memo with empty sections and required fields
  INSERT INTO ic_memos (
    deal_id,
    fund_id,
    title,
    created_by,
    status,
    memo_content,
    is_published,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.fund_id,
    'IC Memo - ' || COALESCE(NEW.company_name, 'Untitled Deal'),
    COALESCE(auth.uid(), NEW.created_by),
    'draft',
    CASE 
      WHEN fund_type_value = 'private_equity' THEN pe_sections
      ELSE vc_sections
    END,
    false,
    now(),
    now()
  );

  RETURN NEW;
END;
$function$;