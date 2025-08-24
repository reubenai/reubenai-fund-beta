-- Create function to initialize default memo sections for all deals without memos
CREATE OR REPLACE FUNCTION create_default_memo_sections_for_all_deals()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  deal_record RECORD;
  vc_sections JSONB;
  pe_sections JSONB;
  inserted_count INTEGER := 0;
BEGIN
  -- Define default VC memo sections
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

  -- Define default PE memo sections  
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

  -- Loop through all deals without memos
  FOR deal_record IN 
    SELECT d.id, d.fund_id, f.fund_type
    FROM deals d
    JOIN funds f ON d.fund_id = f.id  
    LEFT JOIN ic_memos memo ON d.id = memo.deal_id
    WHERE memo.id IS NULL
  LOOP
    -- Insert default memo based on fund type
    INSERT INTO ic_memos (
      deal_id,
      fund_id,
      status,
      memo_content,
      is_published,
      created_at,
      updated_at
    ) VALUES (
      deal_record.id,
      deal_record.fund_id,
      'draft',
      CASE 
        WHEN deal_record.fund_type = 'private_equity' THEN pe_sections
        ELSE vc_sections
      END,
      false,
      now(),
      now()
    );
    
    inserted_count := inserted_count + 1;
  END LOOP;

  RETURN inserted_count;
END;
$function$;

-- Create trigger function for new deals to auto-create memo sections
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

  -- Create default memo with empty sections
  INSERT INTO ic_memos (
    deal_id,
    fund_id,
    status,
    memo_content,
    is_published,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.fund_id,
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

-- Create trigger for new deals (only if it doesn't exist)
DROP TRIGGER IF EXISTS trigger_auto_create_memo_sections ON deals;
CREATE TRIGGER trigger_auto_create_memo_sections
  AFTER INSERT ON deals
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_memo_sections_for_new_deal();