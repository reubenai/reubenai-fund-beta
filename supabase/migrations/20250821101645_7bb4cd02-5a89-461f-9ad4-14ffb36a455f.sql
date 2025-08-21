-- Investment Strategy Versioning and Missing Columns
-- This migration adds versioning capability and missing database columns for comprehensive thesis configuration

-- Create investment strategy versions table for audit trail
CREATE TABLE IF NOT EXISTS public.investment_strategy_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID NOT NULL REFERENCES public.investment_strategies(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  strategy_snapshot JSONB NOT NULL,
  changed_by UUID NOT NULL,
  change_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure version numbers are unique per strategy
  UNIQUE(strategy_id, version_number)
);

-- Add missing columns to investment_strategies table
ALTER TABLE public.investment_strategies 
ADD COLUMN IF NOT EXISTS fund_name TEXT,
ADD COLUMN IF NOT EXISTS investment_philosophy TEXT,
ADD COLUMN IF NOT EXISTS philosophy_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS research_approach JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS deal_sourcing_strategy JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS decision_making_process JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS investment_stages TEXT[],
ADD COLUMN IF NOT EXISTS specialized_sectors TEXT[];

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_investment_strategy_versions_strategy_id ON public.investment_strategy_versions(strategy_id);
CREATE INDEX IF NOT EXISTS idx_investment_strategy_versions_created_at ON public.investment_strategy_versions(created_at);
CREATE INDEX IF NOT EXISTS idx_investment_strategies_fund_name ON public.investment_strategies(fund_name);

-- Enable RLS on the new versioning table
ALTER TABLE public.investment_strategy_versions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for strategy versions (users can access versions for their organization's strategies)
CREATE POLICY "Users can access strategy versions for their organization"
  ON public.investment_strategy_versions
  FOR ALL
  USING (
    strategy_id IN (
      SELECT s.id 
      FROM public.investment_strategies s
      JOIN public.funds f ON s.fund_id = f.id
      WHERE user_can_access_fund(f.id)
    )
  )
  WITH CHECK (
    strategy_id IN (
      SELECT s.id 
      FROM public.investment_strategies s
      JOIN public.funds f ON s.fund_id = f.id
      WHERE user_can_access_fund(f.id)
    )
  );

-- Create function to automatically create strategy version on update
CREATE OR REPLACE FUNCTION public.create_strategy_version()
RETURNS TRIGGER AS $$
DECLARE
  next_version INTEGER;
BEGIN
  -- Get the next version number
  SELECT COALESCE(MAX(version_number), 0) + 1 
  INTO next_version
  FROM public.investment_strategy_versions 
  WHERE strategy_id = NEW.id;
  
  -- Create version snapshot of the OLD strategy (before update)
  IF TG_OP = 'UPDATE' AND OLD IS DISTINCT FROM NEW THEN
    INSERT INTO public.investment_strategy_versions (
      strategy_id,
      version_number,
      strategy_snapshot,
      changed_by,
      change_reason
    ) VALUES (
      OLD.id,
      next_version,
      to_jsonb(OLD),
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::UUID),
      'Automatic version created on strategy update'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;