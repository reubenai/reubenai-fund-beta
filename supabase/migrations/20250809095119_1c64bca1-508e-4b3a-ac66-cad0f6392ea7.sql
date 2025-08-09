-- Create missing fund_memory_insights table
CREATE TABLE IF NOT EXISTS public.fund_memory_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fund_id UUID NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL,
  insight_data JSONB NOT NULL DEFAULT '{}',
  confidence_score INTEGER DEFAULT 0,
  source_engines TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fund_memory_insights ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view fund memory insights for their funds" 
ON public.fund_memory_insights 
FOR SELECT 
USING (
  fund_id IN (
    SELECT funds.id FROM funds 
    JOIN fund_members ON funds.id = fund_members.fund_id 
    WHERE fund_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create fund memory insights for their funds" 
ON public.fund_memory_insights 
FOR INSERT 
WITH CHECK (
  fund_id IN (
    SELECT funds.id FROM funds 
    JOIN fund_members ON funds.id = fund_members.fund_id 
    WHERE fund_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update fund memory insights for their funds" 
ON public.fund_memory_insights 
FOR UPDATE 
USING (
  fund_id IN (
    SELECT funds.id FROM funds 
    JOIN fund_members ON funds.id = fund_members.fund_id 
    WHERE fund_members.user_id = auth.uid()
  )
);

-- Add indexes for performance
CREATE INDEX idx_fund_memory_insights_fund_id ON public.fund_memory_insights(fund_id);
CREATE INDEX idx_fund_memory_insights_deal_id ON public.fund_memory_insights(deal_id);
CREATE INDEX idx_fund_memory_insights_insight_type ON public.fund_memory_insights(insight_type);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_fund_memory_insights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_fund_memory_insights_updated_at
BEFORE UPDATE ON public.fund_memory_insights
FOR EACH ROW
EXECUTE FUNCTION public.update_fund_memory_insights_updated_at();

-- Fix the analysis queue processor to handle missing data gracefully
CREATE OR REPLACE FUNCTION public.queue_deal_analysis(
  p_deal_id UUID,
  p_priority TEXT DEFAULT 'normal',
  p_force_reanalysis BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  existing_analysis RECORD;
  queue_result JSONB;
BEGIN
  -- Check if analysis already exists and is recent (unless forcing)
  IF NOT p_force_reanalysis THEN
    SELECT * INTO existing_analysis
    FROM analysis_queue 
    WHERE deal_id = p_deal_id 
    AND status IN ('processing', 'completed')
    AND updated_at > (now() - INTERVAL '1 hour');
    
    IF FOUND THEN
      RETURN jsonb_build_object(
        'success', true,
        'message', 'Analysis already exists or in progress',
        'queue_id', existing_analysis.id,
        'status', existing_analysis.status
      );
    END IF;
  END IF;
  
  -- Remove any existing queue entries for this deal
  DELETE FROM analysis_queue WHERE deal_id = p_deal_id;
  
  -- Insert new queue entry with proper error handling
  INSERT INTO analysis_queue (deal_id, priority, status, metadata)
  VALUES (
    p_deal_id, 
    p_priority, 
    'queued',
    jsonb_build_object(
      'force_reanalysis', p_force_reanalysis,
      'queued_at', now(),
      'engines_to_run', ARRAY[
        'market-research-engine',
        'financial-engine', 
        'team-research-engine',
        'product-ip-engine',
        'thesis-alignment-engine'
      ]
    )
  )
  RETURNING id, status INTO existing_analysis;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Deal queued for analysis',
    'queue_id', existing_analysis.id,
    'status', existing_analysis.status,
    'priority', p_priority
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'message', 'Failed to queue deal for analysis'
  );
END;
$$;