-- Phase 1: Enhanced Fund Memory Database Schema
-- Decision Context Traceability Tables

-- Enhanced decision contexts with complete situational awareness
CREATE TABLE public.ic_decision_contexts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fund_id UUID NOT NULL,
  deal_id UUID,
  ic_session_id UUID,
  memo_id UUID,
  decision_maker UUID NOT NULL,
  decision_type TEXT NOT NULL,
  decision_outcome TEXT,
  decision_rationale TEXT,
  ai_recommendations JSONB DEFAULT '{}',
  supporting_evidence JSONB DEFAULT '{}',
  dissenting_opinions JSONB DEFAULT '{}',
  market_context JSONB DEFAULT '{}',
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Links decisions to specific data sources and documents
CREATE TABLE public.decision_supporting_evidence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  decision_context_id UUID NOT NULL REFERENCES public.ic_decision_contexts(id) ON DELETE CASCADE,
  evidence_type TEXT NOT NULL, -- 'document', 'analysis', 'market_data', 'comparable', 'financial_model'
  source_reference TEXT, -- document_id, analysis_id, url, etc.
  evidence_content JSONB DEFAULT '{}',
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  relevance_weight NUMERIC DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tracks when and why humans disagree with AI recommendations
CREATE TABLE public.ai_human_decision_divergence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fund_id UUID NOT NULL,
  deal_id UUID NOT NULL,
  decision_context_id UUID REFERENCES public.ic_decision_contexts(id),
  ai_recommendation TEXT NOT NULL,
  ai_confidence_score INTEGER,
  human_decision TEXT NOT NULL,
  divergence_type TEXT NOT NULL, -- 'override', 'contradiction', 'enhancement', 'rejection'
  human_reasoning TEXT,
  outcome_validation TEXT, -- 'ai_correct', 'human_correct', 'both_wrong', 'pending'
  learning_insights JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  validated_at TIMESTAMP WITH TIME ZONE
);

-- Pattern Intelligence Tables

-- Discovered patterns in fund-specific decision making
CREATE TABLE public.fund_decision_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fund_id UUID NOT NULL,
  pattern_type TEXT NOT NULL, -- 'success_factor', 'risk_signal', 'bias_pattern', 'timing_pattern'
  pattern_name TEXT NOT NULL,
  pattern_description TEXT,
  pattern_data JSONB NOT NULL DEFAULT '{}',
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100) DEFAULT 75,
  pattern_strength NUMERIC DEFAULT 0.0,
  decisions_analyzed INTEGER DEFAULT 0,
  validation_status TEXT DEFAULT 'pending', -- 'pending', 'validated', 'invalidated'
  actionable_insights TEXT,
  recommended_adjustments JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Links past decisions to actual investment outcomes
CREATE TABLE public.outcome_correlation_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fund_id UUID NOT NULL,
  deal_id UUID NOT NULL,
  decision_context_id UUID REFERENCES public.ic_decision_contexts(id),
  predicted_outcome JSONB DEFAULT '{}', -- AI/human predictions at time of decision
  actual_outcome JSONB DEFAULT '{}', -- Real performance data
  outcome_delta JSONB DEFAULT '{}', -- Difference analysis
  correlation_score NUMERIC, -- How well predictions matched reality
  learning_extracted JSONB DEFAULT '{}', -- What we learned from this outcome
  validation_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- How fund decisions correlate with external market signals
CREATE TABLE public.market_signal_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fund_id UUID NOT NULL,
  signal_type TEXT NOT NULL, -- 'market_downturn', 'sector_shift', 'valuation_change', 'regulatory_change'
  signal_description TEXT,
  signal_data JSONB DEFAULT '{}',
  signal_date TIMESTAMP WITH TIME ZONE NOT NULL,
  fund_response JSONB DEFAULT '{}', -- How the fund adjusted strategy/decisions
  response_effectiveness NUMERIC, -- How well the response worked
  deals_affected JSONB DEFAULT '[]', -- Array of deal IDs affected
  strategic_adjustments JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enhanced Fund Memory Entries for better contextual intelligence
ALTER TABLE public.fund_memory_entries 
ADD COLUMN IF NOT EXISTS similarity_scores JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS trigger_contexts JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS memory_effectiveness_score INTEGER CHECK (memory_effectiveness_score >= 0 AND memory_effectiveness_score <= 100),
ADD COLUMN IF NOT EXISTS last_triggered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trigger_count INTEGER DEFAULT 0;

