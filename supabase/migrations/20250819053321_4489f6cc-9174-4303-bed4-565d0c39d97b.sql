-- Create batch embedding processing edge function configuration
INSERT INTO public.ops_control_switches (
  id, 
  component_name, 
  description, 
  current_status, 
  target_status, 
  configuration, 
  last_modified_by, 
  priority
) VALUES (
  'vector-embedding-batch-processor',
  'Vector Embedding Batch Processor',
  'Processes batches of extracted document text into vector embeddings for semantic search',
  'enabled',
  'enabled',
  jsonb_build_object(
    'batch_size', 20,
    'processing_delay_ms', 100,
    'max_retries', 3,
    'health_check_enabled', true
  ),
  'system',
  'medium'
) ON CONFLICT (id) DO UPDATE SET
  description = EXCLUDED.description,
  configuration = EXCLUDED.configuration,
  updated_at = now();

-- Add vector database health monitoring
INSERT INTO public.ops_control_switches (
  id,
  component_name,
  description,
  current_status,
  target_status,
  configuration,
  last_modified_by,
  priority
) VALUES (
  'vector-database-health',
  'Vector Database Health Monitor',
  'Monitors vector embedding coverage and search performance',
  'enabled',
  'enabled',
  jsonb_build_object(
    'minimum_coverage_threshold', 80,
    'performance_threshold_ms', 2000,
    'health_check_interval_minutes', 30
  ),
  'system',
  'high'
) ON CONFLICT (id) DO UPDATE SET
  description = EXCLUDED.description,
  configuration = EXCLUDED.configuration,
  updated_at = now();