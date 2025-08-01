-- Enrich CleanTech Solutions deal data for Reuben Fund 2 (with correct rag_status)
UPDATE deals 
SET 
  status = 'investment_committee',
  description = 'CleanTech Solutions is a leading provider of renewable energy storage systems, specializing in advanced battery technology for commercial and industrial applications. The company has developed proprietary lithium-ion battery management systems that increase energy efficiency by 30% compared to traditional solutions.',
  business_model = 'B2B SaaS with hardware sales - recurring revenue from software subscriptions and one-time hardware sales',
  employee_count = 45,
  deal_size = 5000000,
  valuation = 25000000,
  next_action = 'Complete investment committee review and due diligence',
  priority = 'high',
  website = 'https://cleantechsolutions.com',
  linkedin_url = 'https://linkedin.com/company/cleantech-solutions',
  location = 'San Francisco, CA',
  industry = 'CleanTech',
  founder = 'Sarah Chen, CTO with 10+ years in battery technology',
  overall_score = 78,
  rag_status = 'promising',
  rag_confidence = 85,
  rag_reasoning = '{"data_completeness": 85, "strategy_alignment": 80, "market_validation": 75, "team_strength": 82}'
WHERE company_name = 'CleanTech Solutions' 
  AND fund_id IN (SELECT id FROM funds WHERE name LIKE '%Reuben Fund 2%');

-- Add comprehensive deal notes for CleanTech Solutions
INSERT INTO deal_notes (deal_id, content, created_by)
SELECT 
  d.id,
  'Market Analysis: CleanTech Solutions operates in the rapidly growing energy storage market, projected to reach $120B by 2026. Strong competitive moat through proprietary battery management IP.',
  d.created_by
FROM deals d
JOIN funds f ON d.fund_id = f.id
WHERE d.company_name = 'CleanTech Solutions' 
  AND f.name LIKE '%Reuben Fund 2%'
  AND NOT EXISTS (
    SELECT 1 FROM deal_notes dn 
    WHERE dn.deal_id = d.id AND dn.content LIKE '%Market Analysis%'
  );

INSERT INTO deal_notes (deal_id, content, created_by)
SELECT 
  d.id,
  'Financial Performance: ARR of $2.1M with 40% QoQ growth. Gross margins of 65% on software, 25% on hardware. 18-month runway with current funding.',
  d.created_by
FROM deals d
JOIN funds f ON d.fund_id = f.id
WHERE d.company_name = 'CleanTech Solutions' 
  AND f.name LIKE '%Reuben Fund 2%'
  AND NOT EXISTS (
    SELECT 1 FROM deal_notes dn 
    WHERE dn.deal_id = d.id AND dn.content LIKE '%Financial Performance%'
  );

INSERT INTO deal_notes (deal_id, content, created_by)
SELECT 
  d.id,
  'Team Assessment: Strong technical leadership with Sarah Chen (ex-Tesla battery engineer). Sales team scaling rapidly with proven enterprise sales track record.',
  d.created_by
FROM deals d
JOIN funds f ON d.fund_id = f.id
WHERE d.company_name = 'CleanTech Solutions' 
  AND f.name LIKE '%Reuben Fund 2%'
  AND NOT EXISTS (
    SELECT 1 FROM deal_notes dn 
    WHERE dn.deal_id = d.id AND dn.content LIKE '%Team Assessment%'
  );

-- Create comprehensive deal analysis data
INSERT INTO deal_analyses (
  deal_id, 
  market_score, 
  financial_score, 
  product_score, 
  leadership_score, 
  traction_score,
  thesis_alignment_score,
  market_notes,
  financial_notes,
  product_notes,
  leadership_notes,
  traction_notes,
  thesis_alignment_notes,
  confidence_scores,
  data_sources,
  engine_results
)
SELECT 
  d.id,
  82, -- market_score
  75, -- financial_score
  88, -- product_score
  85, -- leadership_score
  78, -- traction_score
  80, -- thesis_alignment_score
  'Large addressable market ($120B by 2026) with strong growth trajectory. Regulatory tailwinds supporting energy storage adoption.',
  'Strong unit economics with 65% gross margins on software. ARR growth of 40% QoQ demonstrates product-market fit.',
  'Proprietary battery management technology with 30% efficiency improvements. Strong IP portfolio with 3 patents filed.',
  'Experienced team with relevant industry background. Sarah Chen brings deep technical expertise from Tesla battery division.',
  'Consistent customer acquisition with 18 enterprise clients. Strong customer retention rate of 95%.',
  'Strong alignment with fund''s CleanTech thesis. Focus on B2B solutions matches investment criteria.',
  '{"market": 85, "financial": 78, "product": 90, "leadership": 82, "traction": 75, "thesis": 88}',
  '{"market_research": "verified", "financial_data": "company_provided", "product_demo": "conducted", "references": "verified"}',
  '{"reuben_orchestrator": {"overall_assessment": "strong_candidate", "recommendation": "proceed_to_ic"}, "market_engine": {"market_size": 120000000000, "growth_rate": 0.25}, "financial_engine": {"arr": 2100000, "growth_rate": 0.40, "gross_margin": 0.65}}'
FROM deals d
JOIN funds f ON d.fund_id = f.id
WHERE d.company_name = 'CleanTech Solutions' 
  AND f.name LIKE '%Reuben Fund 2%'
  AND NOT EXISTS (
    SELECT 1 FROM deal_analyses da WHERE da.deal_id = d.id
  );