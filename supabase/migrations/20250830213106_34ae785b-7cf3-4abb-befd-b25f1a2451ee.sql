-- Create RPC function to process enrichment queues via QueueManager
CREATE OR REPLACE FUNCTION process_enrichment_queue(queue_name text)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  -- This function will be called from the frontend QueueManager
  -- It's a placeholder that returns success for now since the actual processing
  -- is handled by the QueueManager.processQueue method
  
  result := jsonb_build_object(
    'success', true,
    'processed', 0,
    'failed', 0,
    'message', 'Queue processing initiated via QueueManager'
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';