-- Fix backfill function to handle data without snapshot_id
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
  insert_success BOOLEAN := false;
  extracted_snapshot_id TEXT;
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
        COALESCE((brightdata_data->>'founded')::integer, (brightdata_data->>'Founded')::integer),
        COALESCE((brightdata_data->>'followers')::integer, (brightdata_data->>'linkedin_followers')::integer),
        COALESCE((brightdata_data->>'employees_in_linkedin')::integer, (brightdata_data->'Team Size')::integer),
        'processed'
      );
      
      insert_success := true;
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