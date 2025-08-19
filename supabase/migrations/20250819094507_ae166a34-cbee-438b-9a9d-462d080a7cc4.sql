-- Create deal_enrichment_linkedin_export table for structured LinkedIn data
CREATE TABLE public.deal_enrichment_linkedin_export (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL,
  snapshot_id TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Company identification
  company_id TEXT,
  linkedin_url TEXT,
  company_name TEXT,
  
  -- Company description and details
  about TEXT,
  description TEXT,
  organization_type TEXT,
  industries TEXT,
  specialties TEXT[],
  slogan TEXT,
  
  -- Metrics and following
  followers INTEGER,
  employees_in_linkedin INTEGER,
  company_size TEXT,
  
  -- Location information
  headquarters TEXT,
  country_code TEXT,
  country_codes_array TEXT[],
  locations TEXT[],
  formatted_locations TEXT[],
  get_directions_url TEXT,
  
  -- Web presence
  website TEXT,
  website_simplified TEXT,
  
  -- Financial and company data
  founded INTEGER,
  funding JSONB DEFAULT '{}',
  investors JSONB DEFAULT '[]',
  crunchbase_url TEXT,
  stock_info JSONB DEFAULT '{}',
  
  -- Social and network data
  employees JSONB DEFAULT '[]',
  alumni JSONB DEFAULT '[]',
  alumni_information JSONB DEFAULT '{}',
  updates JSONB DEFAULT '[]',
  similar JSONB DEFAULT '[]',
  affiliated JSONB DEFAULT '[]',
  
  -- Visual assets
  image TEXT,
  logo TEXT,
  
  -- Raw data and processing
  raw_brightdata_response JSONB NOT NULL,
  unformatted_about TEXT,
  processing_status TEXT DEFAULT 'raw' CHECK (processing_status IN ('raw', 'vectorized', 'processed', 'failed')),
  processed_at TIMESTAMP WITH TIME ZONE,
  error_details TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for common queries
CREATE INDEX idx_deal_enrichment_linkedin_deal_id ON public.deal_enrichment_linkedin_export(deal_id);
CREATE INDEX idx_deal_enrichment_linkedin_snapshot ON public.deal_enrichment_linkedin_export(snapshot_id);
CREATE INDEX idx_deal_enrichment_linkedin_status ON public.deal_enrichment_linkedin_export(processing_status);
CREATE INDEX idx_deal_enrichment_linkedin_created ON public.deal_enrichment_linkedin_export(created_at);

-- Add trigger for updated_at
CREATE TRIGGER update_deal_enrichment_linkedin_updated_at
    BEFORE UPDATE ON public.deal_enrichment_linkedin_export
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.deal_enrichment_linkedin_export ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view LinkedIn exports for accessible deals"
    ON public.deal_enrichment_linkedin_export FOR SELECT
    USING (
        deal_id IN (
            SELECT d.id FROM deals d
            JOIN funds f ON d.fund_id = f.id
            JOIN profiles p ON f.organization_id = p.organization_id
            WHERE p.user_id = auth.uid() AND (p.is_deleted IS NULL OR p.is_deleted = false)
        )
    );

CREATE POLICY "Services can insert LinkedIn exports"
    ON public.deal_enrichment_linkedin_export FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Services can update LinkedIn exports"
    ON public.deal_enrichment_linkedin_export FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Super admins can manage all LinkedIn exports"
    ON public.deal_enrichment_linkedin_export FOR ALL
    USING (
        (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@goreuben.com' OR
        (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@reuben.com'
    )
    WITH CHECK (
        (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@goreuben.com' OR
        (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@reuben.com'
    );