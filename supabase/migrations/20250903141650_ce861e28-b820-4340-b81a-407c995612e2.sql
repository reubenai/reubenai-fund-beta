-- =============================================================================
-- COMPREHENSIVE DELETION: DeckMatch
-- Deal ID: 2e798293-1a66-4b6b-92fd-2d6a73ab0eb0
-- =============================================================================

DELETE FROM deal_datapoints_vc WHERE deal_id = '2e798293-1a66-4b6b-92fd-2d6a73ab0eb0';
DELETE FROM deal_analysis_datapoints_vc WHERE deal_id = '2e798293-1a66-4b6b-92fd-2d6a73ab0eb0';
DELETE FROM deal_analysis_datapoints_pe WHERE deal_id = '2e798293-1a66-4b6b-92fd-2d6a73ab0eb0';
DELETE FROM deal_enrichment_perplexity_market_export_vc WHERE deal_id = '2e798293-1a66-4b6b-92fd-2d6a73ab0eb0';
DELETE FROM deal_enrichment_perplexity_company_export_vc WHERE deal_id = '2e798293-1a66-4b6b-92fd-2d6a73ab0eb0';
DELETE FROM deal_enrichment_perplexity_founder_export_vc WHERE deal_id = '2e798293-1a66-4b6b-92fd-2d6a73ab0eb0';
DELETE FROM deal2_enrichment_crunchbase_export WHERE deal_id = '2e798293-1a66-4b6b-92fd-2d6a73ab0eb0';
DELETE FROM deal2_enrichment_linkedin_export WHERE deal_id = '2e798293-1a66-4b6b-92fd-2d6a73ab0eb0';
DELETE FROM deal2_enrichment_linkedin_profile_export WHERE deal_id = '2e798293-1a66-4b6b-92fd-2d6a73ab0eb0';
DELETE FROM deal_documents WHERE deal_id = '2e798293-1a66-4b6b-92fd-2d6a73ab0eb0';
DELETE FROM deal_analyses WHERE deal_id = '2e798293-1a66-4b6b-92fd-2d6a73ab0eb0';
DELETE FROM deal_notes WHERE deal_id = '2e798293-1a66-4b6b-92fd-2d6a73ab0eb0';
DELETE FROM deal_analysisresult_vc WHERE deal_id = '2e798293-1a66-4b6b-92fd-2d6a73ab0eb0';
DELETE FROM deal_analysisresult_pe WHERE deal_id = '2e798293-1a66-4b6b-92fd-2d6a73ab0eb0';
DELETE FROM activity_events WHERE deal_id = '2e798293-1a66-4b6b-92fd-2d6a73ab0eb0';
DELETE FROM analysis_queue WHERE deal_id = '2e798293-1a66-4b6b-92fd-2d6a73ab0eb0';
DELETE FROM analysis_completion_tracker WHERE deal_id = '2e798293-1a66-4b6b-92fd-2d6a73ab0eb0';
DELETE FROM analysis_orchestration_tracking WHERE deal_id = '2e798293-1a66-4b6b-92fd-2d6a73ab0eb0';
DELETE FROM analysis_cost_tracking WHERE deal_id = '2e798293-1a66-4b6b-92fd-2d6a73ab0eb0';
DELETE FROM analysis_execution_log WHERE deal_id = '2e798293-1a66-4b6b-92fd-2d6a73ab0eb0';
DELETE FROM analysis_quality_monitor WHERE deal_id = '2e798293-1a66-4b6b-92fd-2d6a73ab0eb0';
DELETE FROM analysis_idempotency WHERE deal_id = '2e798293-1a66-4b6b-92fd-2d6a73ab0eb0';
DELETE FROM ai_service_interactions WHERE deal_id = '2e798293-1a66-4b6b-92fd-2d6a73ab0eb0';
DELETE FROM ai_service_performance WHERE deal_id = '2e798293-1a66-4b6b-92fd-2d6a73ab0eb0';
DELETE FROM ai_human_decision_divergence WHERE deal_id = '2e798293-1a66-4b6b-92fd-2d6a73ab0eb0';
DELETE FROM blueprint_v2_scores_vc WHERE deal_id = '2e798293-1a66-4b6b-92fd-2d6a73ab0eb0';
DELETE FROM blueprint_v2_scores_pe WHERE deal_id = '2e798293-1a66-4b6b-92fd-2d6a73ab0eb0';
DELETE FROM artifacts WHERE deal_id = '2e798293-1a66-4b6b-92fd-2d6a73ab0eb0';

-- Finally, delete the main DeckMatch deal record
DELETE FROM deals WHERE id = '2e798293-1a66-4b6b-92fd-2d6a73ab0eb0';

