-- Phase 1: Database Security Foundation
-- Create security definer functions to prevent recursive RLS errors

-- Enhanced role checking function
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(p.role::text, 'viewer')
  FROM profiles p
  WHERE p.user_id = auth.uid()
  LIMIT 1;
$$;

-- Function to check if user can manage funds (create, edit, delete)
CREATE OR REPLACE FUNCTION public.user_can_manage_funds()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT CASE 
    WHEN auth.email() LIKE '%@goreuben.com' OR auth.email() LIKE '%@reuben.com' THEN true
    ELSE EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('super_admin', 'admin', 'fund_manager')
        AND (p.is_deleted IS NULL OR p.is_deleted = false)
    )
  END;
$$;

-- Function to check if user can upload documents
CREATE OR REPLACE FUNCTION public.user_can_upload_documents()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT CASE 
    WHEN auth.email() LIKE '%@goreuben.com' OR auth.email() LIKE '%@reuben.com' THEN true
    ELSE EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('super_admin', 'admin', 'fund_manager', 'analyst')
        AND (p.is_deleted IS NULL OR p.is_deleted = false)
    )
  END;
$$;

-- Function to check if user can edit deals
CREATE OR REPLACE FUNCTION public.user_can_edit_deals()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT CASE 
    WHEN auth.email() LIKE '%@goreuben.com' OR auth.email() LIKE '%@reuben.com' THEN true
    ELSE EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('super_admin', 'admin', 'fund_manager', 'analyst')
        AND (p.is_deleted IS NULL OR p.is_deleted = false)
    )
  END;
$$;

-- Function to check if user can create notes
CREATE OR REPLACE FUNCTION public.user_can_create_notes()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT CASE 
    WHEN auth.email() LIKE '%@goreuben.com' OR auth.email() LIKE '%@reuben.com' THEN true
    ELSE EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('super_admin', 'admin', 'fund_manager', 'analyst')
        AND (p.is_deleted IS NULL OR p.is_deleted = false)
    )
  END;
$$;

-- Function to check if user can edit IC memos
CREATE OR REPLACE FUNCTION public.user_can_edit_ic_memos()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT CASE 
    WHEN auth.email() LIKE '%@goreuben.com' OR auth.email() LIKE '%@reuben.com' THEN true
    ELSE EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('super_admin', 'admin', 'fund_manager', 'analyst')
        AND (p.is_deleted IS NULL OR p.is_deleted = false)
    )
  END;
$$;

-- Function to check if user can configure investment strategies
CREATE OR REPLACE FUNCTION public.user_can_configure_strategy()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT CASE 
    WHEN auth.email() LIKE '%@goreuben.com' OR auth.email() LIKE '%@reuben.com' THEN true
    ELSE EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('super_admin', 'admin', 'fund_manager')
        AND (p.is_deleted IS NULL OR p.is_deleted = false)
    )
  END;
$$;

-- Function to get user profile safely with proper attribution
CREATE OR REPLACE FUNCTION public.get_user_profile(user_id_param uuid)
RETURNS TABLE(
  full_name text,
  email text,
  role text
)
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    CASE 
      WHEN p.first_name IS NOT NULL AND p.last_name IS NOT NULL 
      THEN CONCAT(p.first_name, ' ', p.last_name)
      ELSE COALESCE(p.first_name, p.last_name, p.email)
    END as full_name,
    p.email,
    p.role::text
  FROM profiles p
  WHERE p.user_id = user_id_param
  LIMIT 1;
$$;

-- Updated RLS policies for deal_documents with proper upload restrictions
DROP POLICY IF EXISTS "Users can manage deal documents for accessible deals" ON deal_documents;
DROP POLICY IF EXISTS "Users can view deal documents for accessible deals" ON deal_documents;

CREATE POLICY "Users can view deal documents for accessible deals" 
ON deal_documents FOR SELECT 
USING (user_can_access_fund((
  SELECT fund_id FROM deals WHERE id = deal_documents.deal_id
)));

