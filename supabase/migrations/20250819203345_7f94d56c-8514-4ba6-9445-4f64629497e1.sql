-- Fix Efishery's existing record by post-processing the raw data
DO $$
DECLARE
    efishery_record RECORD;
    raw_data JSONB;
    first_record JSONB;
    specialties_array TEXT[];
BEGIN
    -- Find Efishery's raw record
    SELECT * INTO efishery_record 
    FROM public.deal_enrichment_linkedin_export 
    WHERE company_name = 'eFishery' AND processing_status = 'raw'
    LIMIT 1;
    
    IF FOUND THEN
        -- Extract the first record from raw_brightdata_response
        raw_data := efishery_record.raw_brightdata_response;
        IF raw_data IS NOT NULL AND jsonb_array_length(raw_data) > 0 THEN
            first_record := raw_data->0;
            
            -- Convert specialties string to array
            IF first_record->>'specialties' IS NOT NULL THEN
                SELECT string_to_array(first_record->>'specialties', ',') INTO specialties_array;
                -- Trim whitespace from each element
                SELECT array_agg(trim(unnest)) INTO specialties_array 
                FROM unnest(specialties_array) WHERE trim(unnest) != '';
            ELSE
                specialties_array := ARRAY[]::TEXT[];
            END IF;
            
            -- Update the record with structured data
            UPDATE public.deal_enrichment_linkedin_export 
            SET 
                company_name = COALESCE(first_record->>'name', efishery_record.company_name),
                website = first_record->>'website',
                founded = CASE 
                    WHEN first_record->>'founded' ~ '^\d+$' 
                    THEN (first_record->>'founded')::INTEGER 
                    ELSE NULL 
                END,
                employees = COALESCE(first_record->'employees', '[]'::jsonb),
                headquarters = first_record->>'headquarters',
                industries = first_record->>'industries',
                description = first_record->>'about',
                about = first_record->>'about',
                specialties = specialties_array,
                followers = CASE 
                    WHEN first_record->>'followers' ~ '^\d+$' 
                    THEN (first_record->>'followers')::INTEGER 
                    ELSE NULL 
                END,
                employees_in_linkedin = CASE 
                    WHEN first_record->>'employees_in_linkedin' ~ '^\d+$' 
                    THEN (first_record->>'employees_in_linkedin')::INTEGER 
                    ELSE NULL 
                END,
                updates = COALESCE(first_record->'updates', '[]'::jsonb),
                processing_status = 'processed',
                processed_at = now(),
                updated_at = now()
            WHERE id = efishery_record.id;
            
            RAISE NOTICE 'Successfully post-processed eFishery record with ID: %', efishery_record.id;
        ELSE
            RAISE NOTICE 'No raw Brightdata response found for eFishery record';
        END IF;
    ELSE
        RAISE NOTICE 'No raw eFishery record found to post-process';
    END IF;
END $$;