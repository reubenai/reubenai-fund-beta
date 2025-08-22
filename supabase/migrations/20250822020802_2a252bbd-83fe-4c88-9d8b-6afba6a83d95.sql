-- Fix fund_type constraint to allow full names
ALTER TABLE public.investment_strategies_v2 
DROP CONSTRAINT investment_strategies_v2_fund_type_check;

ALTER TABLE public.investment_strategies_v2
ADD CONSTRAINT investment_strategies_v2_fund_type_check 
CHECK (fund_type = ANY (ARRAY['vc'::text, 'pe'::text, 'venture_capital'::text, 'private_equity'::text]));

-- Now retry the migration for existing funds
DO $$ 
DECLARE
    fund_record RECORD;
    strategy_count INTEGER;
    vc_criteria JSONB;
    pe_criteria JSONB;
BEGIN
    -- Define JSON criteria as JSONB variables
    vc_criteria := '{"categories": [{"name": "Market Opportunity", "weight": 25, "enabled": true, "subcategories": [{"name": "Market Size", "weight": 30, "enabled": true}, {"name": "Growth Rate", "weight": 25, "enabled": true}, {"name": "Market Dynamics", "weight": 25, "enabled": true}, {"name": "Competitive Landscape", "weight": 20, "enabled": true}]}, {"name": "Product & Technology", "weight": 25, "enabled": true, "subcategories": [{"name": "Product Innovation", "weight": 30, "enabled": true}, {"name": "Technology Advantage", "weight": 25, "enabled": true}, {"name": "IP & Patents", "weight": 20, "enabled": true}, {"name": "Development Stage", "weight": 25, "enabled": true}]}, {"name": "Team & Leadership", "weight": 25, "enabled": true, "subcategories": [{"name": "Founder Quality", "weight": 35, "enabled": true}, {"name": "Team Experience", "weight": 25, "enabled": true}, {"name": "Advisory Board", "weight": 20, "enabled": true}, {"name": "Cultural Fit", "weight": 20, "enabled": true}]}, {"name": "Financial & Traction", "weight": 25, "enabled": true, "subcategories": [{"name": "Revenue Growth", "weight": 30, "enabled": true}, {"name": "Unit Economics", "weight": 25, "enabled": true}, {"name": "Customer Acquisition", "weight": 25, "enabled": true}, {"name": "Financial Projections", "weight": 20, "enabled": true}]}]}'::JSONB;
    
    pe_criteria := '{"categories": [{"name": "Financial Performance", "weight": 25, "enabled": true, "subcategories": [{"name": "Revenue Growth", "weight": 30, "enabled": true}, {"name": "Profitability", "weight": 25, "enabled": true}, {"name": "Cash Flow", "weight": 25, "enabled": true}, {"name": "Financial Stability", "weight": 20, "enabled": true}]}, {"name": "Market Position", "weight": 25, "enabled": true, "subcategories": [{"name": "Market Share", "weight": 30, "enabled": true}, {"name": "Competitive Advantage", "weight": 25, "enabled": true}, {"name": "Brand Strength", "weight": 25, "enabled": true}, {"name": "Customer Base", "weight": 20, "enabled": true}]}, {"name": "Operational Excellence", "weight": 25, "enabled": true, "subcategories": [{"name": "Management Team", "weight": 30, "enabled": true}, {"name": "Operational Efficiency", "weight": 25, "enabled": true}, {"name": "Process Quality", "weight": 25, "enabled": true}, {"name": "Technology Systems", "weight": 20, "enabled": true}]}, {"name": "Growth Potential", "weight": 25, "enabled": true, "subcategories": [{"name": "Market Expansion", "weight": 30, "enabled": true}, {"name": "Product Development", "weight": 25, "enabled": true}, {"name": "Value Creation", "weight": 25, "enabled": true}, {"name": "Exit Strategy", "weight": 20, "enabled": true}]}]}'::JSONB;
    
    -- Loop through all funds that exist but don't have V2 strategies
    FOR fund_record IN 
        SELECT f.id, f.name, f.organization_id, f.fund_type 
        FROM public.funds f
        LEFT JOIN public.investment_strategies_v2 v2 ON f.id = v2.fund_id
        WHERE v2.fund_id IS NULL
        AND f.is_active = true
    LOOP
        -- Check if fund has a legacy strategy (for reference)
        SELECT COUNT(*) INTO strategy_count 
        FROM public.investment_strategies 
        WHERE fund_id = fund_record.id;
        
        RAISE NOTICE 'Creating V2 strategy for fund: % (ID: %, Legacy strategies: %)', 
            fund_record.name, fund_record.id, strategy_count;
        
        -- Create V2 strategy using short form fund types for compatibility
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
            fund_record.id,
            fund_record.name,
            fund_record.organization_id,
            CASE 
                WHEN fund_record.fund_type = 'venture_capital' THEN 'vc'
                WHEN fund_record.fund_type = 'private_equity' THEN 'pe'
                ELSE 'vc'
            END,
            'Default investment strategy - please customize based on your fund''s focus',
            ARRAY['Technology', 'Healthcare', 'Financial Services'], -- sectors
            CASE 
                WHEN fund_record.fund_type = 'venture_capital' THEN ARRAY['Seed', 'Series A', 'Series B']
                ELSE ARRAY['Growth Equity', 'Buyout', 'Expansion']
            END, -- stages
            ARRAY['North America', 'Europe'], -- geographies
            CASE 
                WHEN fund_record.fund_type = 'venture_capital' THEN 500000
                ELSE 5000000
            END, -- check_size_min
            CASE 
                WHEN fund_record.fund_type = 'venture_capital' THEN 5000000
                ELSE 50000000
            END, -- check_size_max
            ARRAY['Strong team', 'Large market', 'Proven traction'], -- key_signals
            'Focus on high-growth opportunities with strong fundamentals', -- investment_philosophy
            '{"approach": "data_driven", "risk_tolerance": "moderate"}'::JSONB, -- philosophy_config
            '{"sources": ["industry_reports", "expert_networks"], "depth": "comprehensive"}'::JSONB, -- research_approach
            '{"channels": ["network", "inbound", "proactive"], "focus": "quality_over_quantity"}'::JSONB, -- deal_sourcing_strategy
            '{"stages": ["screening", "due_diligence", "investment_committee"], "timeline": "6-8_weeks"}'::JSONB, -- decision_making_process
            '{"weight": 20, "subcategories": {}, "positiveSignals": [], "negativeSignals": []}'::JSONB, -- team_leadership_config
            '{"weight": 25, "subcategories": {}, "positiveSignals": [], "negativeSignals": []}'::JSONB, -- market_opportunity_config
            '{"weight": 20, "subcategories": {}, "positiveSignals": [], "negativeSignals": []}'::JSONB, -- product_technology_config
            '{"weight": 15, "subcategories": {}, "positiveSignals": [], "negativeSignals": []}'::JSONB, -- business_traction_config
            '{"weight": 10, "subcategories": {}, "positiveSignals": [], "negativeSignals": []}'::JSONB, -- financial_health_config
            '{"weight": 10, "subcategories": {}, "positiveSignals": [], "negativeSignals": []}'::JSONB, -- strategic_fit_config
            85, -- exciting_threshold
            70, -- promising_threshold
            50, -- needs_development_threshold
            CASE 
                WHEN fund_record.fund_type = 'venture_capital' THEN vc_criteria
                ELSE pe_criteria
            END -- enhanced_criteria based on fund type
        );
        
    END LOOP;
    
    RAISE NOTICE 'Migration complete: Created V2 strategies for existing funds';
END $$;