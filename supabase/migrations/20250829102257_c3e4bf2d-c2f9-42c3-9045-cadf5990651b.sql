-- Manually update Panggilin engine tracking status to reflect actual completion
UPDATE engine_completion_tracking 
SET 
  perplexity_company_status = 'complete',
  perplexity_market_status = 'complete', 
  completed_engines = ARRAY['perplexity_company', 'perplexity_market'],
  overall_status = 'monitoring',
  updated_at = now()
WHERE deal_id = '0c5d6f85-f7e8-4e6e-bba1-28b231d1d388';