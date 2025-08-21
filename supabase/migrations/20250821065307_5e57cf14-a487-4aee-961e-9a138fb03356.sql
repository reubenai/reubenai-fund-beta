-- Create resilience infrastructure tables for Phase 1 stabilization

-- Idempotency keys table
CREATE TABLE public.idempotency_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  result JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Circuit breaker logs table
CREATE TABLE public.circuit_breaker_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  function_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('attempt', 'success', 'failure')),
  duration_ms INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Kill switches table
CREATE TABLE public.kill_switches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  switch_name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT false,
  reason TEXT,
  activated_by TEXT,
  activated_at TIMESTAMP WITH TIME ZONE,
  deactivated_by TEXT,
  deactivated_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circuit_breaker_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kill_switches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for idempotency_keys
CREATE POLICY "Services can manage idempotency keys"
ON public.idempotency_keys
FOR ALL
USING (true);

-- RLS Policies for circuit_breaker_logs  
CREATE POLICY "Services can log circuit breaker events"
ON public.circuit_breaker_logs
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view circuit breaker logs"
ON public.circuit_breaker_logs
FOR SELECT
USING (is_reuben_email());

-- RLS Policies for kill_switches
CREATE POLICY "Admins can manage kill switches"
ON public.kill_switches
FOR ALL
USING (is_reuben_email());

CREATE POLICY "Services can read kill switches"
ON public.kill_switches
FOR SELECT
USING (true);

-- Create indexes for performance
CREATE INDEX idx_idempotency_keys_key ON public.idempotency_keys (key);
CREATE INDEX idx_idempotency_keys_expires_at ON public.idempotency_keys (expires_at);
CREATE INDEX idx_circuit_breaker_logs_function_name ON public.circuit_breaker_logs (function_name);
CREATE INDEX idx_circuit_breaker_logs_created_at ON public.circuit_breaker_logs (created_at);
CREATE INDEX idx_kill_switches_name_active ON public.kill_switches (switch_name, is_active);

-- Trigger to update updated_at on kill_switches
CREATE OR REPLACE FUNCTION update_kill_switches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_kill_switches_updated_at
BEFORE UPDATE ON public.kill_switches
FOR EACH ROW
EXECUTE FUNCTION update_kill_switches_updated_at();