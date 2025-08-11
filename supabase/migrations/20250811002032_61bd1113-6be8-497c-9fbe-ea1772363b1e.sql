-- Create missing tables for Fund Memory functionality

-- Memory prompt triggers table
CREATE TABLE IF NOT EXISTS public.memory_prompt_triggers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fund_id UUID NOT NULL,
  trigger_type TEXT NOT NULL,
  prompt_template TEXT,
  effectiveness_score INTEGER DEFAULT 75,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.memory_prompt_triggers ENABLE ROW LEVEL SECURITY;

-- Create policies for memory prompt triggers
CREATE POLICY "Users can manage memory triggers for accessible funds" 
ON public.memory_prompt_triggers 
FOR ALL 
USING (user_can_access_fund(fund_id))
WITH CHECK (user_can_access_fund(fund_id));

-- IC Sessions table for voting workflow
CREATE TABLE IF NOT EXISTS public.ic_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fund_id UUID NOT NULL,
  session_title TEXT NOT NULL,
  session_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'scheduled',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ic_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for IC sessions
CREATE POLICY "Users can manage IC sessions for accessible funds" 
ON public.ic_sessions 
FOR ALL 
USING (user_can_access_fund(fund_id))
WITH CHECK (user_can_access_fund(fund_id));

-- IC Memos table
CREATE TABLE IF NOT EXISTS public.ic_memos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL,
  session_id UUID,
  content TEXT NOT NULL,
  approval_status TEXT DEFAULT 'draft',
  created_by UUID NOT NULL,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ic_memos ENABLE ROW LEVEL SECURITY;

-- Create policies for IC memos
CREATE POLICY "Users can manage IC memos for accessible deals" 
ON public.ic_memos 
FOR ALL 
USING (deal_id IN (
  SELECT d.id FROM deals d 
  JOIN funds f ON d.fund_id = f.id 
  WHERE user_can_access_fund(f.id)
));

-- IC Votes table
CREATE TABLE IF NOT EXISTS public.ic_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  memo_id UUID NOT NULL,
  voter_id UUID NOT NULL,
  vote TEXT NOT NULL CHECK (vote IN ('approve', 'reject', 'abstain')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(memo_id, voter_id)
);

-- Enable RLS
ALTER TABLE public.ic_votes ENABLE ROW LEVEL SECURITY;

-- Create policies for IC votes
CREATE POLICY "Users can manage IC votes for accessible memos" 
ON public.ic_votes 
FOR ALL 
USING (memo_id IN (
  SELECT m.id FROM ic_memos m 
  JOIN deals d ON m.deal_id = d.id 
  JOIN funds f ON d.fund_id = f.id 
  WHERE user_can_access_fund(f.id)
));

-- Insert some sample memory triggers for testing
INSERT INTO public.memory_prompt_triggers (fund_id, trigger_type, prompt_template, effectiveness_score) 
SELECT 
  id,
  'similar_deal',
  'Based on previous similar deals in {industry}, consider {key_factor}',
  85
FROM public.funds 
WHERE is_active = true
ON CONFLICT DO NOTHING;

INSERT INTO public.memory_prompt_triggers (fund_id, trigger_type, prompt_template, effectiveness_score) 
SELECT 
  id,
  'risk_pattern',
  'Historical risk pattern detected: {risk_type}. Review mitigation strategies.',
  78
FROM public.funds 
WHERE is_active = true
ON CONFLICT DO NOTHING;