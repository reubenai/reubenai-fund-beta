-- Phase 1: Remove conflicting trigger and function that expects old 'triggered' status
DROP TRIGGER IF EXISTS trigger_linkedin_profile_post_process ON deal2_enrichment_linkedin_profile_export;
DROP FUNCTION IF EXISTS trigger_linkedin_profile_post_process();

-- Phase 2: Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Phase 3: Create automated cron job to process LinkedIn profile enrichment queue every 10 minutes
SELECT cron.schedule(
  'linkedin-profile-enrichment-queue-processor',
  '*/10 * * * *', -- every 10 minutes
  $$
  SELECT
    net.http_post(
        url:='https://bueuioozcgmedkuxawju.supabase.co/functions/v1/linkedin-profile-enrichment-queue-processor',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1ZXVpb296Y2dtZWRrdXhhd2p1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkyMDY0NSwiZXhwIjoyMDY5NDk2NjQ1fQ.w7dCBbWCRq8kO6t9gr0NbH9qYo4Y_3A6fYf9PknD5PQ"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);

-- Phase 4: Add helpful function to manually trigger queue processing if needed
CREATE OR REPLACE FUNCTION manually_trigger_linkedin_profile_queue()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://bueuioozcgmedkuxawju.supabase.co/functions/v1/linkedin-profile-enrichment-queue-processor',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1ZXVpb296Y2dtZWRrdXhhd2p1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkyMDY0NSwiZXhwIjoyMDY5NDk2NjQ1fQ.w7dCBbWCRq8kO6t9gr0NbH9qYo4Y_3A6fYf9PknD5PQ"}'::jsonb,
    body := '{"manual_trigger": true}'::jsonb
  );
END;
$$;