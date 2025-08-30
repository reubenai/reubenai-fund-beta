-- Fix the trigger function to use valid activity type
CREATE OR REPLACE FUNCTION trigger_linkedin_profile_enrichment_on_deal_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if founder field is not null and not empty
  IF NEW.founder IS NOT NULL AND trim(NEW.founder) != '' THEN
    
    -- Parse founder name into first and last name
    DECLARE
      name_parts TEXT[];
      first_name_val TEXT := '';
      last_name_val TEXT := '';
    BEGIN
      -- Split name by spaces and get parts
      name_parts := string_to_array(trim(NEW.founder), ' ');
      
      IF array_length(name_parts, 1) >= 1 THEN
        first_name_val := name_parts[1];
      END IF;
      
      IF array_length(name_parts, 1) >= 2 THEN
        last_name_val := name_parts[array_length(name_parts, 1)];
      END IF;
      
      -- Insert enrichment record
      INSERT INTO public.deal2_enrichment_linkedin_profile_export (
        deal_id,
        founder_name,
        first_name,
        last_name,
        processing_status
      ) VALUES (
        NEW.id,
        NEW.founder,
        first_name_val,
        last_name_val,
        'queued'
      );
      
      -- Log activity using valid activity type
      INSERT INTO public.activity_events (
        user_id,
        fund_id,
        deal_id,
        activity_type,
        title,
        description,
        context_data
      ) VALUES (
        COALESCE(NEW.created_by, '00000000-0000-0000-0000-000000000000'),
        NEW.fund_id,
        NEW.id,
        'deal_created', -- Using valid activity type instead of 'enrichment_queued'
        'LinkedIn Profile Enrichment Queued',
        'LinkedIn profile enrichment queued for founder: ' || NEW.founder,
        jsonb_build_object(
          'founder_name', NEW.founder,
          'first_name', first_name_val,
          'last_name', last_name_val,
          'enrichment_type', 'linkedin_profile',
          'auto_queued', true
        )
      );
      
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';