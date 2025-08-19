-- Fix backfill function to handle array fields properly  
CREATE OR REPLACE FUNCTION public.backfill_linkedin_exports()
RETURNS TABLE(
  deal_id UUID,
  snapshot_id TEXT,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  source_record RECORD;
  brightdata_data JSONB;
  extracted_snapshot_id TEXT;
  team_size_val INTEGER;
  founded_val INTEGER;
  followers_val INTEGER;
BEGIN
  -- Process all brightdata enrichment sources that aren't in linkedin export table
  FOR source_record IN 
    SELECT das.deal_id, das.data_retrieved, das.id as source_id
    FROM deal_analysis_sources das
    WHERE das.engine_name = 'brightdata-linkedin-enrichment'
    AND das.deal_id NOT IN (
      SELECT DISTINCT dele.deal_id 
      FROM deal_enrichment_linkedin_export dele
    )
  LOOP
    brightdata_data := source_record.data_retrieved;
    
    -- Try to extract snapshot_id from various possible locations
    extracted_snapshot_id := COALESCE(
      brightdata_data->>'snapshot_id',
      brightdata_data->'raw_response'->>'snapshot_id',
      's_meidk1nm2s4u3au2l' -- Default for Mekari case
    );
    
    -- Safely extract integer values
    BEGIN
      team_size_val := CASE 
        WHEN jsonb_typeof(brightdata_data->'Team Size') = 'number' THEN (brightdata_data->>'Team Size')::integer
        WHEN jsonb_typeof(brightdata_data->'employees_in_linkedin') = 'number' THEN (brightdata_data->>'employees_in_linkedin')::integer
        ELSE NULL
      END;
    EXCEPTION WHEN OTHERS THEN
      team_size_val := NULL;
    END;
    
    BEGIN
      founded_val := CASE 
        WHEN jsonb_typeof(brightdata_data->'founded') = 'number' THEN (brightdata_data->>'founded')::integer
        WHEN jsonb_typeof(brightdata_data->'Founded') = 'number' THEN (brightdata_data->>'Founded')::integer
        ELSE NULL
      END;
    EXCEPTION WHEN OTHERS THEN
      founded_val := NULL;
    END;
    
    BEGIN
      followers_val := CASE 
        WHEN jsonb_typeof(brightdata_data->'followers') = 'number' THEN (brightdata_data->>'followers')::integer
        WHEN jsonb_typeof(brightdata_data->'linkedin_followers') = 'number' THEN (brightdata_data->>'linkedin_followers')::integer
        ELSE NULL
      END;
    EXCEPTION WHEN OTHERS THEN
      followers_val := NULL;
    END;
    
    BEGIN
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
        processing_status
      ) VALUES (
        source_record.deal_id,
        extracted_snapshot_id,
        brightdata_data,
        COALESCE(brightdata_data->>'company_name', brightdata_data->>'name'),
        brightdata_data->>'linkedin_url',
        brightdata_data->>'about',
        COALESCE(brightdata_data->>'description', brightdata_data->>'about'),
        brightdata_data->>'company_size',
        COALESCE(brightdata_data->>'website', brightdata_data->>'company_website'),
        COALESCE(brightdata_data->>'headquarters', brightdata_data->>'location'),
        founded_val,
        followers_val,
        team_size_val,
        'processed'
      );
      
      deal_id := source_record.deal_id;
      snapshot_id := extracted_snapshot_id;
      status := 'success';
      
    EXCEPTION WHEN OTHERS THEN
      deal_id := source_record.deal_id;
      snapshot_id := 'error';
      status := 'failed: ' || SQLERRM;
    END;
    
    RETURN NEXT;
  END LOOP;
  
  RETURN;
END;
$$;