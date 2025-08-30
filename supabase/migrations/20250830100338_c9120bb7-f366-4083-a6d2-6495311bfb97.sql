-- Create the trigger function to sync employee_count from deal_analysis_datapoints_vc to deals
CREATE OR REPLACE FUNCTION sync_employee_count_to_deals()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if employee_count actually changed
  IF OLD.employee_count IS DISTINCT FROM NEW.employee_count THEN
    -- Update the deals table
    UPDATE public.deals 
    SET 
      employee_count = NEW.employee_count::text,
      updated_at = now()
    WHERE id = NEW.deal_id;
    
    -- Log if no rows were affected (deal not found)
    IF NOT FOUND THEN
      RAISE WARNING 'Deal ID % not found when syncing employee_count', NEW.deal_id;
    END IF;
  END IF;
  
  -- Return NEW to allow the original update to proceed
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER sync_employee_count_trigger
  AFTER UPDATE OF employee_count ON deal_analysis_datapoints_vc
  FOR EACH ROW
  EXECUTE FUNCTION sync_employee_count_to_deals();