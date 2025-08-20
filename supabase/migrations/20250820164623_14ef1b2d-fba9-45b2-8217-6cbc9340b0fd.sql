-- Force complete any stuck processing deals and clear analysis queue (corrected)
UPDATE deals 
SET analysis_queue_status = 'completed',
    updated_at = NOW()
WHERE analysis_queue_status = 'processing';

-- Clear all analysis queue items
DELETE FROM analysis_queue WHERE status IN ('queued', 'processing');

-- Set all deals auto_analysis_enabled to false
UPDATE deals SET auto_analysis_enabled = false WHERE auto_analysis_enabled = true;