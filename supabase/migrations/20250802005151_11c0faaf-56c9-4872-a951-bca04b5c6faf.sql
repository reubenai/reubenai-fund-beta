-- Create sourcing sessions table to track deal sourcing history
CREATE TABLE public.sourcing_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fund_id UUID NOT NULL,
  created_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress',
  thesis_snapshot JSONB NOT NULL DEFAULT '{}',
  search_parameters JSONB NOT NULL DEFAULT '{}',
  total_sourced INTEGER DEFAULT 0,
  total_reviewed INTEGER DEFAULT 0,
  total_processed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sourced companies table for temporary company storage during sourcing
CREATE TABLE public.sourced_companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  description TEXT,
  industry TEXT,
  location TEXT,
  website TEXT,
  funding_stage TEXT,
  deal_size BIGINT,
  valuation BIGINT,
  confidence_score INTEGER DEFAULT 70,
  source_method TEXT DEFAULT 'ai_generated',
  validation_score INTEGER,
  validation_reasons JSONB DEFAULT '{}',
  ai_analysis_score INTEGER,
  strategy_alignment_score INTEGER,
  recommendation TEXT,
  priority_level TEXT DEFAULT 'medium',
  removed_by_user BOOLEAN DEFAULT false,
  created_deal_id UUID,
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add source_method column to deals table to track how deals were created
ALTER TABLE public.deals 
ADD COLUMN source_method TEXT DEFAULT 'manual';

-- Enable RLS
ALTER TABLE public.sourcing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sourced_companies ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for sourcing_sessions
CREATE POLICY "Users can manage sourcing sessions with proper access"
ON public.sourcing_sessions
FOR ALL
USING (
  is_reuben_admin() OR 
  (fund_id IN (
    SELECT f.id FROM funds f
    JOIN profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('super_admin', 'admin', 'fund_manager', 'analyst')
  ))
);

CREATE POLICY "Users can view sourcing sessions for accessible funds"
ON public.sourcing_sessions
FOR SELECT
USING (
  is_reuben_admin() OR
  (fund_id IN (
    SELECT f.id FROM funds f
    JOIN profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid()
  ))
);

-- Create RLS policies for sourced_companies
CREATE POLICY "Users can manage sourced companies with proper access"
ON public.sourced_companies
FOR ALL
USING (
  session_id IN (
    SELECT s.id FROM sourcing_sessions s
    JOIN funds f ON s.fund_id = f.id
    JOIN profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('super_admin', 'admin', 'fund_manager', 'analyst')
  )
);

CREATE POLICY "Users can view sourced companies for accessible sessions"
ON public.sourced_companies
FOR SELECT
USING (
  session_id IN (
    SELECT s.id FROM sourcing_sessions s
    JOIN funds f ON s.fund_id = f.id
    JOIN profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX idx_sourcing_sessions_fund_id ON public.sourcing_sessions(fund_id);
CREATE INDEX idx_sourcing_sessions_created_by ON public.sourcing_sessions(created_by);
CREATE INDEX idx_sourced_companies_session_id ON public.sourced_companies(session_id);

-- Create triggers for updated_at
CREATE TRIGGER update_sourcing_sessions_updated_at
  BEFORE UPDATE ON public.sourcing_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sourced_companies_updated_at
  BEFORE UPDATE ON public.sourced_companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();