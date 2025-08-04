-- Create default pipeline stages for existing funds that don't have stages
INSERT INTO public.pipeline_stages (fund_id, name, color, position, is_default)
SELECT 
  f.id as fund_id,
  stage_name,
  stage_color,
  stage_position,
  true as is_default
FROM funds f
CROSS JOIN (
  VALUES 
    ('Sourced', '#6B7280', 0),
    ('Initial Review', '#3B82F6', 1),
    ('Due Diligence', '#F59E0B', 2),
    ('Investment Committee', '#8B5CF6', 3),
    ('Offer Negotiation', '#EF4444', 4),
    ('Closed', '#10B981', 5),
    ('Passed', '#6B7280', 6)
) AS default_stages(stage_name, stage_color, stage_position)
WHERE NOT EXISTS (
  SELECT 1 FROM pipeline_stages ps 
  WHERE ps.fund_id = f.id
);