-- Delete Evo Sonic Deal and Related Data
-- Step 1: Delete VC datapoints record
DELETE FROM deal_analysis_datapoints_vc 
WHERE deal_id = 'e1080208-d5dd-4c2c-b73b-ab09a4456052';

-- Step 2: Delete Perplexity market enrichment data  
DELETE FROM deal_enrichment_perplexity_market_export_vc 
WHERE deal_id = 'e1080208-d5dd-4c2c-b73b-ab09a4456052';

-- Step 3: Delete the main deal record (must be last due to foreign keys)
DELETE FROM deals 
WHERE id = 'e1080208-d5dd-4c2c-b73b-ab09a4456052';

-- Verification: Check all records are removed
SELECT 'deals_remaining' as table_name, COUNT(*) as count FROM deals WHERE id = 'e1080208-d5dd-4c2c-b73b-ab09a4456052'
UNION ALL
SELECT 'vc_datapoints_remaining' as table_name, COUNT(*) as count FROM deal_analysis_datapoints_vc WHERE deal_id = 'e1080208-d5dd-4c2c-b73b-ab09a4456052'
UNION ALL
SELECT 'perplexity_data_remaining' as table_name, COUNT(*) as count FROM deal_enrichment_perplexity_market_export_vc WHERE deal_id = 'e1080208-d5dd-4c2c-b73b-ab09a4456052';