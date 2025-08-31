-- Enable pg_cron and pg_net extensions for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a scheduled job to process VC queue every 3 minutes
SELECT cron.schedule(
  'vc-queue-processor-auto',
  '*/3 * * * *', -- Every 3 minutes
  $$
  SELECT
    net.http_post(
        url:='https://bueuioozcgmedkuxawju.supabase.co/functions/v1/vc-queue-processor',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1ZXVpb296Y2dtZWRrdXhhd2p1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkyMDY0NSwiZXhwIjoyMDY5NDk2NjQ1fQ.xG6vI9lBx_4SIGiSdSGahtSaUu0E2Cp5KJl3d32B6kU"}'::jsonb,
        body:='{"source": "cron_scheduler"}'::jsonb
    ) as request_id;
  $$
);

-- Log the cron job creation
INSERT INTO public.activity_events (
  user_id,
  fund_id,
  activity_type,
  title,
  description,
  context_data
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440000',
  'system_configured',
  'VC Queue Auto-Processor Enabled',
  'Automated VC data aggregation processing every 3 minutes',
  jsonb_build_object(
    'cron_schedule', '*/3 * * * *',
    'function_name', 'vc-queue-processor',
    'bypass_universal_processor', true
  )
);