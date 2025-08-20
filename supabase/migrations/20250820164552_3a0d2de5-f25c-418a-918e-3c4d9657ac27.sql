-- Force complete any stuck processing deals and clear analysis queue
UPDATE deals 
SET analysis_queue_status = 'completed',
    analysis_status = 'completed',
    updated_at = NOW()
WHERE analysis_queue_status = 'processing' OR analysis_status = 'processing';

-- Clear all analysis queue items
DELETE FROM analysis_queue WHERE status IN ('queued', 'processing');

-- Set all deals auto_analysis_enabled to false
UPDATE deals SET auto_analysis_enabled = false WHERE auto_analysis_enabled = true;