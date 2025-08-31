-- Reset Luwjistik record from incorrect 'completed' status back to 'triggered' 
-- This record was incorrectly marked as completed with a "running" status response
UPDATE deal2_enrichment_crunchbase_export 
SET 
  processing_status = 'triggered',
  raw_brightdata_response = NULL,
  updated_at = NOW()
WHERE id = 'd3ff7607-b01f-44ff-9d5f-28779cdbb454'
  AND processing_status = 'completed'
  AND raw_brightdata_response->>'status' = 'running';