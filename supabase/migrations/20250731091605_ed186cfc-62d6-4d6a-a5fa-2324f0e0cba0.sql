-- Create Investment Committee system tables

-- IC Memos table for storing investment committee memos
CREATE TABLE public.ic_memos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL,
  fund_id UUID NOT NULL,
  template_id UUID,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'final', 'archived')),
  memo_content JSONB NOT NULL DEFAULT '{}',
  executive_summary TEXT,
  investment_recommendation TEXT,
  rag_status TEXT CHECK (rag_status IN ('exciting', 'promising', 'needs_development')),
  overall_score INTEGER,
  created_by UUID NOT NULL,
  reviewed_by UUID,
  approved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE
);

-- IC Sessions table for managing IC meetings
CREATE TABLE public.ic_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fund_id UUID NOT NULL,
  name TEXT NOT NULL,
  session_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  agenda JSONB DEFAULT '{}',
  participants JSONB NOT NULL DEFAULT '[]',
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- IC Session Deals junction table
CREATE TABLE public.ic_session_deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL,
  deal_id UUID NOT NULL,
  memo_id UUID,
  presentation_order INTEGER,
  time_allocated INTEGER DEFAULT 30, -- minutes
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'presented', 'deferred', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id, deal_id)
);

-- IC Voting Decisions table
CREATE TABLE public.ic_voting_decisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  memo_id UUID NOT NULL,
  session_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  voting_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  final_decision TEXT CHECK (final_decision IN ('approved', 'rejected', 'deferred')),
  vote_summary JSONB DEFAULT '{}',
  decision_rationale TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- IC Memo Votes table for individual votes
CREATE TABLE public.ic_memo_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  decision_id UUID NOT NULL,
  voter_id UUID NOT NULL,
  vote TEXT NOT NULL CHECK (vote IN ('approve', 'reject', 'abstain')),
  reasoning TEXT,
  confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(decision_id, voter_id)
);

-- IC Meeting Minutes table
CREATE TABLE public.ic_meeting_minutes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  key_decisions JSONB DEFAULT '[]',
  action_items JSONB DEFAULT '[]',
  attendees JSONB NOT NULL DEFAULT '[]',
  recorded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- IC Committee Members table
CREATE TABLE public.ic_committee_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fund_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('chair', 'vice_chair', 'member', 'observer')),
  voting_weight DECIMAL(3,2) DEFAULT 1.0 CHECK (voting_weight > 0 AND voting_weight <= 1.0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  appointed_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(fund_id, user_id)
);

