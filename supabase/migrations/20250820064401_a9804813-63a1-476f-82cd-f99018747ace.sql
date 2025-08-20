-- Check and fix remaining conflict_detected enum issues
-- First add conflict_detected to the activity_type enum so the trigger works

-- Check existing enum values
-- SELECT unnest(enum_range(NULL::activity_type));

-- Add conflict_detected to activity_type enum if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'conflict_detected' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'activity_type')) THEN
        ALTER TYPE activity_type ADD VALUE 'conflict_detected';
    END IF;
END $$;

-- Alternatively, we can update the trigger to use 'system_event' instead
-- But since the trigger already exists and uses 'conflict_detected', let's add it to the enum