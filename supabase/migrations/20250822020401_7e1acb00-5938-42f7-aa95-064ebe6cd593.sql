-- Phase 1: Update fund creation to create default strategies in BOTH legacy and V2 tables

CREATE OR REPLACE FUNCTION public.create_default_investment_strategy(fund_id_param uuid, fund_type_param fund_type)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  strategy_id uuid;
  strategy_v2_id uuid;
  default_criteria jsonb;
  fund_name_value text;
  org_id_value uuid;
  fund_type_v2 text;
BEGIN
  -- Get fund details for V2 strategy
  SELECT name, organization_id INTO fund_name_value, org_id_value
  FROM public.funds 
  WHERE id = fund_id_param;
  
  IF fund_name_value IS NULL THEN
    RAISE EXCEPTION 'Fund not found: %', fund_id_param;
  END IF;
  
  -- Convert fund type for V2 table
  fund_type_v2 := CASE 
    WHEN fund_type_param = 'venture_capital' THEN 'venture_capital'
    WHEN fund_type_param = 'private_equity' THEN 'private_equity' 
    ELSE 'venture_capital' -- Default fallback
  END;
  
  -- Define default enhanced criteria based on fund type
  IF fund_type_param = 'venture_capital' THEN
    default_criteria := '{
      "categories": [
        {
          "name": "Market Opportunity",
          "weight": 25,
          "enabled": true,
          "subcategories": [
            {"name": "Market Size", "weight": 30, "enabled": true},
            {"name": "Growth Rate", "weight": 25, "enabled": true},
            {"name": "Market Dynamics", "weight": 25, "enabled": true},
            {"name": "Competitive Landscape", "weight": 20, "enabled": true}
          ]
        },
        {
          "name": "Product & Technology",
          "weight": 25,
          "enabled": true,
          "subcategories": [
            {"name": "Product Innovation", "weight": 30, "enabled": true},
            {"name": "Technology Advantage", "weight": 25, "enabled": true},
            {"name": "IP & Patents", "weight": 20, "enabled": true},
            {"name": "Development Stage", "weight": 25, "enabled": true}
          ]
        },
        {
          "name": "Team & Leadership",
          "weight": 25,
          "enabled": true,
          "subcategories": [
            {"name": "Founder Quality", "weight": 35, "enabled": true},
            {"name": "Team Experience", "weight": 25, "enabled": true},
            {"name": "Advisory Board", "weight": 20, "enabled": true},
            {"name": "Cultural Fit", "weight": 20, "enabled": true}
          ]
        },
        {
          "name": "Financial & Traction",
          "weight": 25,
          "enabled": true,
          "subcategories": [
            {"name": "Revenue Growth", "weight": 30, "enabled": true},
            {"name": "Unit Economics", "weight": 25, "enabled": true},
            {"name": "Customer Acquisition", "weight": 25, "enabled": true},
            {"name": "Financial Projections", "weight": 20, "enabled": true}
          ]
        }
      ]
    }';
  ELSE -- PE fund (private_equity)
    default_criteria := '{
      "categories": [
        {
          "name": "Financial Performance",
          "weight": 25,
          "enabled": true,
          "subcategories": [
            {"name": "Revenue Growth", "weight": 30, "enabled": true},
            {"name": "Profitability", "weight": 25, "enabled": true},
            {"name": "Cash Flow", "weight": 25, "enabled": true},
            {"name": "Financial Stability", "weight": 20, "enabled": true}
          ]
        },
        {
          "name": "Market Position",
          "weight": 25,
          "enabled": true,
          "subcategories": [
            {"name": "Market Share", "weight": 30, "enabled": true},
            {"name": "Competitive Advantage", "weight": 25, "enabled": true},
            {"name": "Brand Strength", "weight": 25, "enabled": true},
            {"name": "Customer Base", "weight": 20, "enabled": true}
          ]
        },
        {
          "name": "Operational Excellence",
          "weight": 25,
          "enabled": true,
          "subcategories": [
            {"name": "Management Team", "weight": 30, "enabled": true},
            {"name": "Operational Efficiency", "weight": 25, "enabled": true},
            {"name": "Process Quality", "weight": 25, "enabled": true},
            {"name": "Technology Systems", "weight": 20, "enabled": true}
          ]
        },
        {
          "name": "Growth Potential",
          "weight": 25,
          "enabled": true,
          "subcategories": [
            {"name": "Market Expansion", "weight": 30, "enabled": true},
            {"name": "Product Development", "weight": 25, "enabled": true},
            {"name": "Value Creation", "weight": 25, "enabled": true},
            {"name": "Exit Strategy", "weight": 20, "enabled": true}
          ]
        }
      ]
    }';
  END IF;

  -- Insert default LEGACY investment strategy (existing logic)
  INSERT INTO public.investment_strategies (
    fund_id,
    fund_type,
    industries,
    geography,
    key_signals,
    exciting_threshold,
    promising_threshold,
    needs_development_threshold,
    strategy_notes,
    enhanced_criteria
  ) VALUES (
    fund_id_param,
    CASE 
      WHEN fund_type_param = 'venture_capital' THEN 'vc'
      WHEN fund_type_param = 'private_equity' THEN 'pe'
      ELSE 'vc'
    END,
    ARRAY['Technology', 'Healthcare', 'Financial Services'],
    ARRAY['North America', 'Europe'],
    ARRAY['Strong team', 'Large market', 'Proven traction'],
    85,
    70,
    50,
    'Default investment strategy - please customize based on your fund''s focus',
    default_criteria
  )
  RETURNING id INTO strategy_id;

  -- Insert default V2 investment strategy (NEW LOGIC)
  INSERT INTO public.investment_strategies_v2 (
    fund_id,
    fund_name,
    organization_id,
    fund_type,
    strategy_description,
    sectors,
    stages,
    geographies,
    check_size_min,
    check_size_max,
    key_signals,
    investment_philosophy,
    philosophy_config,
    research_approach,
    deal_sourcing_strategy,
    decision_making_process,
    team_leadership_config,
    market_opportunity_config,
    product_technology_config,
    business_traction_config,
    financial_health_config,
    strategic_fit_config,
    exciting_threshold,
    promising_threshold,
    needs_development_threshold,
    enhanced_criteria
  ) VALUES (
    fund_id_param,
    fund_name_value,
    org_id_value,
    fund_type_v2,
    'Default investment strategy - please customize based on your fund''s focus',
    ARRAY['Technology', 'Healthcare', 'Financial Services'], -- sectors
    CASE 
      WHEN fund_type_param = 'venture_capital' THEN ARRAY['Seed', 'Series A', 'Series B']
      ELSE ARRAY['Growth Equity', 'Buyout', 'Expansion']
    END, -- stages
    ARRAY['North America', 'Europe'], -- geographies
    CASE 
      WHEN fund_type_param = 'venture_capital' THEN 500000
      ELSE 5000000
    END, -- check_size_min
    CASE 
      WHEN fund_type_param = 'venture_capital' THEN 5000000
      ELSE 50000000
    END, -- check_size_max
    ARRAY['Strong team', 'Large market', 'Proven traction'], -- key_signals
    'Focus on high-growth opportunities with strong fundamentals', -- investment_philosophy
    '{"approach": "data_driven", "risk_tolerance": "moderate"}', -- philosophy_config
    '{"sources": ["industry_reports", "expert_networks"], "depth": "comprehensive"}', -- research_approach
    '{"channels": ["network", "inbound", "proactive"], "focus": "quality_over_quantity"}', -- deal_sourcing_strategy
    '{"stages": ["screening", "due_diligence", "investment_committee"], "timeline": "6-8_weeks"}', -- decision_making_process
    '{"weight": 20, "subcategories": {}, "positiveSignals": [], "negativeSignals": []}', -- team_leadership_config
    '{"weight": 25, "subcategories": {}, "positiveSignals": [], "negativeSignals": []}', -- market_opportunity_config
    '{"weight": 20, "subcategories": {}, "positiveSignals": [], "negativeSignals": []}', -- product_technology_config
    '{"weight": 15, "subcategories": {}, "positiveSignals": [], "negativeSignals": []}', -- business_traction_config
    '{"weight": 10, "subcategories": {}, "positiveSignals": [], "negativeSignals": []}', -- financial_health_config
    '{"weight": 10, "subcategories": {}, "positiveSignals": [], "negativeSignals": []}', -- strategic_fit_config
    85, -- exciting_threshold
    70, -- promising_threshold
    50, -- needs_development_threshold
    default_criteria -- enhanced_criteria (same as legacy)
  )
  RETURNING id INTO strategy_v2_id;

  RAISE NOTICE 'Created default strategies - Legacy ID: %, V2 ID: %', strategy_id, strategy_v2_id;

  RETURN strategy_id; -- Return legacy ID for backward compatibility
END;
$function$;