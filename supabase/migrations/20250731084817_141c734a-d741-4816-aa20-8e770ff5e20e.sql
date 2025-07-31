-- Create pipeline_stages table for customizable deal stages
CREATE TABLE public.pipeline_stages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fund_id uuid NOT NULL,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#6B7280',
  position integer NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;

-- Create policies for pipeline stages
CREATE POLICY "Users can view pipeline stages for accessible funds" 
ON public.pipeline_stages 
FOR SELECT 
USING (fund_id IN ( 
  SELECT f.id
  FROM funds f
  JOIN profiles p ON f.organization_id = p.organization_id
  WHERE p.user_id = auth.uid()
));

CREATE POLICY "Users can manage pipeline stages with proper access" 
ON public.pipeline_stages 
FOR ALL
USING (fund_id IN ( 
  SELECT f.id
  FROM funds f
  JOIN profiles p ON f.organization_id = p.organization_id
  WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'fund_manager')
));

-- Add trigger for updated_at
CREATE TRIGGER update_pipeline_stages_updated_at
  BEFORE UPDATE ON public.pipeline_stages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default stages for existing funds
INSERT INTO public.pipeline_stages (fund_id, name, color, position, is_default)
SELECT 
  f.id,
  stage_data.name,
  stage_data.color,
  stage_data.position,
  true
FROM funds f
CROSS JOIN (
  VALUES 
    ('Sourced', '#6B7280', 0),
    ('Screening', '#F59E0B', 1),
    ('Due Diligence', '#3B82F6', 2),
    ('Investment Committee', '#8B5CF6', 3),
    ('Approved', '#10B981', 4),
    ('Invested', '#059669', 5),
    ('Rejected', '#EF4444', 6)
) AS stage_data(name, color, position);

-- Add index for performance
CREATE INDEX idx_pipeline_stages_fund_position ON public.pipeline_stages(fund_id, position);

-- Add constraint to ensure unique positions per fund
ALTER TABLE public.pipeline_stages 
ADD CONSTRAINT unique_fund_position UNIQUE (fund_id, position);