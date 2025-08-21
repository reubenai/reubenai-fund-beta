-- Fix RLS policies for investment_strategies_v2 table
-- The issue is that organization_id is not being populated and RLS policies are missing

-- First, add a trigger to populate organization_id from the fund
CREATE OR REPLACE FUNCTION public.populate_investment_strategy_v2_organization_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Populate organization_id from the associated fund
  SELECT organization_id INTO NEW.organization_id
  FROM public.funds 
  WHERE id = NEW.fund_id;
  
  IF NEW.organization_id IS NULL THEN
    RAISE EXCEPTION 'Fund not found or missing organization_id for fund_id: %', NEW.fund_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger to populate organization_id on insert/update
DROP TRIGGER IF EXISTS trigger_populate_investment_strategy_v2_organization_id ON public.investment_strategies_v2;
CREATE TRIGGER trigger_populate_investment_strategy_v2_organization_id
  BEFORE INSERT OR UPDATE ON public.investment_strategies_v2
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_investment_strategy_v2_organization_id();

-- Add proper RLS policies for investment_strategies_v2
DROP POLICY IF EXISTS "Users can manage strategies for their organization" ON public.investment_strategies_v2;
DROP POLICY IF EXISTS "Super admins can manage all strategies v2" ON public.investment_strategies_v2;

CREATE POLICY "Users can manage strategies for their organization" 
ON public.investment_strategies_v2 
FOR ALL 
USING (organization_id = get_jwt_org_id())
WITH CHECK (organization_id = get_jwt_org_id());

CREATE POLICY "Super admins can manage all strategies v2" 
ON public.investment_strategies_v2 
FOR ALL 
USING (is_super_admin_by_email())
WITH CHECK (is_super_admin_by_email());