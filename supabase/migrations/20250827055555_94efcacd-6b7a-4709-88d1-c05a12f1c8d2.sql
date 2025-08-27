-- Create deal_enrichment_linkedin_profile_export table for storing LinkedIn profile data
CREATE TABLE public.deal_enrichment_linkedin_profile_export (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL,
  snapshot_id TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Profile identification
  url TEXT,
  name TEXT,
  first_name TEXT,
  last_name TEXT,
  
  -- Profile details
  about TEXT,
  followers INTEGER,
  connections INTEGER,
  position TEXT,
  
  -- Current role and company
  current_company TEXT,
  current_company_name TEXT,
  current_company_company_id TEXT,
  
  -- Experience and background
  experience JSONB DEFAULT '[]'::jsonb,
  education JSONB DEFAULT '[]'::jsonb,
  educations_details JSONB DEFAULT '[]'::jsonb,
  
  -- Professional development
  courses JSONB DEFAULT '[]'::jsonb,
  certifications JSONB DEFAULT '[]'::jsonb,
  honors_and_awards JSONB DEFAULT '[]'::jsonb,
  volunteer_experience JSONB DEFAULT '[]'::jsonb,
  organizations JSONB DEFAULT '[]'::jsonb,
  
  -- Activity and content
  posts JSONB DEFAULT '[]'::jsonb,
  activity JSONB DEFAULT '[]'::jsonb,
  
  -- Professional network
  recommendations_count INTEGER,
  recommendations JSONB DEFAULT '[]'::jsonb,
  
  -- Skills and expertise
  languages JSONB DEFAULT '[]'::jsonb,
  projects JSONB DEFAULT '[]'::jsonb,
  patents JSONB DEFAULT '[]'::jsonb,
  publications JSONB DEFAULT '[]'::jsonb,
  
  -- Processing metadata
  raw_brightdata_response JSONB NOT NULL,
  processing_status TEXT DEFAULT 'raw',
  processed_at TIMESTAMP WITH TIME ZONE,
  error_details TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deal_enrichment_linkedin_profile_export ENABLE ROW LEVEL SECURITY;

-- Create policies similar to LinkedIn company export table
CREATE POLICY "Services can insert LinkedIn profile exports" 
ON public.deal_enrichment_linkedin_profile_export 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Services can update LinkedIn profile exports" 
ON public.deal_enrichment_linkedin_profile_export 
FOR UPDATE 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Super admins can manage all LinkedIn profile exports" 
ON public.deal_enrichment_linkedin_profile_export 
FOR ALL 
USING (
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@goreuben.com' OR
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@reuben.com'
)
WITH CHECK (
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@goreuben.com' OR
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@reuben.com'
);

CREATE POLICY "Users can view LinkedIn profile exports for accessible deals" 
ON public.deal_enrichment_linkedin_profile_export 
FOR SELECT 
USING (
  deal_id IN (
    SELECT d.id 
    FROM deals d
    JOIN funds f ON d.fund_id = f.id
    JOIN profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid() 
    AND (p.is_deleted IS NULL OR p.is_deleted = false)
  )
);

-- Create index for efficient lookups
CREATE INDEX idx_deal_enrichment_linkedin_profile_export_deal_id 
ON public.deal_enrichment_linkedin_profile_export(deal_id);

CREATE INDEX idx_deal_enrichment_linkedin_profile_export_snapshot_id 
ON public.deal_enrichment_linkedin_profile_export(snapshot_id);

-- Create trigger for updated_at
CREATE TRIGGER update_deal_enrichment_linkedin_profile_export_updated_at
BEFORE UPDATE ON public.deal_enrichment_linkedin_profile_export
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_vector_embeddings();