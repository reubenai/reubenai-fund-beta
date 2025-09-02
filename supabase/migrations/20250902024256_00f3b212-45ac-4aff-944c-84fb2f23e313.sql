-- Recreate the missing trigger for VC analysis results
-- This trigger will create records in deal_analysisresult_vc when 
-- deal_enrichment_perplexity_market_export_vc processing completes

CREATE TRIGGER simple_vc_result_trigger
    AFTER UPDATE ON deal_enrichment_perplexity_market_export_vc
    FOR EACH ROW
    WHEN (NEW.processing_status = 'processed' AND OLD.processing_status IS DISTINCT FROM 'processed')
    EXECUTE FUNCTION simple_vc_result_manager();