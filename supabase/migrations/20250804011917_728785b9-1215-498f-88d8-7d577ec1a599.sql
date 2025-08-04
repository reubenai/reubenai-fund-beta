-- Fix market research engine quota handling and improve content quality
-- Add analysis execution tracking for better debugging

-- Create table for tracking analysis execution stages
CREATE TABLE IF NOT EXISTS public.analysis_execution_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL,
  fund_id UUID NOT NULL,
  execution_type TEXT NOT NULL DEFAULT 'memo_generation',
  stage_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for analysis execution log
ALTER TABLE public.analysis_execution_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage analysis logs with proper access" 
ON public.analysis_execution_log 
FOR ALL 
USING (
  is_reuben_admin() OR 
  fund_id IN (
    SELECT f.id FROM funds f
    JOIN profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('super_admin', 'admin', 'fund_manager', 'analyst')
  )
);

-- Add content quality metrics to ic_memos table
ALTER TABLE public.ic_memos ADD COLUMN IF NOT EXISTS content_quality_score INTEGER DEFAULT 50;
ALTER TABLE public.ic_memos ADD COLUMN IF NOT EXISTS content_word_count INTEGER DEFAULT 0;
ALTER TABLE public.ic_memos ADD COLUMN IF NOT EXISTS data_richness_score INTEGER DEFAULT 50;
ALTER TABLE public.ic_memos ADD COLUMN IF NOT EXISTS generation_metadata JSONB DEFAULT '{}';

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_analysis_execution_log_deal_fund ON public.analysis_execution_log(deal_id, fund_id);
CREATE INDEX IF NOT EXISTS idx_analysis_execution_log_status ON public.analysis_execution_log(status, execution_type);