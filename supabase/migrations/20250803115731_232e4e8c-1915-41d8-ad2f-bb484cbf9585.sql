-- Enhanced Deal Decisions with AI Learning Context
CREATE TABLE public.deal_decisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL,
  fund_id UUID NOT NULL,
  decision_type TEXT NOT NULL CHECK (decision_type IN ('accept', 'reject', 'defer', 'ic_approve', 'ic_reject', 'ic_defer')),
  decision_maker UUID NOT NULL,
  decision_rationale TEXT,
  rejection_reason TEXT,
  rejection_category TEXT, -- 'strategy_misalignment', 'team_concerns', 'market_issues', 'financial_concerns', 'other'
  confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 100),
  ai_score_at_decision INTEGER,
  ai_recommendation_at_decision TEXT,
  contradicts_ai BOOLEAN DEFAULT FALSE,
  learning_context JSONB DEFAULT '{}',
  decision_metadata JSONB DEFAULT '{}',
  sourcing_feedback JSONB DEFAULT '{}',
  impact_on_strategy JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Calendar Integration for IC Sessions
CREATE TABLE public.ic_calendar_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL,
  meeting_title TEXT NOT NULL,
  meeting_description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  conference_method TEXT CHECK (conference_method IN ('zoom', 'teams', 'meet', 'in_person')),
  conference_url TEXT,
  ics_content TEXT,
  attendees JSONB DEFAULT '[]',
  organizer_email TEXT NOT NULL,
  invite_status TEXT DEFAULT 'draft' CHECK (invite_status IN ('draft', 'sent', 'updated', 'cancelled')),
  calendar_provider TEXT DEFAULT 'outlook',
  external_event_id TEXT,
  reminder_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Decision Learning Patterns
CREATE TABLE public.decision_learning_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fund_id UUID NOT NULL,
  pattern_type TEXT NOT NULL, -- 'rejection_pattern', 'acceptance_pattern', 'ai_accuracy', 'strategy_drift'
  pattern_data JSONB NOT NULL DEFAULT '{}',
  confidence_score INTEGER DEFAULT 75,
  pattern_strength NUMERIC DEFAULT 0.0,
  decisions_analyzed INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT TRUE,
  actionable_insights TEXT,
  recommended_adjustments JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add new status to deal_status enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'deal_status' AND typelem = 0) THEN
    CREATE TYPE deal_status AS ENUM ('sourced', 'screening', 'due_diligence', 'ic_review', 'approved', 'declined', 'rejected');
  ELSE
    -- Add rejected if it doesn't exist
    BEGIN
      ALTER TYPE deal_status ADD VALUE IF NOT EXISTS 'rejected';
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- Add content column to fund_memory_entries (fixing the current bug)
ALTER TABLE public.fund_memory_entries 
ADD COLUMN IF NOT EXISTS content TEXT;

-- Create indexes for performance
CREATE INDEX idx_deal_decisions_deal_fund ON public.deal_decisions(deal_id, fund_id);
CREATE INDEX idx_deal_decisions_type_created ON public.deal_decisions(decision_type, created_at DESC);
CREATE INDEX idx_deal_decisions_contradicts_ai ON public.deal_decisions(contradicts_ai) WHERE contradicts_ai = true;
CREATE INDEX idx_calendar_invites_session ON public.ic_calendar_invites(session_id);
CREATE INDEX idx_calendar_invites_start_time ON public.ic_calendar_invites(start_time);
CREATE INDEX idx_learning_patterns_fund_type ON public.decision_learning_patterns(fund_id, pattern_type);

-- RLS Policies
ALTER TABLE public.deal_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ic_calendar_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_learning_patterns ENABLE ROW LEVEL SECURITY;

-- Deal Decisions Policies
CREATE POLICY "Users can manage deal decisions with proper access" ON public.deal_decisions
  FOR ALL USING (
    deal_id IN (
      SELECT d.id FROM deals d
      JOIN funds f ON d.fund_id = f.id
      JOIN profiles p ON f.organization_id = p.organization_id
      WHERE p.user_id = auth.uid()
      AND p.role IN ('super_admin', 'admin', 'fund_manager', 'analyst')
    )
  );

