-- Fix function search path security warnings
-- Update all functions to have secure search_path settings

-- Function 1: create_default_investment_strategy
CREATE OR REPLACE FUNCTION public.create_default_investment_strategy(fund_id_param uuid, fund_type_param fund_type)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  strategy_id uuid;
  default_criteria jsonb;
BEGIN
  -- Define default enhanced criteria based on fund type
  IF fund_type_param = 'venture_capital' THEN
    default_criteria := '{
      "categories": [
        {
          "name": "Market Opportunity",
          "weight": 25,
          "enabled": true,
          "subcategories": [
            {"name": "Market Size", "weight": 30, "enabled": true},
            {"name": "Growth Rate", "weight": 25, "enabled": true},
            {"name": "Market Dynamics", "weight": 25, "enabled": true},
            {"name": "Competitive Landscape", "weight": 20, "enabled": true}
          ]
        },
        {
          "name": "Product & Technology",
          "weight": 25,
          "enabled": true,
          "subcategories": [
            {"name": "Product Innovation", "weight": 30, "enabled": true},
            {"name": "Technology Advantage", "weight": 25, "enabled": true},
            {"name": "IP & Patents", "weight": 20, "enabled": true},
            {"name": "Development Stage", "weight": 25, "enabled": true}
          ]
        },
        {
          "name": "Team & Leadership",
          "weight": 25,
          "enabled": true,
          "subcategories": [
            {"name": "Founder Quality", "weight": 35, "enabled": true},
            {"name": "Team Experience", "weight": 25, "enabled": true},
            {"name": "Advisory Board", "weight": 20, "enabled": true},
            {"name": "Cultural Fit", "weight": 20, "enabled": true}
          ]
        },
        {
          "name": "Financial & Traction",
          "weight": 25,
          "enabled": true,
          "subcategories": [
            {"name": "Revenue Growth", "weight": 30, "enabled": true},
            {"name": "Unit Economics", "weight": 25, "enabled": true},
            {"name": "Customer Acquisition", "weight": 25, "enabled": true},
            {"name": "Financial Projections", "weight": 20, "enabled": true}
          ]
        }
      ]
    }';
  ELSE -- PE fund (private_equity)
    default_criteria := '{
      "categories": [
        {
          "name": "Financial Performance",
          "weight": 25,
          "enabled": true,
          "subcategories": [
            {"name": "Revenue Growth", "weight": 30, "enabled": true},
            {"name": "Profitability", "weight": 25, "enabled": true},
            {"name": "Cash Flow", "weight": 25, "enabled": true},
            {"name": "Financial Stability", "weight": 20, "enabled": true}
          ]
        },
        {
          "name": "Market Position",
          "weight": 25,
          "enabled": true,
          "subcategories": [
            {"name": "Market Share", "weight": 30, "enabled": true},
            {"name": "Competitive Advantage", "weight": 25, "enabled": true},
            {"name": "Brand Strength", "weight": 25, "enabled": true},
            {"name": "Customer Base", "weight": 20, "enabled": true}
          ]
        },
        {
          "name": "Operational Excellence",
          "weight": 25,
          "enabled": true,
          "subcategories": [
            {"name": "Management Team", "weight": 30, "enabled": true},
            {"name": "Operational Efficiency", "weight": 25, "enabled": true},
            {"name": "Process Quality", "weight": 25, "enabled": true},
            {"name": "Technology Systems", "weight": 20, "enabled": true}
          ]
        },
        {
          "name": "Growth Potential",
          "weight": 25,
          "enabled": true,
          "subcategories": [
            {"name": "Market Expansion", "weight": 30, "enabled": true},
            {"name": "Product Development", "weight": 25, "enabled": true},
            {"name": "Value Creation", "weight": 25, "enabled": true},
            {"name": "Exit Strategy", "weight": 20, "enabled": true}
          ]
        }
      ]
    }';
  END IF;

  -- Insert default investment strategy (without triggering activity logging for initial creation)
  INSERT INTO public.investment_strategies (
    fund_id,
    fund_type,
    industries,
    geography,
    key_signals,
    exciting_threshold,
    promising_threshold,
    needs_development_threshold,
    strategy_notes,
    enhanced_criteria
  ) VALUES (
    fund_id_param,
    CASE 
      WHEN fund_type_param = 'venture_capital' THEN 'vc'
      WHEN fund_type_param = 'private_equity' THEN 'pe'
      ELSE 'vc'
    END,
    ARRAY['Technology', 'Healthcare', 'Financial Services'],
    ARRAY['North America', 'Europe'],
    ARRAY['Strong team', 'Large market', 'Proven traction'],
    85,
    70,
    50,
    'Default investment strategy - please customize based on your fund''s focus',
    default_criteria
  )
  RETURNING id INTO strategy_id;

  RETURN strategy_id;
