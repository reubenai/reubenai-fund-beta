-- Enhanced Fund Memory: Phase 1 - Create missing tables (checking if they exist first)
CREATE TABLE IF NOT EXISTS public.memory_prompt_triggers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fund_id UUID NOT NULL,
  trigger_type TEXT NOT NULL,
  prompt_template TEXT,
  is_active BOOLEAN DEFAULT true,
  effectiveness_score INTEGER DEFAULT 75,
  last_triggered TIMESTAMP WITH TIME ZONE,
  trigger_conditions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS only if not already enabled
ALTER TABLE public.memory_prompt_triggers ENABLE ROW LEVEL SECURITY;

-- Create market signal responses table
CREATE TABLE IF NOT EXISTS public.market_signal_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fund_id UUID NOT NULL,
  signal_type TEXT NOT NULL,
  signal_date TIMESTAMP WITH TIME ZONE NOT NULL,
  response_action TEXT,
  response_effectiveness NUMERIC DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.market_signal_responses ENABLE ROW LEVEL SECURITY;