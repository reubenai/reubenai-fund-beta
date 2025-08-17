-- Phase A: Core Data Contracts for ReubenAI Platform Upgrade
-- Fund Memory with strict tenant isolation
CREATE TABLE IF NOT EXISTS public.fund_memory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  fund_id UUID NOT NULL,
  namespace TEXT NOT NULL,
  memory_key TEXT NOT NULL,
  memory_value JSONB NOT NULL DEFAULT '{}',
  memory_type TEXT NOT NULL DEFAULT 'general',
  confidence_score INTEGER DEFAULT 75,
  retention_period INTERVAL DEFAULT '5 years',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(org_id, fund_id, namespace, memory_key)
);

-- IC Decisions with decision context
CREATE TABLE IF NOT EXISTS public.ic_decisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  fund_id UUID NOT NULL,
  deal_id UUID NOT NULL,
  decision_type TEXT NOT NULL,
  decision_outcome TEXT NOT NULL,
  decision_rationale TEXT,
  decision_maker UUID NOT NULL,
  decision_context JSONB DEFAULT '{}',
  supporting_evidence JSONB DEFAULT '{}',
  confidence_level INTEGER DEFAULT 75,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Deal Features - structured KPIs and risk factors
CREATE TABLE IF NOT EXISTS public.deal_features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  fund_id UUID NOT NULL,
  deal_id UUID NOT NULL,
  feature_type TEXT NOT NULL, -- 'kpi', 'risk', 'category', 'entity'
  feature_name TEXT NOT NULL,
  feature_value JSONB NOT NULL,
  confidence_score INTEGER DEFAULT 75,
  extraction_method TEXT DEFAULT 'hybrid',
  source_references JSONB DEFAULT '[]',
  validation_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(org_id, fund_id, deal_id, feature_type, feature_name)
);

-- Deal Scores - feature-first scoring with evidence
CREATE TABLE IF NOT EXISTS public.deal_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  fund_id UUID NOT NULL,
  deal_id UUID NOT NULL,
  rubric_version TEXT NOT NULL,
  category TEXT NOT NULL,
  raw_score NUMERIC(5,2),
  weighted_score NUMERIC(5,2),
  driver_contributions JSONB DEFAULT '{}',
  evidence_refs JSONB DEFAULT '[]',
  scoring_method TEXT DEFAULT 'feature_first',
  confidence_level INTEGER DEFAULT 75,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(org_id, fund_id, deal_id, rubric_version, category)
);

-- Artifacts - generated outputs with provenance
CREATE TABLE IF NOT EXISTS public.artifacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  fund_id UUID NOT NULL,
  deal_id UUID,
  artifact_type TEXT NOT NULL, -- 'ic_memo', 'trace', 'report'
  artifact_kind TEXT NOT NULL,
  artifact_data JSONB NOT NULL,
  provenance JSONB DEFAULT '{}',
  citations JSONB DEFAULT '[]',
  validation_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Feature flags for rollout phases
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID,
  flag_name TEXT NOT NULL,
  flag_value BOOLEAN DEFAULT false,
  flag_config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(org_id, flag_name)
);

-- Orchestrator execution log
CREATE TABLE IF NOT EXISTS public.orchestrator_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  fund_id UUID NOT NULL,
  deal_id UUID,
  execution_token TEXT NOT NULL,
  workflow_type TEXT NOT NULL,
  current_step TEXT NOT NULL,
  step_status TEXT DEFAULT 'pending',
  step_input JSONB DEFAULT '{}',
  step_output JSONB DEFAULT '{}',
  error_details JSONB DEFAULT '{}',
  telemetry_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(execution_token, current_step)
);

-- Enable RLS on all new tables
ALTER TABLE public.fund_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ic_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orchestrator_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for strict tenant isolation
CREATE POLICY "Org isolation for fund_memory" ON public.fund_memory
  FOR ALL USING (org_id = get_jwt_org_id())
  WITH CHECK (org_id = get_jwt_org_id());

CREATE POLICY "Org isolation for ic_decisions" ON public.ic_decisions
  FOR ALL USING (org_id = get_jwt_org_id())
  WITH CHECK (org_id = get_jwt_org_id());

