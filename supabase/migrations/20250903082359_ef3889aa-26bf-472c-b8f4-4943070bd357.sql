-- Update IC memo columns from JSONB to TEXT in deal_analysisresult_vc table
ALTER TABLE deal_analysisresult_vc 
  ALTER COLUMN ic_executive_summary TYPE TEXT,
  ALTER COLUMN ic_company_overview TYPE TEXT,
  ALTER COLUMN ic_market_opportunity TYPE TEXT,
  ALTER COLUMN ic_product_service TYPE TEXT,
  ALTER COLUMN ic_business_model TYPE TEXT,
  ALTER COLUMN ic_competitive_landscape TYPE TEXT,
  ALTER COLUMN ic_financial_analysis TYPE TEXT,
  ALTER COLUMN ic_management_team TYPE TEXT,
  ALTER COLUMN ic_risks_mitigants TYPE TEXT,
  ALTER COLUMN ic_exit_strategy TYPE TEXT,
  ALTER COLUMN ic_investment_terms TYPE TEXT,
  ALTER COLUMN ic_investment_recommendation TYPE TEXT;