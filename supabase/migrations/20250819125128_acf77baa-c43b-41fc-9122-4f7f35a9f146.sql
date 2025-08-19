-- Simply insert Mekari data without ON CONFLICT clause  
DO $$
DECLARE
  mekari_data JSONB;
  mekari_deal_id UUID;
BEGIN
  -- Get Mekari's deal data
  SELECT das.deal_id, das.data_retrieved INTO mekari_deal_id, mekari_data
  FROM deal_analysis_sources das
  JOIN deals d ON das.deal_id = d.id
  WHERE d.company_name ILIKE '%Mekari%'
  AND das.engine_name = 'brightdata-linkedin-enrichment'
  LIMIT 1;
  
  -- Check if data already exists
  IF mekari_deal_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM deal_enrichment_linkedin_export WHERE deal_id = mekari_deal_id
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
      processing_status
    ) VALUES (
      mekari_deal_id,
      's_meidk1nm2s4u3au2l',
      mekari_data,
      COALESCE(mekari_data->>'company_name', mekari_data->>'name', 'Mekari'),
      mekari_data->>'linkedin_url',
      mekari_data->>'about',
      COALESCE(mekari_data->>'description', mekari_data->>'about'),
      mekari_data->>'company_size',
      COALESCE(mekari_data->>'website', mekari_data->>'company_website'),
      COALESCE(mekari_data->>'headquarters', mekari_data->>'location'),
      'processed'
    );
    
    RAISE NOTICE 'Successfully inserted Mekari LinkedIn export data for deal_id: %', mekari_deal_id;
  ELSE
    RAISE NOTICE 'Mekari data already exists or not found. Deal ID: %', mekari_deal_id;
  END IF;
END $$;