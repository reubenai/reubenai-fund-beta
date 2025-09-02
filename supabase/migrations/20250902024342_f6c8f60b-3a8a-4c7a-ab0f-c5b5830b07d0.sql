-- Drop and recreate the trigger to ensure correct configuration
-- First drop the existing trigger
DROP TRIGGER IF EXISTS simple_vc_result_trigger ON deal_enrichment_perplexity_market_export_vc;

-- Recreate the trigger with correct configuration
CREATE TRIGGER simple_vc_result_trigger
    AFTER UPDATE ON deal_enrichment_perplexity_market_export_vc
    FOR EACH ROW
    WHEN (NEW.processing_status = 'processed' AND OLD.processing_status IS DISTINCT FROM 'processed')
    EXECUTE FUNCTION simple_vc_result_manager();