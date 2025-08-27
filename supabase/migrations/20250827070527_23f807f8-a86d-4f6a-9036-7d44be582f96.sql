-- Create deal_enrichment_crunchbase_export table for Crunchbase company data
CREATE TABLE public.deal_enrichment_crunchbase_export (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL,
  snapshot_id TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processing_status TEXT NOT NULL DEFAULT 'raw',
  error_details TEXT,
  
  -- Raw Brightdata response
  raw_brightdata_response JSONB NOT NULL DEFAULT '{}',
  
  -- Core company fields from Crunchbase
  name TEXT,
  url TEXT,
  cb_id TEXT,
  cb_rank INTEGER,
  region TEXT,
  about TEXT,
  industries TEXT,
  operating_status TEXT,
  company_type TEXT,
  social_media_links JSONB DEFAULT '{}',
  founded_date TEXT,
  num_employees INTEGER,
  country_code TEXT,
  website TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  featured_list TEXT,
  full_description TEXT,
  type TEXT,
  uuid TEXT,
  
  -- Technology and web presence
  active_tech_count INTEGER,
  builtwith_num_technologies_used INTEGER,
  builtwith_tech JSONB DEFAULT '[]',
  ipo_status TEXT,
  similar_companies JSONB DEFAULT '[]',
  monthly_visits BIGINT,
  semrush_visits_latest_month BIGINT,
  semrush_last_updated TIMESTAMP WITH TIME ZONE,
  monthly_visits_growth NUMERIC,
  semrush_visits_mom_pct NUMERIC,
  
  -- Contacts and employees
  num_contacts INTEGER,
  num_contacts_linkedin INTEGER,
  num_employee_profiles INTEGER,
  total_active_products INTEGER,
  num_news INTEGER,
  
  -- Funding and investment metrics
  funding_rounds INTEGER,
  bombora_last_updated TIMESTAMP WITH TIME ZONE,
  num_investors INTEGER,
  legal_name TEXT,
  num_event_appearances INTEGER,
  num_acquisitions INTEGER,
  num_investments INTEGER,
  num_advisor_positions INTEGER,
  num_exits INTEGER,
  num_investments_lead INTEGER,
  num_sub_organizations INTEGER,
  num_alumni INTEGER,
  num_diversity_spotlight_investments INTEGER,
  num_founder_alumni INTEGER,
  num_funds INTEGER,
  stock_symbol TEXT,
  
  -- Location and contact details
  location TEXT,
  address TEXT,
  contacts JSONB DEFAULT '[]',
  current_employees JSONB DEFAULT '[]',
  semrush_location_list JSONB DEFAULT '[]',
  siftery_products JSONB DEFAULT '[]',
  funding_rounds_list JSONB DEFAULT '[]',
  bombora JSONB DEFAULT '{}',
  investors JSONB DEFAULT '[]',
  event_appearances JSONB DEFAULT '[]',
  acquisitions JSONB DEFAULT '[]',
  funds_raised JSONB DEFAULT '[]',
  investments JSONB DEFAULT '[]',
  apptopia JSONB DEFAULT '{}',
  current_advisors JSONB DEFAULT '[]',
  exits JSONB DEFAULT '[]',
  leadership_hire JSONB DEFAULT '[]',
  sub_organizations JSONB DEFAULT '[]',
  alumni JSONB DEFAULT '[]',
  diversity_investments JSONB DEFAULT '[]',
  funds_list JSONB DEFAULT '[]',
  layoff JSONB DEFAULT '[]',
  news JSONB DEFAULT '[]',
  aberdeen_it_spend JSONB DEFAULT '{}',
  headquarters_regions JSONB DEFAULT '[]',
  financials_highlights JSONB DEFAULT '{}',
  ipo_fields JSONB DEFAULT '{}',
  ipqwery JSONB DEFAULT '{}',
  overview_highlights JSONB DEFAULT '{}',
  people_highlights JSONB DEFAULT '{}',
  technology_highlights JSONB DEFAULT '{}',
  founders JSONB DEFAULT '[]',
  funds_total NUMERIC,
  acquired_by JSONB DEFAULT '{}',
  investor_type TEXT,
  investment_stage TEXT,
  sub_organization_of JSONB DEFAULT '{}',
  
  -- App analytics
  apptopia_total_downloads BIGINT,
  apptopia_total_downloads_mom_pct NUMERIC,
  company_id TEXT,
  hq_continent TEXT,
  company_overview TEXT,
  socila_media_urls JSONB DEFAULT '[]',
  email_address TEXT,
  phone_number TEXT,
  
  -- Normalized number fields (alternative naming)
  built_with_num_technologies_used INTEGER,
  built_with_tech JSONB DEFAULT '[]',
  number_of_contacts INTEGER,
  number_of_linkedin_contacts INTEGER,
  number_of_employee_profiles INTEGER,
  number_of_news INTEGER,
  number_of_investors INTEGER,
  number_of_event_appearances INTEGER,
  number_of_acquisitions INTEGER,
  number_of_investments INTEGER,
  number_of_advisor_positions INTEGER,
  number_of_exits INTEGER,
  number_of_investments_lead INTEGER,
  number_of_sub_organizations INTEGER,
  number_of_alumni INTEGER,
  number_of_diversity_spotlight_investments INTEGER,
  number_of_founder_alumni INTEGER,
  number_of_funds INTEGER,
  
  -- Traffic and analytics
  web_traffic_by_semrush JSONB DEFAULT '{}',
  products_and_services JSONB DEFAULT '[]',
  growth_score NUMERIC,
  growth_trend TEXT,
  heat_score NUMERIC,
  heat_trend TEXT,
  company_trending TEXT,
  company_industry TEXT,
  company_activity_level TEXT
);

