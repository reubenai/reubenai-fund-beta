-- Create IC Sessions table
CREATE TABLE public.ic_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fund_id UUID NOT NULL REFERENCES public.funds(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  session_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  agenda JSONB DEFAULT '{}',
  participants JSONB DEFAULT '[]',
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create IC Session Deals junction table
CREATE TABLE public.ic_session_deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.ic_sessions(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  discussion_order INTEGER,
  decision TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create IC Voting Decisions table  
CREATE TABLE public.ic_voting_decisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  memo_id UUID NOT NULL REFERENCES public.ic_memos(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.ic_sessions(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  voting_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  final_decision TEXT,
  vote_summary JSONB DEFAULT '{}',
  decision_rationale TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create IC Memo Votes table
CREATE TABLE public.ic_memo_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  decision_id UUID NOT NULL REFERENCES public.ic_voting_decisions(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES auth.users(id),
  vote TEXT NOT NULL CHECK (vote IN ('approve', 'reject', 'abstain')),
  reasoning TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(decision_id, voter_id)
);

-- Enable Row Level Security
ALTER TABLE public.ic_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ic_session_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ic_voting_decisions ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.ic_memo_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for IC Sessions
CREATE POLICY "Users can view IC sessions for their funds" ON public.ic_sessions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.fund_members fm 
    WHERE fm.fund_id = ic_sessions.fund_id 
    AND fm.user_id = auth.uid()
    AND fm.is_active = true
  )
);

CREATE POLICY "Users can create IC sessions for their funds" ON public.ic_sessions
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.fund_members fm 
    WHERE fm.fund_id = ic_sessions.fund_id 
    AND fm.user_id = auth.uid()
    AND fm.is_active = true
    AND fm.role IN ('admin', 'general_partner')
  )
);

CREATE POLICY "Users can update IC sessions for their funds" ON public.ic_sessions
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.fund_members fm 
    WHERE fm.fund_id = ic_sessions.fund_id 
    AND fm.user_id = auth.uid()
    AND fm.is_active = true
    AND fm.role IN ('admin', 'general_partner')
  )
);

-- RLS Policies for IC Session Deals
CREATE POLICY "Users can view session deals for their funds" ON public.ic_session_deals
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.ic_sessions s
    JOIN public.fund_members fm ON fm.fund_id = s.fund_id
    WHERE s.id = ic_session_deals.session_id
    AND fm.user_id = auth.uid()
    AND fm.is_active = true
  )
);

CREATE POLICY "Users can manage session deals for their funds" ON public.ic_session_deals
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.ic_sessions s
    JOIN public.fund_members fm ON fm.fund_id = s.fund_id
    WHERE s.id = ic_session_deals.session_id
    AND fm.user_id = auth.uid()
    AND fm.is_active = true
    AND fm.role IN ('admin', 'general_partner')
  )
);

-- RLS Policies for IC Voting Decisions
CREATE POLICY "Users can view voting decisions for their funds" ON public.ic_voting_decisions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.ic_memos m
    JOIN public.fund_members fm ON fm.fund_id = m.fund_id
    WHERE m.id = ic_voting_decisions.memo_id
    AND fm.user_id = auth.uid()
    AND fm.is_active = true
  )
);

CREATE POLICY "Users can create voting decisions for their funds" ON public.ic_voting_decisions
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ic_memos m
    JOIN public.fund_members fm ON fm.fund_id = m.fund_id
    WHERE m.id = ic_voting_decisions.memo_id
    AND fm.user_id = auth.uid()
    AND fm.is_active = true
    AND fm.role IN ('admin', 'general_partner')
  )
);

CREATE POLICY "Users can update voting decisions for their funds" ON public.ic_voting_decisions
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.ic_memos m
    JOIN public.fund_members fm ON fm.fund_id = m.fund_id
    WHERE m.id = ic_voting_decisions.memo_id
    AND fm.user_id = auth.uid()
    AND fm.is_active = true
    AND fm.role IN ('admin', 'general_partner')
  )
);

-- RLS Policies for IC Memo Votes
CREATE POLICY "Users can view votes for decisions they can access" ON public.ic_memo_votes
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.ic_voting_decisions vd
    JOIN public.ic_memos m ON m.id = vd.memo_id
    JOIN public.fund_members fm ON fm.fund_id = m.fund_id
    WHERE vd.id = ic_memo_votes.decision_id
    AND fm.user_id = auth.uid()
    AND fm.is_active = true
  )
);

CREATE POLICY "Users can submit their own votes" ON public.ic_memo_votes
FOR INSERT WITH CHECK (
  voter_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.ic_voting_decisions vd
    JOIN public.ic_memos m ON m.id = vd.memo_id
    JOIN public.fund_members fm ON fm.fund_id = m.fund_id
    WHERE vd.id = ic_memo_votes.decision_id
    AND fm.user_id = auth.uid()
    AND fm.is_active = true
  )
);

CREATE POLICY "Users can update their own votes" ON public.ic_memo_votes
FOR UPDATE USING (voter_id = auth.uid());

-- Add updated_at triggers
CREATE TRIGGER update_ic_sessions_updated_at
BEFORE UPDATE ON public.ic_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ic_voting_decisions_updated_at  
BEFORE UPDATE ON public.ic_voting_decisions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ic_memo_votes_updated_at
BEFORE UPDATE ON public.ic_memo_votes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_ic_sessions_fund_id ON public.ic_sessions(fund_id);
CREATE INDEX idx_ic_sessions_date ON public.ic_sessions(session_date);
CREATE INDEX idx_ic_session_deals_session_id ON public.ic_session_deals(session_id);
CREATE INDEX idx_ic_session_deals_deal_id ON public.ic_session_deals(deal_id);
CREATE INDEX idx_ic_voting_decisions_memo_id ON public.ic_voting_decisions(memo_id);
CREATE INDEX idx_ic_voting_decisions_deadline ON public.ic_voting_decisions(voting_deadline);
CREATE INDEX idx_ic_memo_votes_decision_id ON public.ic_memo_votes(decision_id);
CREATE INDEX idx_ic_memo_votes_voter_id ON public.ic_memo_votes(voter_id);