-- Create data lineage tracking table for the Data Controller Monitor
CREATE TABLE IF NOT EXISTS public.data_lineage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_service TEXT NOT NULL,
  target_service TEXT NOT NULL,
  fund_id UUID REFERENCES public.funds(id),
  deal_id UUID REFERENCES public.deals(id),
  data_classification TEXT NOT NULL CHECK (data_classification IN ('fund_specific', 'general_training', 'aggregated_insights')),
  transfer_reason TEXT NOT NULL,
  approved BOOLEAN NOT NULL DEFAULT false,
  data_size INTEGER DEFAULT 0,
  contains_pii BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.data_lineage_log ENABLE ROW LEVEL SECURITY;

-- Create policies for data lineage access
CREATE POLICY "Reuben admins can view all lineage" ON public.data_lineage_log
  FOR SELECT USING (is_reuben_email());

CREATE POLICY "Users can view lineage for their funds" ON public.data_lineage_log
  FOR SELECT USING (
    fund_id IS NULL OR user_can_access_fund(fund_id)
  );

-- Create indexes for performance
CREATE INDEX idx_data_lineage_fund_id ON public.data_lineage_log(fund_id);
CREATE INDEX idx_data_lineage_source_service ON public.data_lineage_log(source_service);
CREATE INDEX idx_data_lineage_target_service ON public.data_lineage_log(target_service);
CREATE INDEX idx_data_lineage_created_at ON public.data_lineage_log(created_at);
CREATE INDEX idx_data_lineage_classification ON public.data_lineage_log(data_classification);

-- Create function to track AI service interactions
CREATE OR REPLACE FUNCTION public.log_ai_service_interaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Log when AI services access fund-specific data
  IF NEW.fund_id IS NOT NULL AND NEW.ai_service_name IS NOT NULL THEN
    INSERT INTO public.data_lineage_log (
      source_service,
      target_service,
      fund_id,
      deal_id,
      data_classification,
      transfer_reason,
      approved,
      metadata
    ) VALUES (
      NEW.ai_service_name,
      'fund-memory-engine',
      NEW.fund_id,
      NEW.deal_id,
      'fund_specific',
      'AI service storing fund memory',
      true,
      jsonb_build_object(
        'memory_type', NEW.memory_type,
        'confidence_score', NEW.confidence_score,
        'importance_level', NEW.importance_level
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for fund memory entries
DROP TRIGGER IF EXISTS track_fund_memory_access ON public.fund_memory_entries;
CREATE TRIGGER track_fund_memory_access
  AFTER INSERT ON public.fund_memory_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.log_ai_service_interaction();

COMMENT ON TABLE public.data_lineage_log IS 'Tracks data flow between AI services to prevent fund-specific data leakage';
COMMENT ON FUNCTION public.log_ai_service_interaction() IS 'Automatically logs AI service interactions with fund-specific data';