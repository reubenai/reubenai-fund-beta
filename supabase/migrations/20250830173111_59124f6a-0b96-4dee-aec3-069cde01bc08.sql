-- Step 3: Create the trigger that fires on deal creation
CREATE TRIGGER auto_linkedin_enrichment_trigger
    AFTER INSERT ON public.deals
    FOR EACH ROW
    EXECUTE FUNCTION trigger_linkedin_enrichment_on_deal_creation();