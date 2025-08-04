-- Update existing deal statuses to match the new pipeline stage naming convention
-- Convert 'sourced' status to 'sourced' (lowercase to match the key generation logic)
UPDATE public.deals 
SET status = 'sourced'::deal_status
WHERE status = 'sourced';

-- Note: The deals are already using 'sourced' status which should match 'Sourced' stage
-- The usePipelineDeals hook converts stage names to lowercase with underscores
-- So 'Sourced' becomes 'sourced' which matches the existing deal status