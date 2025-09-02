-- Add template structure column to ic_memo_templates table
ALTER TABLE ic_memo_templates 
ADD COLUMN IF NOT EXISTS template_structure JSONB DEFAULT '{}';

-- Update existing Blueprint v2 PE scores table with new category mappings
-- This migration handles the transition from old PE categories to the new V2 structure

-- First, create a mapping function to translate old categories to new ones
CREATE OR REPLACE FUNCTION migrate_pe_category_mapping(old_category_id TEXT)
RETURNS TEXT AS $$
BEGIN
  CASE old_category_id
    WHEN 'operational-excellence' THEN RETURN 'market-dynamics';
    WHEN 'market-position' THEN RETURN 'competitive-positioning';
    WHEN 'management-quality' THEN RETURN 'management-succession';
    WHEN 'growth-potential' THEN RETURN 'operational-levers';
    -- Keep these unchanged
    WHEN 'financial-performance' THEN RETURN 'financial-performance';
    WHEN 'strategic-fit' THEN RETURN 'strategic-fit';
    ELSE RETURN old_category_id;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Update existing PE Blueprint v2 scores with new category IDs
UPDATE blueprint_v2_scores_pe 
SET category_id = migrate_pe_category_mapping(category_id)
WHERE category_id IN (
  'operational-excellence', 
  'market-position', 
  'management-quality', 
  'growth-potential'
);

-- Create default IC memo templates for VC and PE funds
-- VC Template
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
  jsonb_build_object(
    'fund_type', 'venture_capital',
    'sections', jsonb_build_array(
      jsonb_build_object(
        'section_id', 'executive_summary',
        'section_name', 'Executive Summary',
        'order', 1,
        'required', true
      ),
      jsonb_build_object(
        'section_id', 'team_leadership',
        'section_name', 'Team & Leadership',
        'order', 2,
        'required', true,
        'category_mapping', 'team-leadership'
      ),
      jsonb_build_object(
        'section_id', 'market_opportunity',
        'section_name', 'Market Opportunity', 
        'order', 3,
        'required', true,
        'category_mapping', 'market-opportunity'
      ),
      jsonb_build_object(
        'section_id', 'product_technology',
        'section_name', 'Product & Technology',
        'order', 4,
        'required', true,
        'category_mapping', 'product-technology'
      ),
      jsonb_build_object(
        'section_id', 'business_traction',
        'section_name', 'Business Traction',
        'order', 5,
        'required', true,
        'category_mapping', 'business-traction'
      ),
      jsonb_build_object(
        'section_id', 'financial_health',
        'section_name', 'Financial Health',
        'order', 6,
        'required', true,
        'category_mapping', 'financial-health'
      ),
      jsonb_build_object(
        'section_id', 'strategic_fit',
        'section_name', 'Strategic Fit',
        'order', 7,
        'required', true,
        'category_mapping', 'strategic-fit'
      ),
      jsonb_build_object(
        'section_id', 'recommendation',
        'section_name', 'Investment Recommendation',
        'order', 8,
        'required', true
      )
    )
  )
) ON CONFLICT (name) WHERE fund_id IS NULL DO UPDATE SET 
  template_structure = EXCLUDED.template_structure,
  description = EXCLUDED.description;

-- PE Template
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
  jsonb_build_object(
    'fund_type', 'private_equity',
    'sections', jsonb_build_array(
      jsonb_build_object(
        'section_id', 'executive_summary',
        'section_name', 'Executive Summary',
        'order', 1,
        'required', true
      ),
      jsonb_build_object(
        'section_id', 'financial_performance',
        'section_name', 'Financial Performance',
        'order', 2,
        'required', true,
        'category_mapping', 'financial-performance'
      ),
      jsonb_build_object(
        'section_id', 'market_dynamics',
        'section_name', 'Market Dynamics',
        'order', 3,
        'required', true,
        'category_mapping', 'market-dynamics'
      ),
      jsonb_build_object(
        'section_id', 'competitive_positioning',
        'section_name', 'Competitive Positioning',
        'order', 4,
        'required', true,
        'category_mapping', 'competitive-positioning'
      ),
      jsonb_build_object(
        'section_id', 'management_succession',
        'section_name', 'Management & Succession',
        'order', 5,
        'required', true,
        'category_mapping', 'management-succession'
      ),
      jsonb_build_object(
        'section_id', 'operational_levers',
        'section_name', 'Operational Levers',
        'order', 6,
        'required', true,
        'category_mapping', 'operational-levers'
      ),
      jsonb_build_object(
        'section_id', 'deal_structure',
        'section_name', 'Deal Structure',
        'order', 7,
        'required', true,
        'category_mapping', 'deal-structure'
      ),
      jsonb_build_object(
        'section_id', 'exit_path_timing',
        'section_name', 'Exit Path & Timing',
        'order', 8,
        'required', true,
        'category_mapping', 'exit-path-timing'
      ),
      jsonb_build_object(
        'section_id', 'strategic_fit',
        'section_name', 'Strategic Fit',
        'order', 9,
        'required', true,
        'category_mapping', 'strategic-fit'
      ),
      jsonb_build_object(
        'section_id', 'risk_profile',
        'section_name', 'Risk Profile',
        'order', 10,
        'required', true,
        'category_mapping', 'risk-profile'
      ),
      jsonb_build_object(
        'section_id', 'data_availability',
        'section_name', 'Data Availability',
        'order', 11,
        'required', true,
        'category_mapping', 'data-availability'
      ),
      jsonb_build_object(
        'section_id', 'recommendation',
        'section_name', 'Investment Recommendation',
        'order', 12,
        'required', true
      )
    )
  )
) ON CONFLICT (name) WHERE fund_id IS NULL DO UPDATE SET 
  template_structure = EXCLUDED.template_structure,
  description = EXCLUDED.description;

-- Clean up the migration function
DROP FUNCTION IF EXISTS migrate_pe_category_mapping(TEXT);