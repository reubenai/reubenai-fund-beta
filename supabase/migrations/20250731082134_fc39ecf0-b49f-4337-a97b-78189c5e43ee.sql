-- Enhanced Deal Analysis Schema for 5 AI Engines
-- Add enhanced tracking and source attribution to deal_analyses table

-- Add new columns for engine-specific results
ALTER TABLE public.deal_analyses ADD COLUMN IF NOT EXISTS engine_results jsonb DEFAULT '{}';
ALTER TABLE public.deal_analyses ADD COLUMN IF NOT EXISTS analysis_version integer DEFAULT 1;
ALTER TABLE public.deal_analyses ADD COLUMN IF NOT EXISTS confidence_scores jsonb DEFAULT '{}';
ALTER TABLE public.deal_analyses ADD COLUMN IF NOT EXISTS data_sources jsonb DEFAULT '{}';
ALTER TABLE public.deal_analyses ADD COLUMN IF NOT EXISTS validation_flags jsonb DEFAULT '{}';

-- Create deal_analysis_sources table for detailed source tracking
CREATE TABLE IF NOT EXISTS public.deal_analysis_sources (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id uuid NOT NULL,
  engine_name text NOT NULL,
  source_type text NOT NULL, -- 'web_scraping', 'api', 'document', 'database'
  source_url text,
  data_retrieved jsonb DEFAULT '{}',
  confidence_score integer,
  validated boolean DEFAULT false,
  validation_notes text,
  retrieved_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on new table
ALTER TABLE public.deal_analysis_sources ENABLE ROW LEVEL SECURITY;

-- RLS policies for deal_analysis_sources
CREATE POLICY "Users can view analysis sources for accessible deals" 
ON public.deal_analysis_sources 
FOR SELECT 
USING (
  deal_id IN (
    SELECT d.id FROM deals d
    JOIN funds f ON d.fund_id = f.id
    JOIN profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage analysis sources with proper access" 
ON public.deal_analysis_sources 
FOR ALL 
USING (
  deal_id IN (
    SELECT d.id FROM deals d
    JOIN funds f ON d.fund_id = f.id
    JOIN profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid() AND has_document_management_access()
  )
);

-- Add trigger to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_deal_analyses_updated_at
  BEFORE UPDATE ON public.deal_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();