END;
$function$;

-- Function 2: invalidate_deal_analyses_on_strategy_change
CREATE OR REPLACE FUNCTION public.invalidate_deal_analyses_on_strategy_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Mark all deal analyses for this fund as needing re-analysis
  UPDATE public.deal_analyses 
  SET analysis_version = analysis_version + 1,
      updated_at = now()
  WHERE deal_id IN (
    SELECT id FROM public.deals WHERE fund_id = NEW.fund_id
  );
  
  -- Log the strategy change (only for updates, not initial creation)
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.activity_events (
      user_id,
      fund_id,
      activity_type,
      title,
      description,
      context_data
    ) VALUES (
      auth.uid(),
      NEW.fund_id,
      'criteria_updated',
      'Investment Strategy Updated',
      'Investment strategy criteria and thresholds have been updated',
      jsonb_build_object(
        'strategy_id', NEW.id,
        'fund_type', NEW.fund_type,
        'updated_fields', jsonb_build_object(
          'enhanced_criteria_changed', OLD.enhanced_criteria != NEW.enhanced_criteria,
          'thresholds_changed', 
            OLD.exciting_threshold != NEW.exciting_threshold OR
            OLD.promising_threshold != NEW.promising_threshold OR
            OLD.needs_development_threshold != NEW.needs_development_threshold
        )
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Function 3: handle_new_fund
CREATE OR REPLACE FUNCTION public.handle_new_fund()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Create default investment strategy for the new fund
  PERFORM create_default_investment_strategy(NEW.id, NEW.fund_type);
  RETURN NEW;
END;
$function$;

-- Function 4: get_user_role
CREATE OR REPLACE FUNCTION public.get_user_role()
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  IF public.is_reuben_admin() THEN
    RETURN 'super_admin';
  END IF;
  
  RETURN (
    SELECT role::text FROM public.profiles 
    WHERE user_id = auth.uid() 
    LIMIT 1
  );
END;
$function$;

-- Function 5: can_edit_fund_data
CREATE OR REPLACE FUNCTION public.can_edit_fund_data()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  user_role_value text;
BEGIN
  user_role_value := public.get_user_role_simple();
  RETURN user_role_value IN ('super_admin', 'admin', 'fund_manager', 'analyst');
END;
$function$;

-- Function 6: can_manage_funds
CREATE OR REPLACE FUNCTION public.can_manage_funds()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  user_role_value text;
BEGIN
  user_role_value := public.get_user_role_simple();
  RETURN user_role_value IN ('super_admin', 'admin', 'fund_manager');
END;
$function$;

-- Function 7: is_reuben_admin
CREATE OR REPLACE FUNCTION public.is_reuben_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  -- ONLY use email check - no profile table queries to prevent recursion
  SELECT (auth.email() LIKE '%@goreuben.com' OR auth.email() LIKE '%@reuben.com');
$function$;

-- Function 8: can_create_funds
CREATE OR REPLACE FUNCTION public.can_create_funds()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  user_role_value text;
BEGIN
  user_role_value := public.get_user_role_simple();
  RETURN user_role_value IN ('super_admin', 'admin', 'fund_manager');
END;
$function$;

-- Function 9: has_document_management_access
CREATE OR REPLACE FUNCTION public.has_document_management_access()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  user_role_value text;
BEGIN
  user_role_value := public.get_user_role_simple();
  RETURN user_role_value IN ('super_admin', 'admin', 'fund_manager', 'analyst');
END;
$function$;

-- Function 10: get_user_role_simple
CREATE OR REPLACE FUNCTION public.get_user_role_simple()
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  user_role_value text;
BEGIN
  -- Check if this is a Reuben admin first (no profile lookup needed)
  IF (auth.email() LIKE '%@goreuben.com' OR auth.email() LIKE '%@reuben.com') THEN
    RETURN 'super_admin';
  END IF;
  
  -- Get role from profiles table
  SELECT role::text INTO user_role_value
  FROM public.profiles 
  WHERE user_id = auth.uid();
  
  RETURN COALESCE(user_role_value, 'viewer');
END;
$function$;

-- Function 11: can_manage_users
CREATE OR REPLACE FUNCTION public.can_manage_users()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  user_role_value text;
BEGIN
  user_role_value := public.get_user_role_simple();
  RETURN user_role_value = 'super_admin';
END;
$function$;

-- Function 12: can_create_ic_meetings
CREATE OR REPLACE FUNCTION public.can_create_ic_meetings()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  user_role_value text;
BEGIN
  user_role_value := public.get_user_role_simple();
  RETURN user_role_value IN ('super_admin', 'admin', 'fund_manager');
END;
$function$;

-- Function 13: update_activity_searchable_content
CREATE OR REPLACE FUNCTION public.update_activity_searchable_content()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = 'public'
AS $function$
BEGIN
  NEW.searchable_content = concat_ws(' ', 
    NEW.title, 
    NEW.description,
    array_to_string(NEW.tags, ' '),
    NEW.context_data->>'company_name',
    NEW.context_data->>'industry',
    NEW.context_data->>'stage_from',
    NEW.context_data->>'stage_to'
  );
  RETURN NEW;
END;
$function$;

-- Function 14: is_admin_by_email
CREATE OR REPLACE FUNCTION public.is_admin_by_email()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT (auth.email() LIKE '%@goreuben.com' OR auth.email() LIKE '%@reuben.com');
$function$;

-- Function 15: set_user_role
CREATE OR REPLACE FUNCTION public.set_user_role(user_email text, new_role user_role, org_id uuid DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  target_user_id uuid;
BEGIN
  -- Find user by email
  SELECT user_id INTO target_user_id
  FROM public.profiles
  WHERE email = user_email;
  
  -- If user exists, update their role and organization
  IF target_user_id IS NOT NULL THEN
    UPDATE public.profiles
    SET 
      role = new_role,
      organization_id = org_id,
      updated_at = now()
    WHERE user_id = target_user_id;
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$function$;

-- Function 16: update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Function 17: populate_deal_document_relations
CREATE OR REPLACE FUNCTION public.populate_deal_document_relations()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Get organization_id and fund_id from the associated deal
  SELECT f.organization_id, d.fund_id
  INTO NEW.organization_id, NEW.fund_id
  FROM deals d
  JOIN funds f ON d.fund_id = f.id
  WHERE d.id = NEW.deal_id;
  
  RETURN NEW;
END;
$function$;

-- Function 18: handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  invited_role text;
  invited_org_id uuid;
BEGIN
  -- Extract invitation metadata if present
  invited_role := COALESCE(
    NEW.raw_user_meta_data ->> 'invited_role', 
    'viewer'
  );
  
  invited_org_id := COALESCE(
    (NEW.raw_user_meta_data ->> 'invited_organization_id')::uuid,
    CASE 
      WHEN NEW.email LIKE '%@goreuben.com' OR NEW.email LIKE '%@reuben.com' THEN 
        '550e8400-e29b-41d4-a716-446655440000'::uuid
      ELSE NULL
    END
  );

  -- Check if this is hello@goreuben.com and set as super_admin
  IF NEW.email = 'hello@goreuben.com' THEN
    INSERT INTO public.profiles (user_id, organization_id, email, first_name, last_name, role)
    VALUES (
      NEW.id, 
      '550e8400-e29b-41d4-a716-446655440000',
      NEW.email,
      NEW.raw_user_meta_data ->> 'first_name',
      NEW.raw_user_meta_data ->> 'last_name',
      'super_admin'::user_role
    );
  -- Check if this is the demo user
  ELSIF NEW.email = 'demo@goreuben.com' THEN
    INSERT INTO public.profiles (user_id, organization_id, email, first_name, last_name, role)
    VALUES (
      NEW.id, 
      '550e8400-e29b-41d4-a716-446655440000',
      NEW.email,
      'Demo',
      'User',
      'fund_manager'::user_role
    );
  -- Check if this is a @goreuben.com or @reuben.com email (auto-assign as admin)
  ELSIF NEW.email LIKE '%@goreuben.com' OR NEW.email LIKE '%@reuben.com' THEN
    INSERT INTO public.profiles (user_id, organization_id, email, first_name, last_name, role)
    VALUES (
      NEW.id, 
      '550e8400-e29b-41d4-a716-446655440000',
      NEW.email,
      NEW.raw_user_meta_data ->> 'first_name',
      NEW.raw_user_meta_data ->> 'last_name',
      'admin'::user_role
    );
  ELSE
    -- For invited users or other users, use metadata or defaults
    INSERT INTO public.profiles (user_id, organization_id, email, first_name, last_name, role)
    VALUES (
      NEW.id,
      invited_org_id,
      NEW.email,
      NEW.raw_user_meta_data ->> 'first_name',
      NEW.raw_user_meta_data ->> 'last_name',
      invited_role::user_role
    );
  END IF;
  RETURN NEW;
END;
$function$;