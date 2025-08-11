-- Create only missing tables for Fund Memory functionality

-- Memory prompt triggers table (only if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'memory_prompt_triggers') THEN
    CREATE TABLE public.memory_prompt_triggers (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      fund_id UUID NOT NULL,
      trigger_type TEXT NOT NULL,
      prompt_template TEXT,
      effectiveness_score INTEGER DEFAULT 75,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );

    -- Enable RLS
    ALTER TABLE public.memory_prompt_triggers ENABLE ROW LEVEL SECURITY;

    -- Create policies for memory prompt triggers
    CREATE POLICY "Users can manage memory triggers for accessible funds" 
    ON public.memory_prompt_triggers 
    FOR ALL 
    USING (user_can_access_fund(fund_id))
    WITH CHECK (user_can_access_fund(fund_id));
  END IF;
END $$;

-- Insert some sample memory triggers for testing
INSERT INTO public.memory_prompt_triggers (fund_id, trigger_type, prompt_template, effectiveness_score) 
SELECT 
  id,
  'similar_deal',
  'Based on previous similar deals in {industry}, consider {key_factor}',
  85
FROM public.funds 
WHERE is_active = true
ON CONFLICT DO NOTHING;

INSERT INTO public.memory_prompt_triggers (fund_id, trigger_type, prompt_template, effectiveness_score) 
SELECT 
  id,
  'risk_pattern',
  'Historical risk pattern detected: {risk_type}. Review mitigation strategies.',
  78
FROM public.funds 
WHERE is_active = true
ON CONFLICT DO NOTHING;