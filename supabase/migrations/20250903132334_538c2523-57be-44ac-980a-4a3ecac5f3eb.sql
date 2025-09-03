-- Delete Evo Sonic Deal - Complete deletion with ALL related records
-- Step 1: Delete all child records first (all tables that reference deal_id)

-- VC datapoints
DELETE FROM deal_analysis_datapoints_vc 
WHERE deal_id = 'e1080208-d5dd-4c2c-b73b-ab09a4456052';

-- Perplexity market enrichment  
DELETE FROM deal_enrichment_perplexity_market_export_vc 
WHERE deal_id = 'e1080208-d5dd-4c2c-b73b-ab09a4456052';

-- Perplexity company enrichment
DELETE FROM deal_enrichment_perplexity_company_export_vc 
WHERE deal_id = 'e1080208-d5dd-4c2c-b73b-ab09a4456052';

-- Perplexity founder enrichment
DELETE FROM deal_enrichment_perplexity_founder_export_vc 
WHERE deal_id = 'e1080208-d5dd-4c2c-b73b-ab09a4456052';

-- Check for other possible related tables and delete if they exist
DELETE FROM deal_documents WHERE deal_id = 'e1080208-d5dd-4c2c-b73b-ab09a4456052';
DELETE FROM deal_analyses WHERE deal_id = 'e1080208-d5dd-4c2c-b73b-ab09a4456052';
DELETE FROM deal_notes WHERE deal_id = 'e1080208-d5dd-4c2c-b73b-ab09a4456052';

-- Step 2: Delete the main deal record (must be last)
DELETE FROM deals 
WHERE id = 'e1080208-d5dd-4c2c-b73b-ab09a4456052';

-- Verification: Ensure complete removal
SELECT 'Evo Sonic deal completely removed - all counts should be 0' as status;

SELECT 'deals_remaining' as table_name, COUNT(*) as count FROM deals WHERE id = 'e1080208-d5dd-4c2c-b73b-ab09a4456052'
UNION ALL
SELECT 'vc_datapoints' as table_name, COUNT(*) as count FROM deal_analysis_datapoints_vc WHERE deal_id = 'e1080208-d5dd-4c2c-b73b-ab09a4456052'
UNION ALL
SELECT 'perplexity_market' as table_name, COUNT(*) as count FROM deal_enrichment_perplexity_market_export_vc WHERE deal_id = 'e1080208-d5dd-4c2c-b73b-ab09a4456052'
UNION ALL  
SELECT 'perplexity_company' as table_name, COUNT(*) as count FROM deal_enrichment_perplexity_company_export_vc WHERE deal_id = 'e1080208-d5dd-4c2c-b73b-ab09a4456052'
UNION ALL
SELECT 'perplexity_founder' as table_name, COUNT(*) as count FROM deal_enrichment_perplexity_founder_export_vc WHERE deal_id = 'e1080208-d5dd-4c2c-b73b-ab09a4456052';