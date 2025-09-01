-- Remove the LinkedIn profile enrichment cron job
SELECT cron.unschedule('linkedin-profile-enrichment-queue-processor');