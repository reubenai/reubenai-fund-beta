-- Add IC memo section columns to deal_analysisresult_vc table
ALTER TABLE public.deal_analysisresult_vc 
ADD COLUMN ic_executive_summary JSONB DEFAULT NULL,
ADD COLUMN ic_company_overview JSONB DEFAULT NULL,
ADD COLUMN ic_market_opportunity JSONB DEFAULT NULL,
ADD COLUMN ic_product_service JSONB DEFAULT NULL,
ADD COLUMN ic_business_model JSONB DEFAULT NULL,
ADD COLUMN ic_competitive_landscape JSONB DEFAULT NULL,
ADD COLUMN ic_financial_analysis JSONB DEFAULT NULL,
ADD COLUMN ic_management_team JSONB DEFAULT NULL,
ADD COLUMN ic_risks_mitigants JSONB DEFAULT NULL,
ADD COLUMN ic_exit_strategy JSONB DEFAULT NULL,
ADD COLUMN ic_investment_terms JSONB DEFAULT NULL,
ADD COLUMN ic_investment_recommendation JSONB DEFAULT NULL;