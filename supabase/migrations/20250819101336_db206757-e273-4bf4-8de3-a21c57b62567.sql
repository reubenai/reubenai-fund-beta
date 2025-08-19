-- Phase 1: Fix RLS policies for deal_enrichment_linkedin_export to allow service operations
CREATE POLICY "Services can insert LinkedIn exports via service role"
ON public.deal_enrichment_linkedin_export
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Services can update LinkedIn exports via service role"  
ON public.deal_enrichment_linkedin_export
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Phase 4: Create backfill function for existing enrichment data
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
    
    -- Extract snapshot_id from the data
    IF brightdata_data ? 'snapshot_id' THEN
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
          COALESCE(brightdata_data->>'snapshot_id', 'unknown'),
          brightdata_data,
          brightdata_data->>'company_name',
          brightdata_data->>'linkedin_url',
          brightdata_data->>'about',
          brightdata_data->>'description', 
          brightdata_data->>'company_size',
          brightdata_data->>'website',
          brightdata_data->>'headquarters',
          COALESCE((brightdata_data->>'founded')::integer, NULL),
          COALESCE((brightdata_data->>'followers')::integer, NULL),
          COALESCE((brightdata_data->>'employees_in_linkedin')::integer, NULL),
          'processed'
        );
        
        insert_success := true;
        deal_id := source_record.deal_id;
        snapshot_id := COALESCE(brightdata_data->>'snapshot_id', 'unknown');
        status := 'success';
        
      EXCEPTION WHEN OTHERS THEN
        deal_id := source_record.deal_id;
        snapshot_id := 'error';
        status := 'failed: ' || SQLERRM;
      END;
      
      RETURN NEXT;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$;