-- Fix deal_analysis_catalysts constraint to allow note_update
ALTER TABLE deal_analysis_catalysts 
DROP CONSTRAINT deal_analysis_catalysts_catalyst_type_check;

ALTER TABLE deal_analysis_catalysts 
ADD CONSTRAINT deal_analysis_catalysts_catalyst_type_check 
CHECK (catalyst_type = ANY (ARRAY['document_upload'::text, 'note_added'::text, 'note_update'::text, 'manual_trigger'::text, 'bulk_refresh'::text, 'first_upload'::text, 'strategy_change'::text, 'thesis_update'::text]));