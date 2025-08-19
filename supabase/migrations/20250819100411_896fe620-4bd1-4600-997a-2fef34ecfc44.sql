-- Add the new activity types to the enum
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'linkedin_enrichment_triggered';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'linkedin_enrichment_api_error';  
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'linkedin_enrichment_trigger_error';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'linkedin_url_validation_failed';