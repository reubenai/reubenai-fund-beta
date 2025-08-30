-- Check if trigger exists, if not create it
DO $$
BEGIN
    -- Check if the trigger already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'auto_linkedin_enrichment_trigger'
    ) THEN
        -- Create the trigger if it doesn't exist
        CREATE TRIGGER auto_linkedin_enrichment_trigger
            AFTER INSERT ON public.deals
            FOR EACH ROW
            EXECUTE FUNCTION trigger_linkedin_enrichment_on_deal_creation();
        
        RAISE NOTICE 'Created auto_linkedin_enrichment_trigger';
    ELSE
        RAISE NOTICE 'Trigger auto_linkedin_enrichment_trigger already exists';
    END IF;
END
$$;