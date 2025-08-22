-- Create deal execution locks table to prevent concurrent analysis
CREATE TABLE public.deal_execution_locks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  lock_type TEXT NOT NULL DEFAULT 'analysis',
  locked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  locked_by TEXT NOT NULL, -- service name or execution_token
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '2 hours'),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one lock per deal per type
  UNIQUE(deal_id, lock_type)
);

-- Create index for efficient lookups
CREATE INDEX idx_deal_execution_locks_deal_id ON public.deal_execution_locks(deal_id);
CREATE INDEX idx_deal_execution_locks_expires_at ON public.deal_execution_locks(expires_at);

-- Enable RLS
ALTER TABLE public.deal_execution_locks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Services can manage execution locks" 
ON public.deal_execution_locks 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Users can view execution locks for accessible deals" 
ON public.deal_execution_locks 
FOR SELECT 
USING (deal_id IN (
  SELECT d.id 
  FROM deals d 
  JOIN funds f ON d.fund_id = f.id 
  WHERE user_can_access_fund(f.id)
));

-- Create analysis completion tracker
CREATE TABLE public.analysis_completion_tracker (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL DEFAULT 'full_analysis',
  status TEXT NOT NULL DEFAULT 'in_progress', -- in_progress, completed, failed, aborted
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  completion_reason TEXT,
  artifacts_created INTEGER DEFAULT 0,
  sources_created INTEGER DEFAULT 0,
  execution_token TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one active analysis per deal
  UNIQUE(deal_id, analysis_type) DEFERRABLE INITIALLY DEFERRED
);

-- Create indexes
CREATE INDEX idx_analysis_completion_tracker_deal_id ON public.analysis_completion_tracker(deal_id);
CREATE INDEX idx_analysis_completion_tracker_status ON public.analysis_completion_tracker(status);

-- Enable RLS
ALTER TABLE public.analysis_completion_tracker ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Services can manage completion tracker" 
ON public.analysis_completion_tracker 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Users can view completion tracker for accessible deals" 
ON public.analysis_completion_tracker 
FOR SELECT 
USING (deal_id IN (
  SELECT d.id 
  FROM deals d 
  JOIN funds f ON d.fund_id = f.id 
  WHERE user_can_access_fund(f.id)
));

-- Create deal rate limiting table
CREATE TABLE public.deal_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  last_analysis_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  analysis_count_today INTEGER DEFAULT 1,
  reset_date DATE DEFAULT CURRENT_DATE,
  is_circuit_open BOOLEAN DEFAULT false,
  circuit_opened_at TIMESTAMP WITH TIME ZONE,
  consecutive_failures INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(deal_id)
);

-- Create index
CREATE INDEX idx_deal_rate_limits_deal_id ON public.deal_rate_limits(deal_id);
CREATE INDEX idx_deal_rate_limits_reset_date ON public.deal_rate_limits(reset_date);

-- Enable RLS
ALTER TABLE public.deal_rate_limits ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Services can manage rate limits" 
ON public.deal_rate_limits 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Users can view rate limits for accessible deals" 
ON public.deal_rate_limits 
FOR SELECT 
USING (deal_id IN (
  SELECT d.id 
  FROM deals d 
  JOIN funds f ON d.fund_id = f.id 
  WHERE user_can_access_fund(f.id)
));

-- Function to clean up expired locks
CREATE OR REPLACE FUNCTION public.cleanup_expired_execution_locks()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  DELETE FROM public.deal_execution_locks
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log cleanup
  IF deleted_count > 0 THEN
    RAISE NOTICE 'Cleaned up % expired execution locks', deleted_count;
  END IF;
  
  RETURN deleted_count;
END;
$function$;

-- Function to check if deal analysis is already complete
CREATE OR REPLACE FUNCTION public.is_deal_analysis_complete(p_deal_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  has_artifacts BOOLEAN := false;
  has_analysis BOOLEAN := false;
  has_recent_completion BOOLEAN := false;
BEGIN
  -- Check if artifacts exist for this deal
  SELECT EXISTS(
    SELECT 1 FROM public.artifacts 
    WHERE deal_id = p_deal_id 
    AND artifact_type IN ('ic_memo', 'analysis_report')
    AND validation_status != 'failed'
  ) INTO has_artifacts;
  
  -- Check if deal analysis exists
  SELECT EXISTS(
    SELECT 1 FROM public.deal_analyses 
    WHERE deal_id = p_deal_id 
    AND overall_score IS NOT NULL
    AND analyzed_at > now() - interval '24 hours'
  ) INTO has_analysis;
  
  -- Check completion tracker
  SELECT EXISTS(
    SELECT 1 FROM public.analysis_completion_tracker 
    WHERE deal_id = p_deal_id 
    AND status = 'completed'
    AND completed_at > now() - interval '24 hours'
  ) INTO has_recent_completion;
  
  RETURN has_artifacts OR has_analysis OR has_recent_completion;
END;
$function$;