CREATE POLICY "Org isolation for deal_features" ON public.deal_features
  FOR ALL USING (org_id = get_jwt_org_id())
  WITH CHECK (org_id = get_jwt_org_id());

CREATE POLICY "Org isolation for deal_scores" ON public.deal_scores
  FOR ALL USING (org_id = get_jwt_org_id())
  WITH CHECK (org_id = get_jwt_org_id());

CREATE POLICY "Org isolation for artifacts" ON public.artifacts
  FOR ALL USING (org_id = get_jwt_org_id())
  WITH CHECK (org_id = get_jwt_org_id());

CREATE POLICY "Org isolation for feature_flags" ON public.feature_flags
  FOR ALL USING (org_id IS NULL OR org_id = get_jwt_org_id())
  WITH CHECK (org_id IS NULL OR org_id = get_jwt_org_id());

CREATE POLICY "Org isolation for orchestrator_executions" ON public.orchestrator_executions
  FOR ALL USING (org_id = get_jwt_org_id())
  WITH CHECK (org_id = get_jwt_org_id());

-- Super admin access
CREATE POLICY "Super admin full access fund_memory" ON public.fund_memory
  FOR ALL USING (is_super_admin_by_email())
  WITH CHECK (is_super_admin_by_email());

CREATE POLICY "Super admin full access ic_decisions" ON public.ic_decisions
  FOR ALL USING (is_super_admin_by_email())
  WITH CHECK (is_super_admin_by_email());

CREATE POLICY "Super admin full access deal_features" ON public.deal_features
  FOR ALL USING (is_super_admin_by_email())
  WITH CHECK (is_super_admin_by_email());

CREATE POLICY "Super admin full access deal_scores" ON public.deal_scores
  FOR ALL USING (is_super_admin_by_email())
  WITH CHECK (is_super_admin_by_email());

CREATE POLICY "Super admin full access artifacts" ON public.artifacts
  FOR ALL USING (is_super_admin_by_email())
  WITH CHECK (is_super_admin_by_email());

CREATE POLICY "Super admin full access feature_flags" ON public.feature_flags
  FOR ALL USING (is_super_admin_by_email())
  WITH CHECK (is_super_admin_by_email());

CREATE POLICY "Super admin full access orchestrator_executions" ON public.orchestrator_executions
  FOR ALL USING (is_super_admin_by_email())
  WITH CHECK (is_super_admin_by_email());

-- Indexes for performance
CREATE INDEX idx_fund_memory_org_fund_ns ON public.fund_memory(org_id, fund_id, namespace);
CREATE INDEX idx_ic_decisions_org_fund_deal ON public.ic_decisions(org_id, fund_id, deal_id);
CREATE INDEX idx_deal_features_org_fund_deal ON public.deal_features(org_id, fund_id, deal_id);
CREATE INDEX idx_deal_scores_org_fund_deal ON public.deal_scores(org_id, fund_id, deal_id);
CREATE INDEX idx_artifacts_org_fund_deal ON public.artifacts(org_id, fund_id, deal_id);
CREATE INDEX idx_feature_flags_org_flag ON public.feature_flags(org_id, flag_name);
CREATE INDEX idx_orchestrator_token ON public.orchestrator_executions(execution_token);

-- Insert default feature flags (disabled by default)
INSERT INTO public.feature_flags (flag_name, flag_value, flag_config) VALUES
  ('promptcache_v1', false, '{"description": "Phase A - Prompt caching and instrumentation"}'),
  ('guardrails_v1', false, '{"description": "Phase A - PII detection and tenant isolation"}'),
  ('retrieval_hybrid_v1', false, '{"description": "Phase B - Hybrid retrieval system"}'),
  ('feature_store_v1', false, '{"description": "Phase C - Feature extraction and storage"}'),
  ('scoring_v2', false, '{"description": "Phase C - Feature-first scoring"}'),
  ('ic_memo_drafter_v1', false, '{"description": "Phase D - Automated IC memo generation"}')
ON CONFLICT (org_id, flag_name) DO NOTHING;