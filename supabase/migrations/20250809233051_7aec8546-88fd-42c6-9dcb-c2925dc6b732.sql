-- Phase 3: LLM Control Plane Tables

-- LLM Response Cache Table (TTL = 24h)
CREATE TABLE IF NOT EXISTS public.llm_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  response_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for cache key lookups
CREATE INDEX IF NOT EXISTS idx_llm_cache_key ON public.llm_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_llm_cache_created_at ON public.llm_cache(created_at);

-- Rate Limit Buckets Table  
CREATE TABLE IF NOT EXISTS public.rate_limit_buckets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id TEXT UNIQUE NOT NULL,
  requests_count INTEGER DEFAULT 0,
  last_reset TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ops Dashboard Events Table
CREATE TABLE IF NOT EXISTS public.ops_dashboard_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  provider TEXT,
  model_id TEXT,
  bucket TEXT,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.llm_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.ops_dashboard_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for LLM Cache (system access only)
CREATE POLICY "System can manage LLM cache" ON public.llm_cache
FOR ALL USING (true);

-- RLS Policies for Rate Limit Buckets (system access only)
CREATE POLICY "System can manage rate limit buckets" ON public.rate_limit_buckets
FOR ALL USING (true);

-- RLS Policies for Ops Dashboard Events
CREATE POLICY "Reuben admins can view ops events" ON public.ops_dashboard_events
FOR SELECT USING (is_reuben_email());

CREATE POLICY "System can log ops events" ON public.ops_dashboard_events
FOR INSERT WITH CHECK (true);

-- Cleanup function for LLM cache (remove entries older than 24h)
CREATE OR REPLACE FUNCTION public.cleanup_llm_cache()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  DELETE FROM public.llm_cache 
  WHERE created_at < (now() - interval '24 hours');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;