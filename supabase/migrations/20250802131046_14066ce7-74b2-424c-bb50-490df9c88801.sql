-- Create table for storing deal analysis sources from web research and other engines
CREATE TABLE IF NOT EXISTS public.deal_analysis_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL,
  engine_name TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_url TEXT,
  confidence_score INTEGER DEFAULT 50,
  data_snippet TEXT,
  validated BOOLEAN DEFAULT false,
  data_retrieved JSONB DEFAULT '{}',
  retrieved_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.deal_analysis_sources ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for deal analysis sources
CREATE POLICY "Users can view sources for deals in their organization" 
ON public.deal_analysis_sources 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.deals d
    JOIN public.funds f ON d.fund_id = f.id
    JOIN public.profiles p ON f.organization_id = p.organization_id
    WHERE d.id = deal_analysis_sources.deal_id 
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert sources for deals in their organization" 
ON public.deal_analysis_sources 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.deals d
    JOIN public.funds f ON d.fund_id = f.id
    JOIN public.profiles p ON f.organization_id = p.organization_id
    WHERE d.id = deal_analysis_sources.deal_id 
    AND p.user_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX idx_deal_analysis_sources_deal_id ON public.deal_analysis_sources(deal_id);
CREATE INDEX idx_deal_analysis_sources_engine_name ON public.deal_analysis_sources(engine_name);
CREATE INDEX idx_deal_analysis_sources_source_type ON public.deal_analysis_sources(source_type);
CREATE INDEX idx_deal_analysis_sources_confidence ON public.deal_analysis_sources(confidence_score);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_deal_analysis_sources_updated_at
BEFORE UPDATE ON public.deal_analysis_sources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();