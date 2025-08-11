-- Fix deal_analyses constraint issue for proper upsert
ALTER TABLE deal_analyses DROP CONSTRAINT IF EXISTS deal_analyses_pkey;
ALTER TABLE deal_analyses ADD CONSTRAINT deal_analyses_pkey PRIMARY KEY (deal_id);

-- Ensure data_lineage_log constraint is valid
ALTER TABLE data_lineage_log DROP CONSTRAINT IF EXISTS data_lineage_log_data_classification_check;
ALTER TABLE data_lineage_log ADD CONSTRAINT data_lineage_log_data_classification_check 
CHECK (data_classification IN ('public', 'internal', 'confidential', 'fund_specific', 'restricted'));