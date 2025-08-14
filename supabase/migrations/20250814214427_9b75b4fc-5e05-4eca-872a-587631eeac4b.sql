-- Phase 1: Vector Database Foundation & Queue Improvements
-- Enable pgvector extension for semantic search capabilities
CREATE EXTENSION IF NOT EXISTS vector;

-- Create vector embeddings table for semantic search
CREATE TABLE IF NOT EXISTS public.vector_embeddings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL, -- 'deal', 'document', 'memo', 'note'
  content_id UUID NOT NULL,   -- Reference to the actual content (deal_id, document_id, etc)
  fund_id UUID NOT NULL,
  embedding vector(1536),     -- OpenAI ada-002 embedding dimension
  content_text TEXT NOT NULL, -- The actual text that was embedded
  metadata JSONB DEFAULT '{}',
  confidence_score INTEGER DEFAULT 85,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create analysis queue metrics for monitoring and optimization
CREATE TABLE IF NOT EXISTS public.analysis_queue_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type TEXT NOT NULL, -- 'processing_time', 'queue_depth', 'failure_rate', 'throughput'
  metric_value NUMERIC NOT NULL,
  fund_id UUID,
  deal_id UUID,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  time_bucket TIMESTAMP WITH TIME ZONE -- For time-series aggregation
);

-- Create vector search cache for performance optimization
CREATE TABLE IF NOT EXISTS public.vector_search_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  query_hash TEXT NOT NULL UNIQUE,
  query_text TEXT NOT NULL,
  search_type TEXT NOT NULL, -- 'similarity', 'hybrid', 'semantic'
  fund_id UUID NOT NULL,
  results JSONB NOT NULL,
  result_count INTEGER NOT NULL,
  confidence_threshold NUMERIC DEFAULT 0.7,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '1 hour')
);

