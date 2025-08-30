-- Step 1: Modify deal_enrichment_linkedin_export table to support queued records
-- Make raw_brightdata_response nullable to allow queued records
ALTER TABLE deal_enrichment_linkedin_export 
ALTER COLUMN raw_brightdata_response DROP NOT NULL;

-- Make snapshot_id nullable to allow initial queueing
ALTER TABLE deal_enrichment_linkedin_export 
ALTER COLUMN snapshot_id DROP NOT NULL;

-- Step 2: Create trigger function for automatic LinkedIn enrichment
CREATE OR REPLACE FUNCTION trigger_linkedin_enrichment_on_deal_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if linkedin_url is provided
  IF NEW.linkedin_url IS NOT NULL AND NEW.linkedin_url != '' THEN
    -- Insert a queued record for LinkedIn enrichment
    INSERT INTO deal_enrichment_linkedin_export (
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
      'queued', -- Status indicates this needs processing
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
      'enrichment_queued',
      'LinkedIn Enrichment Queued',
      'LinkedIn enrichment automatically queued for company: ' || NEW.company_name,
      jsonb_build_object(
        'company_name', NEW.company_name,
        'linkedin_url', NEW.linkedin_url,
        'trigger_type', 'automatic_on_deal_creation',
        'enrichment_engine', 'brightdata-linkedin'
      ),
      'medium'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;