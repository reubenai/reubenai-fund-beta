-- Function to create default investment strategy for a fund
CREATE OR REPLACE FUNCTION create_default_investment_strategy(fund_id_param uuid, fund_type_param fund_type)
RETURNS uuid AS $$
DECLARE
  strategy_id uuid;
  default_criteria jsonb;
BEGIN
  -- Define default enhanced criteria based on fund type
  IF fund_type_param = 'vc' THEN
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
  ELSE -- PE fund
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

  -- Insert default investment strategy
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
    fund_type_param::text,
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

  RETURN strategy_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to be called by trigger
CREATE OR REPLACE FUNCTION handle_new_fund()
RETURNS trigger AS $$
BEGIN
  -- Create default investment strategy for the new fund
  PERFORM create_default_investment_strategy(NEW.id, NEW.fund_type);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create strategy when fund is inserted
CREATE TRIGGER create_fund_default_strategy
  AFTER INSERT ON public.funds
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_fund();

-- Backfill existing funds that don't have strategies
DO $$
DECLARE
  fund_record RECORD;
BEGIN
  FOR fund_record IN 
    SELECT f.id, f.fund_type 
    FROM public.funds f
    LEFT JOIN public.investment_strategies s ON f.id = s.fund_id
    WHERE s.id IS NULL
  LOOP
    PERFORM create_default_investment_strategy(fund_record.id, fund_record.fund_type);
    RAISE NOTICE 'Created default strategy for fund %', fund_record.id;
  END LOOP;
END;
$$;