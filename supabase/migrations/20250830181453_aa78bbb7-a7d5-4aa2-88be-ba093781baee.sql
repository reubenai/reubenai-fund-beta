-- Create deal2_enrichment_crunchbase_export table
CREATE TABLE public.deal2_enrichment_crunchbase_export (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  crunchbase_url TEXT NOT NULL,
  processing_status TEXT NOT NULL DEFAULT 'queued',
  snapshot_id TEXT,
  raw_brightdata_response JSONB,
  error_details TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.deal2_enrichment_crunchbase_export ENABLE ROW LEVEL SECURITY;

-- Create policies for Crunchbase enrichment (same pattern as LinkedIn)
CREATE POLICY "Services can manage Crunchbase enrichment records" 
ON public.deal2_enrichment_crunchbase_export 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can manage Crunchbase enrichment for accessible funds" 
ON public.deal2_enrichment_crunchbase_export 
FOR ALL 
USING (deal_id IN (
  SELECT d.id 
  FROM deals d 
  JOIN funds f ON d.fund_id = f.id 
  WHERE user_can_access_fund(f.id)
))
WITH CHECK (deal_id IN (
  SELECT d.id 
  FROM deals d 
  JOIN funds f ON d.fund_id = f.id 
  WHERE user_can_access_fund(f.id)
));

-- Create indexes for performance
CREATE INDEX idx_deal2_enrichment_crunchbase_export_deal_id ON public.deal2_enrichment_crunchbase_export(deal_id);
CREATE INDEX idx_deal2_enrichment_crunchbase_export_status ON public.deal2_enrichment_crunchbase_export(processing_status);

-- Create trigger function for deal creation with Crunchbase URL
CREATE OR REPLACE FUNCTION trigger_crunchbase_enrichment_on_deal_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if this is a new deal with a crunchbase_url
  IF NEW.crunchbase_url IS NOT NULL AND NEW.crunchbase_url != '' THEN
    -- Insert into enrichment queue
    INSERT INTO public.deal2_enrichment_crunchbase_export (
      deal_id,
      company_name,
      crunchbase_url,
      processing_status,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.company_name,
      NEW.crunchbase_url,
      'queued',
      now(),
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on deals table
CREATE TRIGGER trigger_crunchbase_enrichment_after_deal_insert
  AFTER INSERT ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION trigger_crunchbase_enrichment_on_deal_creation();