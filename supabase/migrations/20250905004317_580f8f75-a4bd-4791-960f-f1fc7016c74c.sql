-- Insert Dify webhook configuration for the Reuben organization
INSERT INTO public.webhook_configs (
  organization_id,
  fund_id,
  service_name,
  webhook_url,
  is_active,
  config_data,
  created_at,
  updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  '1fbf40e1-9307-4399-b3c5-8034d7cdbfde'::uuid, -- Reuben Fund 1
  'dify',
  'https://jw0v1fb9br017jaw.ai-plugin.io/workflow/a531e20a-3fb8-4f5c-bf46-ac521e3e86e8',
  true,
  '{
    "description": "Dify AI Workflow Integration",
    "triggers": ["deal_created"],
    "retry_attempts": 3,
    "timeout_seconds": 30
  }'::jsonb,
  now(),
  now()
);