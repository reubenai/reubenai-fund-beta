-- Add missing activity types to the activity_type enum
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'founder_profile_enrichment_triggered';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'founder_profile_enrichment_skipped';