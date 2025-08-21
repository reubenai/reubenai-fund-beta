-- Phase 2: Queue Architecture & Schema Safety Infrastructure

-- Engine metadata registry for queue configuration
CREATE TABLE public.engine_registry (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  engine_id TEXT NOT NULL UNIQUE,
  queue_name TEXT NOT NULL,
  max_concurrency INTEGER NOT NULL DEFAULT 1,
  job_ttl_minutes INTEGER NOT NULL DEFAULT 30,
  enabled BOOLEAN NOT NULL DEFAULT true,
  feature_flag TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Named job queues with isolation and TTL enforcement
CREATE TABLE public.job_queues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL UNIQUE,
  queue_name TEXT NOT NULL,
  tenant_id UUID NOT NULL,
  engine TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('user', 'scheduler', 'event')),
  trigger_reason TEXT NOT NULL,
  related_ids JSONB NOT NULL DEFAULT '{}'::jsonb,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  idempotency_key TEXT NOT NULL,
  job_payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'expired')),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Dead Letter Queue for failed jobs
CREATE TABLE public.dead_letter_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_job_id UUID NOT NULL,
  queue_name TEXT NOT NULL,
  tenant_id UUID NOT NULL,
  engine TEXT NOT NULL,
  failure_reason TEXT NOT NULL,
  original_payload JSONB NOT NULL,
  failure_context JSONB DEFAULT '{}'::jsonb,
  retry_attempts INTEGER NOT NULL DEFAULT 0,
  can_retry BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_retry_at TIMESTAMP WITH TIME ZONE
);

-- Field catalog for schema validation
CREATE TABLE public.field_catalog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  field_key TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('string', 'number', 'boolean', 'array', 'object', 'uuid', 'date')),
  default_value JSONB,
  is_required BOOLEAN NOT NULL DEFAULT false,
  is_nullable BOOLEAN NOT NULL DEFAULT true,
  used_in_entities TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  validation_rules JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(field_key, used_in_entities)
);

-- Queue processing locks for concurrency control
CREATE TABLE public.queue_processing_locks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  queue_name TEXT NOT NULL,
  worker_id TEXT NOT NULL,
  acquired_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(queue_name, worker_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.engine_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dead_letter_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_processing_locks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for engine_registry
CREATE POLICY "Admins can manage engine registry"
ON public.engine_registry
FOR ALL
USING (is_reuben_email());

CREATE POLICY "Services can read engine registry"
ON public.engine_registry
FOR SELECT
USING (true);

-- RLS Policies for job_queues
CREATE POLICY "Services can manage job queues"
ON public.job_queues
FOR ALL
USING (true);

-- RLS Policies for dead_letter_queue  
CREATE POLICY "Admins can manage dead letter queue"
ON public.dead_letter_queue
FOR ALL
USING (is_reuben_email());

CREATE POLICY "Services can insert to dead letter queue"
ON public.dead_letter_queue
FOR INSERT
WITH CHECK (true);

-- RLS Policies for field_catalog
CREATE POLICY "Admins can manage field catalog"
ON public.field_catalog
FOR ALL
USING (is_reuben_email());

CREATE POLICY "Services can read field catalog"
ON public.field_catalog
FOR SELECT
USING (true);

-- RLS Policies for queue_processing_locks
CREATE POLICY "Services can manage queue locks"
ON public.queue_processing_locks
FOR ALL
USING (true);

-- Create indexes for performance
CREATE INDEX idx_job_queues_queue_name_status ON public.job_queues (queue_name, status);
CREATE INDEX idx_job_queues_scheduled_for ON public.job_queues (scheduled_for);
CREATE INDEX idx_job_queues_expires_at ON public.job_queues (expires_at);
CREATE INDEX idx_job_queues_tenant_id ON public.job_queues (tenant_id);
CREATE INDEX idx_job_queues_idempotency_key ON public.job_queues (idempotency_key);
CREATE INDEX idx_dead_letter_queue_engine ON public.dead_letter_queue (engine);
CREATE INDEX idx_dead_letter_queue_tenant ON public.dead_letter_queue (tenant_id);
CREATE INDEX idx_field_catalog_key ON public.field_catalog (field_key);
CREATE INDEX idx_queue_locks_queue_expires ON public.queue_processing_locks (queue_name, expires_at);

-- Insert default engine configurations
INSERT INTO public.engine_registry (engine_id, queue_name, max_concurrency, job_ttl_minutes, enabled, feature_flag) VALUES
  ('deal_analysis', 'deal_analysis_queue', 3, 30, true, 'enable_deal_analysis'),
  ('strategy_change', 'strategy_change_queue', 2, 15, true, 'enable_strategy_changes'),
  ('document_analysis', 'document_analysis_queue', 2, 30, true, 'enable_document_analysis'),
  ('note_analysis', 'note_analysis_queue', 2, 30, true, 'enable_note_analysis'),
  ('fund_memory', 'fund_memory_queue', 2, 45, false, 'enable_fund_memory'),
  ('ic_memo', 'ic_memo_queue', 1, 60, false, 'enable_ic_memo'),
  ('edge_functions', 'edge_function_queue', 2, 20, false, 'enable_edge_functions');

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_engine_registry_updated_at
BEFORE UPDATE ON public.engine_registry
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_timestamp();

CREATE TRIGGER update_job_queues_updated_at
BEFORE UPDATE ON public.job_queues
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_timestamp();

CREATE TRIGGER update_field_catalog_updated_at
BEFORE UPDATE ON public.field_catalog
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_timestamp();