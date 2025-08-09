-- Create missing fund_memory_insights table with correct RLS policies
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

-- Create RLS policies using existing fund access functions
CREATE POLICY "Users can view fund memory insights for accessible funds" 
ON public.fund_memory_insights 
FOR SELECT 
USING (user_can_access_fund(fund_id));

CREATE POLICY "Users can create fund memory insights for manageable funds" 
ON public.fund_memory_insights 
FOR INSERT 
WITH CHECK (user_can_manage_fund(fund_id));

CREATE POLICY "Users can update fund memory insights for manageable funds" 
ON public.fund_memory_insights 
FOR UPDATE 
USING (user_can_manage_fund(fund_id));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_fund_memory_insights_fund_id ON public.fund_memory_insights(fund_id);
CREATE INDEX IF NOT EXISTS idx_fund_memory_insights_deal_id ON public.fund_memory_insights(deal_id);
CREATE INDEX IF NOT EXISTS idx_fund_memory_insights_insight_type ON public.fund_memory_insights(insight_type);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_fund_memory_insights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_fund_memory_insights_updated_at ON public.fund_memory_insights;
CREATE TRIGGER update_fund_memory_insights_updated_at
BEFORE UPDATE ON public.fund_memory_insights
FOR EACH ROW
EXECUTE FUNCTION public.update_fund_memory_insights_updated_at();