CREATE POLICY "Users can view deal decisions for accessible deals" ON public.deal_decisions
  FOR SELECT USING (
    deal_id IN (
      SELECT d.id FROM deals d
      JOIN funds f ON d.fund_id = f.id
      JOIN profiles p ON f.organization_id = p.organization_id
      WHERE p.user_id = auth.uid()
    )
  );

-- Calendar Invites Policies
CREATE POLICY "Users can manage calendar invites for accessible sessions" ON public.ic_calendar_invites
  FOR ALL USING (
    session_id IN (
      SELECT s.id FROM ic_sessions s
      JOIN funds f ON s.fund_id = f.id
      JOIN profiles p ON f.organization_id = p.organization_id
      WHERE p.user_id = auth.uid()
      AND p.role IN ('super_admin', 'admin', 'fund_manager')
    )
  );

-- Learning Patterns Policies
CREATE POLICY "Users can manage learning patterns with proper access" ON public.decision_learning_patterns
  FOR ALL USING (
    is_reuben_admin() OR (
      fund_id IN (
        SELECT f.id FROM funds f
        JOIN profiles p ON f.organization_id = p.organization_id
        WHERE p.user_id = auth.uid()
        AND p.role IN ('super_admin', 'admin', 'fund_manager', 'analyst')
      )
    )
  );

-- Update content column from memory_content for existing entries
UPDATE public.fund_memory_entries 
SET content = memory_content::text 
WHERE content IS NULL AND memory_content IS NOT NULL;

-- Triggers for updated_at
CREATE TRIGGER update_deal_decisions_updated_at
  BEFORE UPDATE ON public.deal_decisions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_calendar_invites_updated_at
  BEFORE UPDATE ON public.ic_calendar_invites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to analyze decision patterns
CREATE OR REPLACE FUNCTION public.analyze_decision_patterns(fund_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  pattern_result JSONB := '{}';
  rejection_rate NUMERIC;
  ai_accuracy NUMERIC;
  common_rejection_reasons JSONB;
BEGIN
  -- Calculate rejection rate
  SELECT 
    ROUND(
      (COUNT(*) FILTER (WHERE decision_type IN ('reject', 'ic_reject'))::NUMERIC / 
       NULLIF(COUNT(*), 0)) * 100, 2
    )
  INTO rejection_rate
  FROM deal_decisions 
  WHERE fund_id = fund_id_param;
  
  -- Calculate AI accuracy (decisions that align with AI recommendations)
  SELECT 
    ROUND(
      (COUNT(*) FILTER (WHERE contradicts_ai = false)::NUMERIC / 
       NULLIF(COUNT(*), 0)) * 100, 2
    )
  INTO ai_accuracy
  FROM deal_decisions 
  WHERE fund_id = fund_id_param AND ai_recommendation_at_decision IS NOT NULL;
  
  -- Get common rejection reasons
  SELECT jsonb_agg(
    jsonb_build_object(
      'reason', rejection_category,
      'count', reason_count,
      'percentage', ROUND((reason_count::NUMERIC / total_rejections) * 100, 1)
    )
  )
  INTO common_rejection_reasons
  FROM (
    SELECT 
      rejection_category,
      COUNT(*) as reason_count,
      SUM(COUNT(*)) OVER () as total_rejections
    FROM deal_decisions 
    WHERE fund_id = fund_id_param 
    AND decision_type IN ('reject', 'ic_reject')
    AND rejection_category IS NOT NULL
    GROUP BY rejection_category
    ORDER BY reason_count DESC
    LIMIT 5
  ) rejection_stats;
  
  -- Build result
  pattern_result := jsonb_build_object(
    'rejection_rate', COALESCE(rejection_rate, 0),
    'ai_accuracy', COALESCE(ai_accuracy, 0),
    'common_rejection_reasons', COALESCE(common_rejection_reasons, '[]'::jsonb),
    'analyzed_at', now()
  );
  
  RETURN pattern_result;
END;
$$;