-- =============================================================================
-- COMPREHENSIVE DELETION: evoSonic  
-- Deal ID: aa22ab4b-b4ae-4968-aa8c-63261cb9c380
-- =============================================================================

DELETE FROM deal_datapoints_vc WHERE deal_id = 'aa22ab4b-b4ae-4968-aa8c-63261cb9c380';
DELETE FROM deal_analysis_datapoints_vc WHERE deal_id = 'aa22ab4b-b4ae-4968-aa8c-63261cb9c380';
DELETE FROM deal_analysis_datapoints_pe WHERE deal_id = 'aa22ab4b-b4ae-4968-aa8c-63261cb9c380';
DELETE FROM deal_enrichment_perplexity_market_export_vc WHERE deal_id = 'aa22ab4b-b4ae-4968-aa8c-63261cb9c380';
DELETE FROM deal_enrichment_perplexity_company_export_vc WHERE deal_id = 'aa22ab4b-b4ae-4968-aa8c-63261cb9c380';
DELETE FROM deal_enrichment_perplexity_founder_export_vc WHERE deal_id = 'aa22ab4b-b4ae-4968-aa8c-63261cb9c380';
DELETE FROM deal2_enrichment_crunchbase_export WHERE deal_id = 'aa22ab4b-b4ae-4968-aa8c-63261cb9c380';
DELETE FROM deal2_enrichment_linkedin_export WHERE deal_id = 'aa22ab4b-b4ae-4968-aa8c-63261cb9c380';
DELETE FROM deal2_enrichment_linkedin_profile_export WHERE deal_id = 'aa22ab4b-b4ae-4968-aa8c-63261cb9c380';
DELETE FROM deal_documents WHERE deal_id = 'aa22ab4b-b4ae-4968-aa8c-63261cb9c380';
DELETE FROM deal_analyses WHERE deal_id = 'aa22ab4b-b4ae-4968-aa8c-63261cb9c380';
DELETE FROM deal_notes WHERE deal_id = 'aa22ab4b-b4ae-4968-aa8c-63261cb9c380';
DELETE FROM deal_analysisresult_vc WHERE deal_id = 'aa22ab4b-b4ae-4968-aa8c-63261cb9c380';
DELETE FROM deal_analysisresult_pe WHERE deal_id = 'aa22ab4b-b4ae-4968-aa8c-63261cb9c380';
DELETE FROM activity_events WHERE deal_id = 'aa22ab4b-b4ae-4968-aa8c-63261cb9c380';
DELETE FROM analysis_queue WHERE deal_id = 'aa22ab4b-b4ae-4968-aa8c-63261cb9c380';
DELETE FROM analysis_completion_tracker WHERE deal_id = 'aa22ab4b-b4ae-4968-aa8c-63261cb9c380';
DELETE FROM analysis_orchestration_tracking WHERE deal_id = 'aa22ab4b-b4ae-4968-aa8c-63261cb9c380';
DELETE FROM analysis_cost_tracking WHERE deal_id = 'aa22ab4b-b4ae-4968-aa8c-63261cb9c380';
DELETE FROM analysis_execution_log WHERE deal_id = 'aa22ab4b-b4ae-4968-aa8c-63261cb9c380';
DELETE FROM analysis_quality_monitor WHERE deal_id = 'aa22ab4b-b4ae-4968-aa8c-63261cb9c380';
DELETE FROM analysis_idempotency WHERE deal_id = 'aa22ab4b-b4ae-4968-aa8c-63261cb9c380';
DELETE FROM ai_service_interactions WHERE deal_id = 'aa22ab4b-b4ae-4968-aa8c-63261cb9c380';
DELETE FROM ai_service_performance WHERE deal_id = 'aa22ab4b-b4ae-4968-aa8c-63261cb9c380';
DELETE FROM ai_human_decision_divergence WHERE deal_id = 'aa22ab4b-b4ae-4968-aa8c-63261cb9c380';
DELETE FROM blueprint_v2_scores_vc WHERE deal_id = 'aa22ab4b-b4ae-4968-aa8c-63261cb9c380';
DELETE FROM blueprint_v2_scores_pe WHERE deal_id = 'aa22ab4b-b4ae-4968-aa8c-63261cb9c380';
DELETE FROM artifacts WHERE deal_id = 'aa22ab4b-b4ae-4968-aa8c-63261cb9c380';

-- Finally, delete the main evoSonic deal record
DELETE FROM deals WHERE id = 'aa22ab4b-b4ae-4968-aa8c-63261cb9c380';

-- =============================================================================
-- VERIFICATION
-- =============================================================================
-- Double-check that both deals are gone
SELECT 'Verification: Both deals should be gone' as message;
SELECT company_name, id FROM deals WHERE company_name IN ('DeckMatch', 'evoSonic');
SELECT 'Deletion completed successfully' as status;