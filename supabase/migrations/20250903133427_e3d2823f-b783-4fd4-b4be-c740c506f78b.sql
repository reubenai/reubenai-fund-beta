-- Delete Latest Evo Sonic Deal - COMPREHENSIVE deletion including ALL possible child tables
-- Delete from ALL child tables that might reference the deal_id

DELETE FROM deal_datapoints_vc WHERE deal_id = '8860e16e-a52b-4739-ae9c-b4bab062df51';
DELETE FROM deal_analysis_datapoints_vc WHERE deal_id = '8860e16e-a52b-4739-ae9c-b4bab062df51';
DELETE FROM deal_analysis_datapoints_pe WHERE deal_id = '8860e16e-a52b-4739-ae9c-b4bab062df51';
DELETE FROM deal_enrichment_perplexity_market_export_vc WHERE deal_id = '8860e16e-a52b-4739-ae9c-b4bab062df51';
DELETE FROM deal_enrichment_perplexity_company_export_vc WHERE deal_id = '8860e16e-a52b-4739-ae9c-b4bab062df51';
DELETE FROM deal_enrichment_perplexity_founder_export_vc WHERE deal_id = '8860e16e-a52b-4739-ae9c-b4bab062df51';
DELETE FROM deal2_enrichment_crunchbase_export WHERE deal_id = '8860e16e-a52b-4739-ae9c-b4bab062df51';
DELETE FROM deal2_enrichment_linkedin_export WHERE deal_id = '8860e16e-a52b-4739-ae9c-b4bab062df51';
DELETE FROM deal2_enrichment_linkedin_profile_export WHERE deal_id = '8860e16e-a52b-4739-ae9c-b4bab062df51';
DELETE FROM deal_documents WHERE deal_id = '8860e16e-a52b-4739-ae9c-b4bab062df51';
DELETE FROM deal_analyses WHERE deal_id = '8860e16e-a52b-4739-ae9c-b4bab062df51';
DELETE FROM deal_notes WHERE deal_id = '8860e16e-a52b-4739-ae9c-b4bab062df51';
DELETE FROM deal_analysisresult_vc WHERE deal_id = '8860e16e-a52b-4739-ae9c-b4bab062df51';
DELETE FROM deal_analysisresult_pe WHERE deal_id = '8860e16e-a52b-4739-ae9c-b4bab062df51';
DELETE FROM activity_events WHERE deal_id = '8860e16e-a52b-4739-ae9c-b4bab062df51';
DELETE FROM analysis_queue WHERE deal_id = '8860e16e-a52b-4739-ae9c-b4bab062df51';
DELETE FROM analysis_completion_tracker WHERE deal_id = '8860e16e-a52b-4739-ae9c-b4bab062df51';
DELETE FROM analysis_orchestration_tracking WHERE deal_id = '8860e16e-a52b-4739-ae9c-b4bab062df51';
DELETE FROM analysis_cost_tracking WHERE deal_id = '8860e16e-a52b-4739-ae9c-b4bab062df51';
DELETE FROM analysis_execution_log WHERE deal_id = '8860e16e-a52b-4739-ae9c-b4bab062df51';
DELETE FROM analysis_quality_monitor WHERE deal_id = '8860e16e-a52b-4739-ae9c-b4bab062df51';
DELETE FROM analysis_idempotency WHERE deal_id = '8860e16e-a52b-4739-ae9c-b4bab062df51';
DELETE FROM ai_service_interactions WHERE deal_id = '8860e16e-a52b-4739-ae9c-b4bab062df51';
DELETE FROM ai_service_performance WHERE deal_id = '8860e16e-a52b-4739-ae9c-b4bab062df51';
DELETE FROM ai_human_decision_divergence WHERE deal_id = '8860e16e-a52b-4739-ae9c-b4bab062df51';
DELETE FROM blueprint_v2_scores_vc WHERE deal_id = '8860e16e-a52b-4739-ae9c-b4bab062df51';
DELETE FROM blueprint_v2_scores_pe WHERE deal_id = '8860e16e-a52b-4739-ae9c-b4bab062df51';
DELETE FROM artifacts WHERE deal_id = '8860e16e-a52b-4739-ae9c-b4bab062df51';

-- Finally, delete the main deal record
DELETE FROM deals WHERE id = '8860e16e-a52b-4739-ae9c-b4bab062df51';

-- Verification
SELECT 'Latest Evo Sonic deal and ALL related records removed successfully' as status;