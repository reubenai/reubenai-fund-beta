-- Create missing tiket.com export record from existing analysis data
DO $$
DECLARE
  tiket_data JSONB;
  tiket_deal_id UUID;
  raw_response JSONB;
BEGIN
  -- Get tiket.com's deal data and extract raw_response
  SELECT das.deal_id, das.data_retrieved INTO tiket_deal_id, tiket_data
  FROM deal_analysis_sources das
  JOIN deals d ON das.deal_id = d.id
  WHERE d.company_name ILIKE '%tiket%'
  AND das.engine_name = 'brightdata-linkedin-enrichment'
  LIMIT 1;
  
  -- Extract raw_response from the nested structure
  raw_response := tiket_data->'raw_response';
  
  -- Check if data exists and insert if missing
  IF tiket_deal_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM deal_enrichment_linkedin_export WHERE deal_id = tiket_deal_id
  ) THEN
    INSERT INTO public.deal_enrichment_linkedin_export (
      deal_id,
      snapshot_id,
      raw_brightdata_response,
      company_name,
      linkedin_url,
      about,
      description,
      company_size,
      website,
      headquarters,
      founded,
      followers,
      employees_in_linkedin,
      processing_status,
      created_at,
      updated_at
    ) VALUES (
      tiket_deal_id,
      's_meijnvvn7h2nys1im',
      COALESCE(raw_response, tiket_data),
      COALESCE(tiket_data->>'company_name', 'tiket.com'),
      'https://www.linkedin.com/company/tiket-com/',
      COALESCE(raw_response->0->>'about', tiket_data->>'description'),
      COALESCE(raw_response->0->>'about', tiket_data->>'description'),
      raw_response->0->>'company_size',
      raw_response->0->>'website',
      COALESCE(raw_response->0->>'headquarters', tiket_data->>'Headquarters'),
      COALESCE((raw_response->0->>'founded')::integer, (tiket_data->>'Founded')::integer),
      COALESCE((raw_response->0->>'followers')::integer, (tiket_data->>'linkedin_followers')::integer),
      (raw_response->0->>'employees_in_linkedin')::integer,
      'processed',
      now(),
      now()
    );
    
    RAISE NOTICE 'Successfully inserted tiket.com LinkedIn export data for deal_id: %', tiket_deal_id;
  ELSE
    RAISE NOTICE 'tiket.com data already exists or not found. Deal ID: %', tiket_deal_id;
  END IF;
END $$;