-- Memory prompt triggers for contextual intelligence
CREATE TABLE public.memory_prompt_triggers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fund_id UUID NOT NULL,
  trigger_type TEXT NOT NULL, -- 'similar_deal', 'risk_pattern', 'success_pattern', 'bias_warning'
  trigger_conditions JSONB NOT NULL DEFAULT '{}',
  memory_entry_ids UUID[] DEFAULT '{}',
  prompt_template TEXT,
  trigger_priority INTEGER DEFAULT 50,
  effectiveness_score INTEGER CHECK (effectiveness_score >= 0 AND effectiveness_score <= 100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_triggered TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on all new tables
ALTER TABLE public.ic_decision_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_supporting_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_human_decision_divergence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_decision_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outcome_correlation_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_signal_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_prompt_triggers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fund-based access control

-- Decision contexts
CREATE POLICY "Users can manage decision contexts with proper access" 
ON public.ic_decision_contexts 
FOR ALL 
TO authenticated 
USING (
  is_reuben_admin() OR 
  (fund_id IN (
    SELECT f.id FROM funds f
    JOIN profiles p ON (f.organization_id = p.organization_id)
    WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'fund_manager', 'analyst')
  ))
);

-- Supporting evidence
CREATE POLICY "Users can manage supporting evidence with proper access" 
ON public.decision_supporting_evidence 
FOR ALL 
TO authenticated 
USING (
  decision_context_id IN (
    SELECT id FROM public.ic_decision_contexts 
    WHERE is_reuben_admin() OR 
    (fund_id IN (
      SELECT f.id FROM funds f
      JOIN profiles p ON (f.organization_id = p.organization_id)
      WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'fund_manager', 'analyst')
    ))
  )
);

-- AI-Human divergence
CREATE POLICY "Users can manage AI divergence data with proper access" 
ON public.ai_human_decision_divergence 
FOR ALL 
TO authenticated 
USING (
  is_reuben_admin() OR 
  (fund_id IN (
    SELECT f.id FROM funds f
    JOIN profiles p ON (f.organization_id = p.organization_id)
    WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'fund_manager', 'analyst')
  ))
);

-- Decision patterns
CREATE POLICY "Users can manage decision patterns with proper access" 
ON public.fund_decision_patterns 
FOR ALL 
TO authenticated 
USING (
  is_reuben_admin() OR 
  (fund_id IN (
    SELECT f.id FROM funds f
    JOIN profiles p ON (f.organization_id = p.organization_id)
    WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'fund_manager', 'analyst')
  ))
);

-- Outcome correlation
CREATE POLICY "Users can manage outcome tracking with proper access" 
ON public.outcome_correlation_tracking 
FOR ALL 
TO authenticated 
USING (
  is_reuben_admin() OR 
  (fund_id IN (
    SELECT f.id FROM funds f
    JOIN profiles p ON (f.organization_id = p.organization_id)
    WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'fund_manager', 'analyst')
  ))
);

-- Market signals
CREATE POLICY "Users can manage market signals with proper access" 
ON public.market_signal_responses 
FOR ALL 
TO authenticated 
USING (
  is_reuben_admin() OR 
  (fund_id IN (
    SELECT f.id FROM funds f
    JOIN profiles p ON (f.organization_id = p.organization_id)
    WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'fund_manager', 'analyst')
  ))
);

-- Memory triggers
CREATE POLICY "Users can manage memory triggers with proper access" 
ON public.memory_prompt_triggers 
FOR ALL 
TO authenticated 
USING (
  is_reuben_admin() OR 
  (fund_id IN (
    SELECT f.id FROM funds f
    JOIN profiles p ON (f.organization_id = p.organization_id)
    WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'fund_manager', 'analyst')
  ))
);

-- Create indexes for performance
CREATE INDEX idx_decision_contexts_fund_deal ON public.ic_decision_contexts(fund_id, deal_id);
CREATE INDEX idx_decision_contexts_created_at ON public.ic_decision_contexts(created_at DESC);
CREATE INDEX idx_supporting_evidence_decision ON public.decision_supporting_evidence(decision_context_id);
CREATE INDEX idx_ai_divergence_fund_deal ON public.ai_human_decision_divergence(fund_id, deal_id);
CREATE INDEX idx_decision_patterns_fund_type ON public.fund_decision_patterns(fund_id, pattern_type);
CREATE INDEX idx_outcome_tracking_fund_deal ON public.outcome_correlation_tracking(fund_id, deal_id);
CREATE INDEX idx_market_signals_fund_date ON public.market_signal_responses(fund_id, signal_date DESC);
CREATE INDEX idx_memory_triggers_fund_active ON public.memory_prompt_triggers(fund_id, is_active);
CREATE INDEX idx_fund_memory_similarity ON public.fund_memory_entries USING GIN(similarity_scores);

-- Create update triggers
CREATE TRIGGER update_decision_contexts_updated_at
  BEFORE UPDATE ON public.ic_decision_contexts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_outcome_tracking_updated_at
  BEFORE UPDATE ON public.outcome_correlation_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_decision_patterns_updated_at
  BEFORE UPDATE ON public.fund_decision_patterns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();