-- Enable RLS
ALTER TABLE public.deal_enrichment_crunchbase_export ENABLE ROW LEVEL SECURITY;

-- RLS Policies for deal_enrichment_crunchbase_export
CREATE POLICY "Services can insert Crunchbase exports" ON public.deal_enrichment_crunchbase_export
FOR INSERT WITH CHECK (true);

CREATE POLICY "Services can update Crunchbase exports" ON public.deal_enrichment_crunchbase_export
FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Super admins can manage all Crunchbase exports" ON public.deal_enrichment_crunchbase_export
FOR ALL USING (
  ((current_setting('request.jwt.claims', true))::jsonb ->> 'email') LIKE '%@goreuben.com' OR
  ((current_setting('request.jwt.claims', true))::jsonb ->> 'email') LIKE '%@reuben.com'
) WITH CHECK (
  ((current_setting('request.jwt.claims', true))::jsonb ->> 'email') LIKE '%@goreuben.com' OR
  ((current_setting('request.jwt.claims', true))::jsonb ->> 'email') LIKE '%@reuben.com'
);

CREATE POLICY "Users can view Crunchbase exports for accessible deals" ON public.deal_enrichment_crunchbase_export
FOR SELECT USING (
  deal_id IN (
    SELECT d.id FROM deals d
    JOIN funds f ON d.fund_id = f.id
    JOIN profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid() AND (p.is_deleted IS NULL OR p.is_deleted = false)
  )
);

-- Create indexes for performance
CREATE INDEX idx_deal_enrichment_crunchbase_export_deal_id ON public.deal_enrichment_crunchbase_export(deal_id);
CREATE INDEX idx_deal_enrichment_crunchbase_export_snapshot_id ON public.deal_enrichment_crunchbase_export(snapshot_id);
CREATE INDEX idx_deal_enrichment_crunchbase_export_created_at ON public.deal_enrichment_crunchbase_export(created_at);
CREATE INDEX idx_deal_enrichment_crunchbase_export_processing_status ON public.deal_enrichment_crunchbase_export(processing_status);