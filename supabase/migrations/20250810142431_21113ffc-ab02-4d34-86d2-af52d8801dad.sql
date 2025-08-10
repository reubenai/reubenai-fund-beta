-- Phase 1: Universal JWT-Based RLS Migration
-- Replace all recursive RLS policies with direct JWT claims checking

-- First, drop all existing problematic RLS policies on profiles table
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view organization profiles" ON public.profiles;
DROP POLICY IF EXISTS "Fund managers can view org profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_simple" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_simple" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_simple" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_simple" ON public.profiles;
DROP POLICY IF EXISTS "profiles_ultra_simple" ON public.profiles;

-- Create new JWT-based RLS policies for profiles (no recursion)
CREATE POLICY "JWT Super admin access to profiles" 
ON public.profiles 
FOR ALL 
USING (
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@goreuben.com' OR
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@reuben.com'
)
WITH CHECK (
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@goreuben.com' OR
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@reuben.com'
);

CREATE POLICY "JWT User profile access" 
ON public.profiles 
FOR ALL 
USING (
  user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid OR
  organization_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'org_id')::uuid
)
WITH CHECK (
  user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid OR
  organization_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'org_id')::uuid
);

-- Fix activity_events RLS policies to use JWT instead of recursive functions
DROP POLICY IF EXISTS "Users can manage activities for manageable funds and deals" ON public.activity_events;
DROP POLICY IF EXISTS "Users can view activities for accessible funds and deals" ON public.activity_events;

CREATE POLICY "JWT Super admin activity access" 
ON public.activity_events 
FOR ALL 
USING (
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@goreuben.com' OR
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@reuben.com'
)
WITH CHECK (
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@goreuben.com' OR
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@reuben.com'
);

CREATE POLICY "JWT User activity access" 
ON public.activity_events 
FOR ALL 
USING (
  user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid OR
  fund_id IN (
    SELECT f.id FROM public.funds f 
    WHERE f.organization_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'org_id')::uuid
  )
)
WITH CHECK (
  user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid OR
  fund_id IN (
    SELECT f.id FROM public.funds f 
    WHERE f.organization_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'org_id')::uuid
  )
);

-- Create helper function to get user org from JWT (non-recursive)
CREATE OR REPLACE FUNCTION public.jwt_org_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    CASE 
      WHEN (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@goreuben.com' OR
           (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@reuben.com'
      THEN '550e8400-e29b-41d4-a716-446655440000'::uuid
      ELSE (current_setting('request.jwt.claims', true)::jsonb ->> 'org_id')::uuid
    END,
    '550e8400-e29b-41d4-a716-446655440000'::uuid
  );
$$;

-- Create helper function to check if user is super admin from JWT
CREATE OR REPLACE FUNCTION public.jwt_is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@goreuben.com' OR
    (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@reuben.com',
    false
  );
$$;

-- Update deal_notes RLS to use JWT instead of recursive joins
DROP POLICY IF EXISTS "Users can manage deal notes for accessible deals" ON public.deal_notes;
DROP POLICY IF EXISTS "Users can view deal notes for accessible deals" ON public.deal_notes;
DROP POLICY IF EXISTS "reuben_deal_notes_access" ON public.deal_notes;
DROP POLICY IF EXISTS "users_own_deal_notes" ON public.deal_notes;

CREATE POLICY "JWT Super admin deal notes access" 
ON public.deal_notes 
FOR ALL 
USING (jwt_is_super_admin())
WITH CHECK (jwt_is_super_admin());

CREATE POLICY "JWT User deal notes access" 
ON public.deal_notes 
FOR ALL 
USING (
  created_by = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid OR
  deal_id IN (
    SELECT d.id FROM public.deals d 
    JOIN public.funds f ON d.fund_id = f.id 
    WHERE f.organization_id = jwt_org_id()
  )
)
WITH CHECK (
  created_by = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid OR
  deal_id IN (
    SELECT d.id FROM public.deals d 
    JOIN public.funds f ON d.fund_id = f.id 
    WHERE f.organization_id = jwt_org_id()
  )
);

-- Update deal_documents RLS to use JWT
DROP POLICY IF EXISTS "Users can view deal documents for accessible deals" ON public.deal_documents;

CREATE POLICY "JWT Super admin deal documents access" 
ON public.deal_documents 
FOR ALL 
USING (jwt_is_super_admin())
WITH CHECK (jwt_is_super_admin());

CREATE POLICY "JWT User deal documents access" 
ON public.deal_documents 
FOR SELECT 
USING (
  deal_id IN (
    SELECT d.id FROM public.deals d 
    JOIN public.funds f ON d.fund_id = f.id 
    WHERE f.organization_id = jwt_org_id()
  )
);

-- Create function to create activities with proper JWT context
CREATE OR REPLACE FUNCTION public.create_activity_with_context(
  p_fund_id uuid,
  p_deal_id uuid DEFAULT NULL,
  p_activity_type text,
  p_title text,
  p_description text DEFAULT NULL,
  p_context_data jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  activity_id uuid;
  user_id uuid;
  user_email text;
  user_org_id uuid;
BEGIN
  -- Get user context from JWT
  user_id := (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid;
  user_email := current_setting('request.jwt.claims', true)::jsonb ->> 'email';
  user_org_id := jwt_org_id();
  
  -- Create activity with enhanced context
  INSERT INTO public.activity_events (
    user_id,
    fund_id,
    deal_id,
    activity_type,
    title,
    description,
    context_data
  ) VALUES (
    user_id,
    p_fund_id,
    p_deal_id,
    p_activity_type,
    p_title,
    p_description,
    p_context_data || jsonb_build_object(
      'user_email', user_email,
      'user_org_id', user_org_id,
      'is_super_admin', jwt_is_super_admin(),
      'created_via', 'jwt_context_function'
    )
  ) RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$;