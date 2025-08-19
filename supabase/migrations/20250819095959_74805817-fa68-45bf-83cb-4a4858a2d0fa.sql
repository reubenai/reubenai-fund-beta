-- Enable http extension for making API calls from database
CREATE EXTENSION IF NOT EXISTS http;

-- Create function to trigger LinkedIn enrichment when URL changes
CREATE OR REPLACE FUNCTION trigger_linkedin_enrichment()
RETURNS TRIGGER AS $$
DECLARE
  old_url text;
  new_url text;
  http_response http_response;
  request_payload jsonb;
  service_role_key text;
BEGIN
  -- Get old and new LinkedIn URLs
  old_url := COALESCE(OLD.linkedin_url, '');
  new_url := COALESCE(NEW.linkedin_url, '');
  
  -- Only proceed if LinkedIn URL actually changed and new URL is not empty
  IF old_url != new_url AND new_url != '' AND new_url IS NOT NULL THEN
    
    -- Validate LinkedIn URL format (company or organization pages)
    IF new_url ~* '^https?://(www\.)?linkedin\.com/(company|in)/[a-zA-Z0-9\-]+/?.*$' THEN
      
      -- Get service role key from environment (this would need to be set)
      service_role_key := current_setting('app.supabase_service_role_key', true);
      
      -- Prepare API request payload
      request_payload := jsonb_build_object(
        'dealId', NEW.id::text,
        'companyName', NEW.company_name,
        'linkedinUrl', new_url
      );
      
      BEGIN
        -- Call Brightdata enrichment function
        SELECT * INTO http_response
        FROM http((
          'POST',
          'https://bueuioozcgmedkuxawju.supabase.co/functions/v1/brightdata-linkedin-enrichment',
          ARRAY[
            http_header('Content-Type', 'application/json'),
            http_header('Authorization', 'Bearer ' || COALESCE(service_role_key, current_setting('request.jwt.claims', true)::jsonb ->> 'token'))
          ],
          request_payload::text
        )::http_request);
        
        -- Log successful enrichment trigger
        INSERT INTO activity_events (
          user_id, fund_id, deal_id, activity_type, priority,
          title, description, context_data
        ) VALUES (
          COALESCE((current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid, '00000000-0000-0000-0000-000000000000'::uuid),
          NEW.fund_id, NEW.id, 'linkedin_enrichment_triggered', 'medium',
          'LinkedIn URL Updated - Enrichment Triggered',
          'Automatic LinkedIn enrichment started due to URL change',
          jsonb_build_object(
            'old_url', old_url,
            'new_url', new_url,
            'trigger_method', 'database_trigger',
            'http_status', http_response.status,
            'response_preview', left(http_response.content, 200)
          )
        );
        
      EXCEPTION WHEN OTHERS THEN
        -- Log API call error but don't fail the deal update
        INSERT INTO activity_events (
          user_id, fund_id, deal_id, activity_type, priority,
          title, description, context_data
        ) VALUES (
          COALESCE((current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid, '00000000-0000-0000-0000-000000000000'::uuid),
          NEW.fund_id, NEW.id, 'linkedin_enrichment_api_error', 'high',
          'LinkedIn Enrichment API Call Failed',
          'Error occurred while calling LinkedIn enrichment API',
          jsonb_build_object(
            'error_message', SQLERRM,
            'error_state', SQLSTATE,
            'linkedin_url', new_url,
            'old_url', old_url
          )
        );
      END;
      
    ELSE
      -- Log invalid URL format
      INSERT INTO activity_events (
        user_id, fund_id, deal_id, activity_type, priority,
        title, description, context_data
      ) VALUES (
        COALESCE((current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid, '00000000-0000-0000-0000-000000000000'::uuid),
        NEW.fund_id, NEW.id, 'linkedin_url_validation_failed', 'low',
        'Invalid LinkedIn URL Format',
        'LinkedIn URL was updated but format validation failed',
        jsonb_build_object(
          'invalid_url', new_url,
          'old_url', old_url,
          'validation_rule', 'linkedin_url_format',
          'expected_format', 'https://linkedin.com/company/[company-name] or https://linkedin.com/in/[profile-name]'
        )
      );
    END IF;
    
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log general error but don't fail the deal update
  INSERT INTO activity_events (
    user_id, fund_id, deal_id, activity_type, priority,
    title, description, context_data
  ) VALUES (
    COALESCE((current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid, '00000000-0000-0000-0000-000000000000'::uuid),
    NEW.fund_id, NEW.id, 'linkedin_enrichment_trigger_error', 'high',
    'LinkedIn Enrichment Trigger Failed',
    'Unexpected error occurred during automatic LinkedIn enrichment trigger',
    jsonb_build_object(
      'error_message', SQLERRM,
      'error_state', SQLSTATE,
      'linkedin_url', COALESCE(NEW.linkedin_url, 'null'),
      'old_linkedin_url', COALESCE(OLD.linkedin_url, 'null')
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that fires after LinkedIn URL updates
CREATE TRIGGER deals_linkedin_url_change
  AFTER UPDATE OF linkedin_url ON deals
  FOR EACH ROW
  WHEN (OLD.linkedin_url IS DISTINCT FROM NEW.linkedin_url)
  EXECUTE FUNCTION trigger_linkedin_enrichment();

-- Add comment for documentation
COMMENT ON FUNCTION trigger_linkedin_enrichment() IS 
'Automatically triggers LinkedIn enrichment via Brightdata API when a deal''s LinkedIn URL is added or changed. Validates URL format and logs all activities.';

COMMENT ON TRIGGER deals_linkedin_url_change ON deals IS 
'Automatically triggers LinkedIn enrichment when linkedin_url field is updated on deals table.';