-- Fix pipeline stage ordering with proper position swapping
-- Handle the unique constraint by using temporary positions

-- Step 1: Create function to generate default pipeline stages for new funds
CREATE OR REPLACE FUNCTION public.create_default_pipeline_stages(fund_id_param uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert default pipeline stages with correct ordering
  INSERT INTO public.pipeline_stages (fund_id, name, color, position, is_default) VALUES
    (fund_id_param, 'Sourced', '#6B7280', 0, true),
    (fund_id_param, 'Screening', '#F59E0B', 1, true),
    (fund_id_param, 'Investment Committee', '#8B5CF6', 2, true),
    (fund_id_param, 'Due Diligence', '#3B82F6', 3, true),
    (fund_id_param, 'Approved', '#10B981', 4, true),
    (fund_id_param, 'Invested', '#059669', 5, true),
    (fund_id_param, 'Rejected', '#EF4444', 6, true);
END;
$function$;

-- Step 2: Update handle_new_fund trigger to create pipeline stages
CREATE OR REPLACE FUNCTION public.handle_new_fund()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Create default investment strategy for the new fund
  PERFORM create_default_investment_strategy(NEW.id, NEW.fund_type);
  
  -- Create default pipeline stages for the new fund
  PERFORM create_default_pipeline_stages(NEW.id);
  
  RETURN NEW;
END;
$function$;

-- Step 3: Create missing pipeline stages for existing funds that don't have them
DO $$
DECLARE
  fund_record RECORD;
BEGIN
  -- Find funds without pipeline stages
  FOR fund_record IN 
    SELECT f.id 
    FROM public.funds f 
    LEFT JOIN public.pipeline_stages ps ON f.id = ps.fund_id 
    WHERE ps.fund_id IS NULL
  LOOP
    -- Create default pipeline stages for this fund
    PERFORM create_default_pipeline_stages(fund_record.id);
  END LOOP;
END $$;

-- Step 4: Fix existing pipeline stage ordering for all funds
-- Use temporary positions to avoid unique constraint violations
UPDATE public.pipeline_stages SET position = position + 100 WHERE position >= 0;

-- Now set correct positions
UPDATE public.pipeline_stages SET position = 0 WHERE LOWER(name) LIKE '%sourced%';
UPDATE public.pipeline_stages SET position = 1 WHERE LOWER(name) LIKE '%screening%';
UPDATE public.pipeline_stages SET position = 2 WHERE LOWER(name) LIKE '%investment%committee%';
UPDATE public.pipeline_stages SET position = 3 WHERE LOWER(name) LIKE '%due%diligence%';
UPDATE public.pipeline_stages SET position = 4 WHERE LOWER(name) LIKE '%approved%';
UPDATE public.pipeline_stages SET position = 5 WHERE LOWER(name) LIKE '%invested%';
UPDATE public.pipeline_stages SET position = 6 WHERE LOWER(name) LIKE '%rejected%';