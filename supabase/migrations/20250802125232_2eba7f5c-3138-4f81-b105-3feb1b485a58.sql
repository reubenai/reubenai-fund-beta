-- Performance Improvements: Add Database Indexes

-- Deals table indexes for common queries
CREATE INDEX IF NOT EXISTS idx_deals_fund_id ON public.deals(fund_id);
CREATE INDEX IF NOT EXISTS idx_deals_status ON public.deals(status);
CREATE INDEX IF NOT EXISTS idx_deals_created_at ON public.deals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deals_company_name ON public.deals(company_name);
CREATE INDEX IF NOT EXISTS idx_deals_industry ON public.deals(industry);
CREATE INDEX IF NOT EXISTS idx_deals_overall_score ON public.deals(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_deals_fund_status_score ON public.deals(fund_id, status, overall_score DESC);

-- Deal analyses indexes
CREATE INDEX IF NOT EXISTS idx_deal_analyses_deal_id ON public.deal_analyses(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_analyses_analyzed_at ON public.deal_analyses(analyzed_at DESC);
CREATE INDEX IF NOT EXISTS idx_deal_analyses_version ON public.deal_analyses(analysis_version);

-- Activity events indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_activity_events_fund_id ON public.activity_events(fund_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_occurred_at ON public.activity_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_events_activity_type ON public.activity_events(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_events_fund_occurred ON public.activity_events(fund_id, occurred_at DESC);

-- Deal documents indexes
CREATE INDEX IF NOT EXISTS idx_deal_documents_deal_id ON public.deal_documents(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_documents_category ON public.deal_documents(document_category);
CREATE INDEX IF NOT EXISTS idx_deal_documents_status ON public.deal_documents(document_analysis_status);

-- Investment strategies indexes
CREATE INDEX IF NOT EXISTS idx_investment_strategies_fund_id ON public.investment_strategies(fund_id);
CREATE INDEX IF NOT EXISTS idx_investment_strategies_fund_type ON public.investment_strategies(fund_type);

-- IC memos indexes
CREATE INDEX IF NOT EXISTS idx_ic_memos_fund_id ON public.ic_memos(fund_id);
CREATE INDEX IF NOT EXISTS idx_ic_memos_deal_id ON public.ic_memos(deal_id);
CREATE INDEX IF NOT EXISTS idx_ic_memos_status ON public.ic_memos(status);
CREATE INDEX IF NOT EXISTS idx_ic_memos_created_at ON public.ic_memos(created_at DESC);

-- Pipeline stages indexes
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_fund_id ON public.pipeline_stages(fund_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_position ON public.pipeline_stages(position);

-- Profiles indexes for user lookups
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON public.profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Funds indexes
CREATE INDEX IF NOT EXISTS idx_funds_organization_id ON public.funds(organization_id);
CREATE INDEX IF NOT EXISTS idx_funds_is_active ON public.funds(is_active);
CREATE INDEX IF NOT EXISTS idx_funds_fund_type ON public.funds(fund_type);

-- Full-text search indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_deals_search ON public.deals USING gin(to_tsvector('english', 
  COALESCE(company_name, '') || ' ' || 
  COALESCE(description, '') || ' ' || 
  COALESCE(industry, '') || ' ' || 
  COALESCE(founder, '')
));

CREATE INDEX IF NOT EXISTS idx_activity_events_search ON public.activity_events USING gin(to_tsvector('english', 
  COALESCE(searchable_content, '')
)) WHERE searchable_content IS NOT NULL;