CREATE POLICY "Users can upload deal documents with proper permissions" 
ON deal_documents FOR INSERT 
WITH CHECK (
  user_can_upload_documents() AND
  user_can_access_fund((
    SELECT fund_id FROM deals WHERE id = deal_documents.deal_id
  ))
);

CREATE POLICY "Users can delete deal documents with proper permissions" 
ON deal_documents FOR DELETE 
USING (
  user_can_upload_documents() AND
  user_can_access_fund((
    SELECT fund_id FROM deals WHERE id = deal_documents.deal_id
  ))
);

-- Updated RLS policies for deal_notes with proper creation restrictions
DROP POLICY IF EXISTS "Users can manage deal notes for accessible deals" ON deal_notes;

CREATE POLICY "Users can create deal notes with proper permissions" 
ON deal_notes FOR INSERT 
WITH CHECK (
  user_can_create_notes() AND
  created_by = auth.uid() AND
  user_can_access_fund((
    SELECT fund_id FROM deals WHERE id = deal_notes.deal_id
  ))
);

CREATE POLICY "Users can view deal notes for accessible deals" 
ON deal_notes FOR SELECT 
USING (user_can_access_fund((
  SELECT fund_id FROM deals WHERE id = deal_notes.deal_id
)));

CREATE POLICY "Users can update their own notes" 
ON deal_notes FOR UPDATE 
USING (created_by = auth.uid());

-- Updated RLS policies for IC memos with edit restrictions
DROP POLICY IF EXISTS "Users can manage IC memos with proper access" ON ic_memos;

CREATE POLICY "Users can view IC memos for accessible funds" 
ON ic_memos FOR SELECT 
USING (user_can_access_fund(fund_id));

CREATE POLICY "Users can create IC memos with proper permissions" 
ON ic_memos FOR INSERT 
WITH CHECK (
  user_can_edit_ic_memos() AND
  user_can_access_fund(fund_id)
);

CREATE POLICY "Users can edit IC memos with proper permissions" 
ON ic_memos FOR UPDATE 
USING (
  user_can_edit_ic_memos() AND
  user_can_access_fund(fund_id)
);

-- Updated RLS policies for investment strategies
DROP POLICY IF EXISTS "Fund managers can manage strategies" ON investment_strategies;
DROP POLICY IF EXISTS "Users can view strategies for accessible funds" ON investment_strategies;

CREATE POLICY "Users can view investment strategies for accessible funds" 
ON investment_strategies FOR SELECT 
USING (user_can_access_fund(fund_id));

CREATE POLICY "Fund managers can configure investment strategies" 
ON investment_strategies FOR ALL 
USING (
  user_can_configure_strategy() AND
  user_can_access_fund(fund_id)
)
WITH CHECK (
  user_can_configure_strategy() AND
  user_can_access_fund(fund_id)
);

-- Add RLS policies for funds table to prevent analyst fund creation
DROP POLICY IF EXISTS "Users can create funds with proper permissions" ON funds;

CREATE POLICY "Fund managers can create funds" 
ON funds FOR INSERT 
WITH CHECK (user_can_manage_funds());

-- Add validation trigger for IC voting weight
CREATE OR REPLACE FUNCTION public.validate_ic_voting_weight()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Validate voting weight is between 0 and 100
  IF NEW.voting_weight < 0 OR NEW.voting_weight > 100 THEN
    RAISE EXCEPTION 'Voting weight must be between 0 and 100 percent';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply voting weight validation trigger
DROP TRIGGER IF EXISTS validate_voting_weight_trigger ON ic_committee_members;
CREATE TRIGGER validate_voting_weight_trigger
  BEFORE INSERT OR UPDATE ON ic_committee_members
  FOR EACH ROW
  EXECUTE FUNCTION validate_ic_voting_weight();