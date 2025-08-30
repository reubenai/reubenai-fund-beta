-- Create deal2_enrichment_linkedin_profile_export table
CREATE TABLE public.deal2_enrichment_linkedin_profile_export (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL,
  founder_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  snapshot_id TEXT,
  raw_brightdata_response JSONB,
  processing_status TEXT NOT NULL DEFAULT 'queued',
  error_details TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deal2_enrichment_linkedin_profile_export ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Services can manage LinkedIn profile enrichment records"
ON public.deal2_enrichment_linkedin_profile_export
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can manage LinkedIn profile enrichment for accessible funds"
ON public.deal2_enrichment_linkedin_profile_export
FOR ALL
USING (
  deal_id IN (
    SELECT d.id 
    FROM deals d 
    JOIN funds f ON d.fund_id = f.id 
    WHERE user_can_access_fund(f.id)
  )
)
WITH CHECK (
  deal_id IN (
    SELECT d.id 
    FROM deals d 
    JOIN funds f ON d.fund_id = f.id 
    WHERE user_can_access_fund(f.id)
  )
);

-- Create indexes for performance
CREATE INDEX idx_deal2_linkedin_profile_deal_id ON public.deal2_enrichment_linkedin_profile_export(deal_id);
CREATE INDEX idx_deal2_linkedin_profile_status ON public.deal2_enrichment_linkedin_profile_export(processing_status);
CREATE INDEX idx_deal2_linkedin_profile_snapshot ON public.deal2_enrichment_linkedin_profile_export(snapshot_id);

-- Create trigger function to auto-populate LinkedIn profile enrichment on deal creation
CREATE OR REPLACE FUNCTION trigger_linkedin_profile_enrichment_on_deal_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if founder field is not null and not empty
  IF NEW.founder IS NOT NULL AND trim(NEW.founder) != '' THEN
    
    -- Parse founder name into first and last name
    DECLARE
      name_parts TEXT[];
      first_name_val TEXT := '';
      last_name_val TEXT := '';
    BEGIN
      -- Split name by spaces and get parts
      name_parts := string_to_array(trim(NEW.founder), ' ');
      
      IF array_length(name_parts, 1) >= 1 THEN
        first_name_val := name_parts[1];
      END IF;
      
      IF array_length(name_parts, 1) >= 2 THEN
        last_name_val := name_parts[array_length(name_parts, 1)];
      END IF;
      
      -- Insert enrichment record
      INSERT INTO public.deal2_enrichment_linkedin_profile_export (
        deal_id,
        founder_name,
        first_name,
        last_name,
        processing_status
      ) VALUES (
        NEW.id,
        NEW.founder,
        first_name_val,
        last_name_val,
        'queued'
      );
      
      -- Log activity
      INSERT INTO public.activity_events (
        user_id,
        fund_id,
        deal_id,
        activity_type,
        title,
        description,
        context_data
      ) VALUES (
        COALESCE(NEW.created_by, '00000000-0000-0000-0000-000000000000'),
        NEW.fund_id,
        NEW.id,
        'enrichment_queued',
        'LinkedIn Profile Enrichment Queued',
        'LinkedIn profile enrichment queued for founder: ' || NEW.founder,
        jsonb_build_object(
          'founder_name', NEW.founder,
          'first_name', first_name_val,
          'last_name', last_name_val,
          'enrichment_type', 'linkedin_profile'
        )
      );
      
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Create trigger on deals table
CREATE TRIGGER trigger_linkedin_profile_enrichment_on_deal_insert
  AFTER INSERT ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION trigger_linkedin_profile_enrichment_on_deal_creation();