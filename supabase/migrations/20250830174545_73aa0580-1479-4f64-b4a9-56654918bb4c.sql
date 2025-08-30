-- Create simplified LinkedIn enrichment table
CREATE TABLE public.deal2_enrichment_linkedin_export (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  snapshot_id TEXT,
  company_name TEXT NOT NULL,
  linkedin_url TEXT NOT NULL,
  raw_brightdata_response JSONB,
  processing_status TEXT NOT NULL DEFAULT 'queued' CHECK (processing_status IN ('queued', 'processing', 'completed', 'failed')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  error_details TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.deal2_enrichment_linkedin_export ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage LinkedIn enrichment for accessible funds"
ON public.deal2_enrichment_linkedin_export
FOR ALL
USING (
  deal_id IN (
    SELECT d.id FROM deals d
    JOIN funds f ON d.fund_id = f.id
    WHERE user_can_access_fund(f.id)
  )
)
WITH CHECK (
  deal_id IN (
    SELECT d.id FROM deals d
    JOIN funds f ON d.fund_id = f.id
    WHERE user_can_access_fund(f.id)
  )
);

CREATE POLICY "Services can manage LinkedIn enrichment records"
ON public.deal2_enrichment_linkedin_export
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for performance
CREATE INDEX idx_deal2_enrichment_linkedin_deal_id ON public.deal2_enrichment_linkedin_export(deal_id);
CREATE INDEX idx_deal2_enrichment_linkedin_status ON public.deal2_enrichment_linkedin_export(processing_status);

-- Update trigger function to use new table
CREATE OR REPLACE FUNCTION trigger_linkedin_enrichment_on_deal_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if linkedin_url is provided
  IF NEW.linkedin_url IS NOT NULL AND NEW.linkedin_url != '' THEN
    -- Insert a queued record for LinkedIn enrichment in new table
    INSERT INTO deal2_enrichment_linkedin_export (
      deal_id,
      company_name,
      linkedin_url,
      processing_status,
      timestamp,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.company_name,
      NEW.linkedin_url,
      'queued',
      NOW(),
      NOW(),
      NOW()
    );
    
    -- Log activity for the LinkedIn enrichment trigger
    INSERT INTO activity_events (
      user_id,
      fund_id,
      deal_id,
      activity_type,
      title,
      description,
      context_data,
      priority
    ) VALUES (
      NEW.created_by,
      NEW.fund_id,
      NEW.id,
      'deal_created',
      'LinkedIn Enrichment Queued',
      'LinkedIn enrichment automatically queued for company: ' || NEW.company_name,
      jsonb_build_object(
        'company_name', NEW.company_name,
        'linkedin_url', NEW.linkedin_url,
        'trigger_type', 'automatic_on_deal_creation',
        'enrichment_engine', 'brightdata-linkedin',
        'enrichment_status', 'queued'
      ),
      'medium'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;