-- IC Memo Templates table
CREATE TABLE public.ic_memo_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fund_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  sections JSONB NOT NULL DEFAULT '[]',
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all IC tables
ALTER TABLE public.ic_memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ic_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ic_session_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ic_voting_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ic_memo_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ic_meeting_minutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ic_committee_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ic_memo_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for IC Memos
CREATE POLICY "Users can view IC memos for accessible funds" 
ON public.ic_memos 
FOR SELECT 
USING (
  fund_id IN (
    SELECT f.id FROM funds f
    JOIN profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage IC memos with proper access" 
ON public.ic_memos 
FOR ALL 
USING (
  fund_id IN (
    SELECT f.id FROM funds f
    JOIN profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('super_admin', 'admin', 'fund_manager', 'analyst')
  )
);

-- RLS Policies for IC Sessions
CREATE POLICY "Users can view IC sessions for accessible funds" 
ON public.ic_sessions 
FOR SELECT 
USING (
  fund_id IN (
    SELECT f.id FROM funds f
    JOIN profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Fund managers can manage IC sessions" 
ON public.ic_sessions 
FOR ALL 
USING (
  fund_id IN (
    SELECT f.id FROM funds f
    JOIN profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('super_admin', 'admin', 'fund_manager')
  )
);

-- RLS Policies for IC Session Deals
CREATE POLICY "Users can view IC session deals for accessible sessions" 
ON public.ic_session_deals 
FOR SELECT 
USING (
  session_id IN (
    SELECT s.id FROM ic_sessions s
    JOIN funds f ON s.fund_id = f.id
    JOIN profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Fund managers can manage IC session deals" 
ON public.ic_session_deals 
FOR ALL 
USING (
  session_id IN (
    SELECT s.id FROM ic_sessions s
    JOIN funds f ON s.fund_id = f.id
    JOIN profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('super_admin', 'admin', 'fund_manager')
  )
);

-- RLS Policies for IC Voting Decisions
CREATE POLICY "Users can view voting decisions for accessible memos" 
ON public.ic_voting_decisions 
FOR SELECT 
USING (
  memo_id IN (
    SELECT m.id FROM ic_memos m
    JOIN funds f ON m.fund_id = f.id
    JOIN profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Fund managers can manage voting decisions" 
ON public.ic_voting_decisions 
FOR ALL 
USING (
  memo_id IN (
    SELECT m.id FROM ic_memos m
    JOIN funds f ON m.fund_id = f.id
    JOIN profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('super_admin', 'admin', 'fund_manager')
  )
);

-- RLS Policies for IC Memo Votes
CREATE POLICY "Users can view their own votes and all votes for accessible decisions" 
ON public.ic_memo_votes 
FOR SELECT 
USING (
  voter_id = auth.uid() OR 
  decision_id IN (
    SELECT vd.id FROM ic_voting_decisions vd
    JOIN ic_memos m ON vd.memo_id = m.id
    JOIN funds f ON m.fund_id = f.id
    JOIN profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their own votes" 
ON public.ic_memo_votes 
FOR ALL 
USING (voter_id = auth.uid());

-- RLS Policies for IC Meeting Minutes
CREATE POLICY "Users can view meeting minutes for accessible sessions" 
ON public.ic_meeting_minutes 
FOR SELECT 
USING (
  session_id IN (
    SELECT s.id FROM ic_sessions s
    JOIN funds f ON s.fund_id = f.id
    JOIN profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Fund managers can manage meeting minutes" 
ON public.ic_meeting_minutes 
FOR ALL 
USING (
  session_id IN (
    SELECT s.id FROM ic_sessions s
    JOIN funds f ON s.fund_id = f.id
    JOIN profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('super_admin', 'admin', 'fund_manager')
  )
);

-- RLS Policies for IC Committee Members
CREATE POLICY "Users can view committee members for accessible funds" 
ON public.ic_committee_members 
FOR SELECT 
USING (
  fund_id IN (
    SELECT f.id FROM funds f
    JOIN profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Fund managers can manage committee members" 
ON public.ic_committee_members 
FOR ALL 
USING (
  fund_id IN (
    SELECT f.id FROM funds f
    JOIN profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('super_admin', 'admin', 'fund_manager')
  )
);

-- RLS Policies for IC Memo Templates
CREATE POLICY "Users can view memo templates for accessible funds" 
ON public.ic_memo_templates 
FOR SELECT 
USING (
  fund_id IS NULL OR 
  fund_id IN (
    SELECT f.id FROM funds f
    JOIN profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Fund managers can manage memo templates" 
ON public.ic_memo_templates 
FOR ALL 
USING (
  fund_id IS NULL OR 
  fund_id IN (
    SELECT f.id FROM funds f
    JOIN profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('super_admin', 'admin', 'fund_manager')
  )
);

-- Add updated_at triggers
CREATE TRIGGER update_ic_memos_updated_at
  BEFORE UPDATE ON public.ic_memos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

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

CREATE TRIGGER update_ic_meeting_minutes_updated_at
  BEFORE UPDATE ON public.ic_meeting_minutes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ic_committee_members_updated_at
  BEFORE UPDATE ON public.ic_committee_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ic_memo_templates_updated_at
  BEFORE UPDATE ON public.ic_memo_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_ic_memos_deal_id ON public.ic_memos(deal_id);
CREATE INDEX idx_ic_memos_fund_id ON public.ic_memos(fund_id);
CREATE INDEX idx_ic_memos_status ON public.ic_memos(status);
CREATE INDEX idx_ic_sessions_fund_id ON public.ic_sessions(fund_id);
CREATE INDEX idx_ic_sessions_date ON public.ic_sessions(session_date);
CREATE INDEX idx_ic_session_deals_session_id ON public.ic_session_deals(session_id);
CREATE INDEX idx_ic_session_deals_deal_id ON public.ic_session_deals(deal_id);
CREATE INDEX idx_ic_voting_decisions_memo_id ON public.ic_voting_decisions(memo_id);
CREATE INDEX idx_ic_memo_votes_decision_id ON public.ic_memo_votes(decision_id);
CREATE INDEX idx_ic_memo_votes_voter_id ON public.ic_memo_votes(voter_id);
CREATE INDEX idx_ic_committee_members_fund_id ON public.ic_committee_members(fund_id);
CREATE INDEX idx_ic_committee_members_user_id ON public.ic_committee_members(user_id);

-- Insert default memo template
INSERT INTO public.ic_memo_templates (name, description, sections, is_default, is_active, created_by) VALUES
('Standard IC Memo', 'Default investment committee memo template with 14 standard sections', 
'[
  {"id": "opportunity_overview", "title": "Opportunity Overview", "order": 1, "required": true},
  {"id": "executive_summary", "title": "Executive Summary", "order": 2, "required": true},
  {"id": "company_overview", "title": "Company Overview", "order": 3, "required": true},
  {"id": "market_opportunity", "title": "Market Opportunity", "order": 4, "required": true},
  {"id": "product_service", "title": "Product/Service", "order": 5, "required": true},
  {"id": "business_model", "title": "Business Model", "order": 6, "required": true},
  {"id": "competitive_landscape", "title": "Competitive Landscape", "order": 7, "required": true},
  {"id": "management_team", "title": "Management Team", "order": 8, "required": true},
  {"id": "financial_analysis", "title": "Financial Analysis", "order": 9, "required": true},
  {"id": "investment_terms", "title": "Investment Terms", "order": 10, "required": true},
  {"id": "risks_mitigants", "title": "Risks & Mitigants", "order": 11, "required": true},
  {"id": "exit_strategy", "title": "Exit Strategy", "order": 12, "required": true},
  {"id": "investment_recommendation", "title": "Investment Recommendation", "order": 13, "required": true},
  {"id": "appendices", "title": "Appendices", "order": 14, "required": false}
]'::jsonb,
true, true, '00000000-0000-0000-0000-000000000000');

-- Update deals table to include overall_score and rag_status for alignment
ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS rag_status TEXT CHECK (rag_status IN ('exciting', 'promising', 'needs_development'));