-- Create enhanced analysis queue status tracking
CREATE TABLE IF NOT EXISTS public.queue_health_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  total_queued INTEGER DEFAULT 0,
  processing_items INTEGER DEFAULT 0,
  failed_in_last_24h INTEGER DEFAULT 0,
  average_processing_time_minutes NUMERIC DEFAULT 0,
  oldest_queue_time TIMESTAMP WITH TIME ZONE,
  health_status TEXT DEFAULT 'healthy', -- 'healthy', 'degraded', 'critical'
  warnings JSONB DEFAULT '[]',
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vector_embeddings_content ON public.vector_embeddings(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_vector_embeddings_fund ON public.vector_embeddings(fund_id);
CREATE INDEX IF NOT EXISTS idx_vector_embeddings_embedding ON public.vector_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_analysis_queue_metrics_type ON public.analysis_queue_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_analysis_queue_metrics_time ON public.analysis_queue_metrics(recorded_at);
CREATE INDEX IF NOT EXISTS idx_analysis_queue_metrics_fund ON public.analysis_queue_metrics(fund_id);

CREATE INDEX IF NOT EXISTS idx_vector_search_cache_hash ON public.vector_search_cache(query_hash);
CREATE INDEX IF NOT EXISTS idx_vector_search_cache_fund ON public.vector_search_cache(fund_id);
CREATE INDEX IF NOT EXISTS idx_vector_search_cache_expires ON public.vector_search_cache(expires_at);

-- Create vector similarity search function
CREATE OR REPLACE FUNCTION public.vector_similarity_search(
  query_embedding vector(1536),
  content_type_filter text DEFAULT NULL,
  fund_id_filter uuid DEFAULT NULL,
  similarity_threshold float DEFAULT 0.7,
  max_results integer DEFAULT 10
)
RETURNS TABLE(
  content_id uuid,
  content_type text,
  content_text text,
  similarity_score float,
  metadata jsonb,
  fund_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ve.content_id,
    ve.content_type,
    ve.content_text,
    (1 - (ve.embedding <=> query_embedding))::float as similarity_score,
    ve.metadata,
    ve.fund_id
  FROM public.vector_embeddings ve
  WHERE 
    (content_type_filter IS NULL OR ve.content_type = content_type_filter)
    AND (fund_id_filter IS NULL OR ve.fund_id = fund_id_filter)
    AND (1 - (ve.embedding <=> query_embedding)) >= similarity_threshold
  ORDER BY ve.embedding <=> query_embedding
  LIMIT max_results;
END;
$$;

-- Create queue health monitoring function
CREATE OR REPLACE FUNCTION public.get_queue_health_status()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  health_data JSONB;
  queue_stats RECORD;
  warnings TEXT[] := '{}';
BEGIN
  -- Get current queue statistics
  SELECT 
    COUNT(*) FILTER (WHERE status = 'queued') as total_queued,
    COUNT(*) FILTER (WHERE status = 'processing') as processing_items,
    COUNT(*) FILTER (WHERE status = 'failed' AND created_at > now() - interval '24 hours') as failed_in_last_24h,
    COALESCE(AVG(EXTRACT(EPOCH FROM (completed_at - started_at))/60) FILTER (WHERE completed_at IS NOT NULL AND started_at IS NOT NULL), 0) as avg_processing_minutes,
    MIN(created_at) FILTER (WHERE status = 'queued') as oldest_queue_time
  INTO queue_stats
  FROM public.analysis_queue;
  
  -- Generate warnings based on thresholds
  IF queue_stats.total_queued > 50 THEN
    warnings := array_append(warnings, 'High queue depth detected');
  END IF;
  
  IF queue_stats.processing_items > 10 THEN
    warnings := array_append(warnings, 'Many items currently processing');
  END IF;
  
  IF queue_stats.failed_in_last_24h > 10 THEN
    warnings := array_append(warnings, 'High failure rate in last 24 hours');
  END IF;
  
  IF queue_stats.oldest_queue_time < now() - interval '2 hours' THEN
    warnings := array_append(warnings, 'Items stuck in queue for over 2 hours');
  END IF;
  
  -- Build health data
  health_data := jsonb_build_object(
    'totalQueued', COALESCE(queue_stats.total_queued, 0),
    'processingItems', COALESCE(queue_stats.processing_items, 0),
    'failedInLast24h', COALESCE(queue_stats.failed_in_last_24h, 0),
    'averageProcessingTime', COALESCE(queue_stats.avg_processing_minutes, 0),
    'oldestQueueTime', queue_stats.oldest_queue_time,
    'isHealthy', array_length(warnings, 1) IS NULL,
    'warnings', to_jsonb(warnings),
    'lastChecked', now()
  );
  
  -- Store in metrics table
  INSERT INTO public.queue_health_metrics (
    total_queued, processing_items, failed_in_last_24h, 
    average_processing_time_minutes, oldest_queue_time,
    health_status, warnings
  ) VALUES (
    queue_stats.total_queued, queue_stats.processing_items, queue_stats.failed_in_last_24h,
    queue_stats.avg_processing_minutes, queue_stats.oldest_queue_time,
    CASE WHEN array_length(warnings, 1) IS NULL THEN 'healthy' 
         WHEN array_length(warnings, 1) <= 2 THEN 'degraded'
         ELSE 'critical' END,
    to_jsonb(warnings)
  );
  
  RETURN health_data;
END;
$$;

-- Enable RLS on new tables
ALTER TABLE public.vector_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_queue_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vector_search_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_health_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for vector embeddings
CREATE POLICY "Users can view embeddings for accessible funds" 
ON public.vector_embeddings 
FOR SELECT 
USING (user_can_access_fund(fund_id));

CREATE POLICY "Services can manage embeddings" 
ON public.vector_embeddings 
FOR ALL 
USING (true);

-- Create RLS policies for analysis queue metrics
CREATE POLICY "Users can view queue metrics for accessible funds" 
ON public.analysis_queue_metrics 
FOR SELECT 
USING (fund_id IS NULL OR user_can_access_fund(fund_id));

CREATE POLICY "Services can insert queue metrics" 
ON public.analysis_queue_metrics 
FOR INSERT 
WITH CHECK (true);

-- Create RLS policies for vector search cache
CREATE POLICY "Users can view search cache for accessible funds" 
ON public.vector_search_cache 
FOR SELECT 
USING (user_can_access_fund(fund_id));

CREATE POLICY "Services can manage search cache" 
ON public.vector_search_cache 
FOR ALL 
USING (true);

-- Create RLS policies for queue health metrics
CREATE POLICY "Users can view queue health metrics" 
ON public.queue_health_metrics 
FOR SELECT 
USING (true);

CREATE POLICY "Services can insert queue health metrics" 
ON public.queue_health_metrics 
FOR INSERT 
WITH CHECK (true);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_vector_embeddings()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vector_embeddings_updated_at
  BEFORE UPDATE ON public.vector_embeddings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_vector_embeddings();

-- Cleanup function for expired cache entries
CREATE OR REPLACE FUNCTION public.cleanup_vector_search_cache()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  DELETE FROM public.vector_search_cache 
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;