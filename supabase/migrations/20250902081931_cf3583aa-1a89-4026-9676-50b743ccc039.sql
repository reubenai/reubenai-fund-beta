-- Add template structure column to ic_memo_templates table if it doesn't exist
ALTER TABLE ic_memo_templates 
ADD COLUMN IF NOT EXISTS template_structure JSONB DEFAULT '{}';

-- Update existing PE Blueprint v2 scores with new category mappings
UPDATE blueprint_v2_scores_pe 
SET category_id = CASE category_id
  WHEN 'operational-excellence' THEN 'market-dynamics'
  WHEN 'market-position' THEN 'competitive-positioning'
  WHEN 'management-quality' THEN 'management-succession'  
  WHEN 'growth-potential' THEN 'operational-levers'
  ELSE category_id
END
WHERE category_id IN (
  'operational-excellence', 
  'market-position', 
  'management-quality', 
  'growth-potential'
);

-- Remove existing default templates if they exist
DELETE FROM ic_memo_templates 
WHERE name IN (
  'VC Investment Committee Memo Template',
  'PE Investment Committee Memo Template'
) AND fund_id IS NULL;

-- Create VC Template
INSERT INTO ic_memo_templates (
  name,
  description,
  fund_id, 
  is_default,
  is_active,
  created_by,
  template_structure
) VALUES (
  'VC Investment Committee Memo Template',
  'Standard template for Venture Capital investment decisions based on V2 thesis categories',
  NULL,
  true,
  true,
  '00000000-0000-0000-0000-000000000000',
  '{"fund_type": "venture_capital", "sections": [{"section_id": "executive_summary", "section_name": "Executive Summary", "order": 1, "required": true}, {"section_id": "team_leadership", "section_name": "Team & Leadership", "order": 2, "required": true, "category_mapping": "team-leadership"}, {"section_id": "market_opportunity", "section_name": "Market Opportunity", "order": 3, "required": true, "category_mapping": "market-opportunity"}, {"section_id": "product_technology", "section_name": "Product & Technology", "order": 4, "required": true, "category_mapping": "product-technology"}, {"section_id": "business_traction", "section_name": "Business Traction", "order": 5, "required": true, "category_mapping": "business-traction"}, {"section_id": "financial_health", "section_name": "Financial Health", "order": 6, "required": true, "category_mapping": "financial-health"}, {"section_id": "strategic_fit", "section_name": "Strategic Fit", "order": 7, "required": true, "category_mapping": "strategic-fit"}, {"section_id": "recommendation", "section_name": "Investment Recommendation", "order": 8, "required": true}]}'::jsonb
);

-- Create PE Template  
INSERT INTO ic_memo_templates (
  name,
  description,
  fund_id,
  is_default, 
  is_active,
  created_by,
  template_structure
) VALUES (
  'PE Investment Committee Memo Template', 
  'Standard template for Private Equity investment decisions based on V2 thesis categories',
  NULL,
  true,
  true,
  '00000000-0000-0000-0000-000000000000',
  '{"fund_type": "private_equity", "sections": [{"section_id": "executive_summary", "section_name": "Executive Summary", "order": 1, "required": true}, {"section_id": "financial_performance", "section_name": "Financial Performance", "order": 2, "required": true, "category_mapping": "financial-performance"}, {"section_id": "market_dynamics", "section_name": "Market Dynamics", "order": 3, "required": true, "category_mapping": "market-dynamics"}, {"section_id": "competitive_positioning", "section_name": "Competitive Positioning", "order": 4, "required": true, "category_mapping": "competitive-positioning"}, {"section_id": "management_succession", "section_name": "Management & Succession", "order": 5, "required": true, "category_mapping": "management-succession"}, {"section_id": "operational_levers", "section_name": "Operational Levers", "order": 6, "required": true, "category_mapping": "operational-levers"}, {"section_id": "deal_structure", "section_name": "Deal Structure", "order": 7, "required": true, "category_mapping": "deal-structure"}, {"section_id": "exit_path_timing", "section_name": "Exit Path & Timing", "order": 8, "required": true, "category_mapping": "exit-path-timing"}, {"section_id": "strategic_fit", "section_name": "Strategic Fit", "order": 9, "required": true, "category_mapping": "strategic-fit"}, {"section_id": "risk_profile", "section_name": "Risk Profile", "order": 10, "required": true, "category_mapping": "risk-profile"}, {"section_id": "data_availability", "section_name": "Data Availability", "order": 11, "required": true, "category_mapping": "data-availability"}, {"section_id": "recommendation", "section_name": "Investment Recommendation", "order": 12, "required": true}]}'::jsonb
);