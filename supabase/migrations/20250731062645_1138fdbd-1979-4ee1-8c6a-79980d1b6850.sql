-- Create helper function for document management access with proper role hierarchy
CREATE OR REPLACE FUNCTION public.has_document_management_access()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  RETURN (
    public.is_reuben_admin() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'admin', 'fund_manager', 'analyst')
    )
  );
END;
$function$

-- Update deal_documents RLS policies to use the helper function and include super_admin
DROP POLICY IF EXISTS "Users can view deal documents" ON public.deal_documents;
DROP POLICY IF EXISTS "Users can insert deal documents" ON public.deal_documents;
DROP POLICY IF EXISTS "Users can update deal documents" ON public.deal_documents;
DROP POLICY IF EXISTS "Users can delete deal documents" ON public.deal_documents;

-- Create new policies with proper role hierarchy
CREATE POLICY "Users can view deal documents" 
ON public.deal_documents 
FOR SELECT 
USING (public.has_document_management_access());

CREATE POLICY "Users can insert deal documents" 
ON public.deal_documents 
FOR INSERT 
WITH CHECK (public.has_document_management_access());

CREATE POLICY "Users can update deal documents" 
ON public.deal_documents 
FOR UPDATE 
USING (public.has_document_management_access());

CREATE POLICY "Users can delete deal documents" 
ON public.deal_documents 
FOR DELETE 
USING (public.has_document_management_access());

-- Update storage policies for deal-documents bucket to include super_admin
DROP POLICY IF EXISTS "Users can view deal documents in storage" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload deal documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update deal documents in storage" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete deal documents in storage" ON storage.objects;

CREATE POLICY "Users can view deal documents in storage" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'deal-documents' AND public.has_document_management_access());

CREATE POLICY "Users can upload deal documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'deal-documents' AND public.has_document_management_access());

CREATE POLICY "Users can update deal documents in storage" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'deal-documents' AND public.has_document_management_access());

CREATE POLICY "Users can delete deal documents in storage" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'deal-documents' AND public.has_document_management_access());

-- Update fund-documents and organization-documents storage policies as well
CREATE POLICY "Users can view fund documents in storage" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'fund-documents' AND public.has_document_management_access());

CREATE POLICY "Users can upload fund documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'fund-documents' AND public.has_document_management_access());

CREATE POLICY "Users can view organization documents in storage" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'organization-documents' AND public.has_document_management_access());

CREATE POLICY "Users can upload organization documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'organization-documents' AND public.has_document_management_access());

-- Update handle_new_user function to properly assign admin role to @goreuben.com/@reuben.com emails
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Check if this is hello@goreuben.com and set as super_admin
  IF NEW.email = 'hello@goreuben.com' THEN
    INSERT INTO public.profiles (user_id, organization_id, email, first_name, last_name, role)
    VALUES (
      NEW.id, 
      '550e8400-e29b-41d4-a716-446655440000',
      NEW.email,
      NEW.raw_user_meta_data ->> 'first_name',
      NEW.raw_user_meta_data ->> 'last_name',
      'super_admin'
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
      'fund_manager'
    );
  -- Check if this is a @goreuben.com or @reuben.com email (assign as admin, not super_admin)
  ELSIF NEW.email LIKE '%@goreuben.com' OR NEW.email LIKE '%@reuben.com' THEN
    INSERT INTO public.profiles (user_id, organization_id, email, first_name, last_name, role)
    VALUES (
      NEW.id, 
      '550e8400-e29b-41d4-a716-446655440000',
      NEW.email,
      NEW.raw_user_meta_data ->> 'first_name',
      NEW.raw_user_meta_data ->> 'last_name',
      'admin'
    );
  ELSE
    -- For other users, they'll need to be assigned to an organization later
    INSERT INTO public.profiles (user_id, email, first_name, last_name, role)
    VALUES (
      NEW.id,
      NEW.email,
      NEW.raw_user_meta_data ->> 'first_name',
      NEW.raw_user_meta_data ->> 'last_name',
      'viewer'
    );
  END IF;
  RETURN NEW;
END;
$function$

-- Update can_manage_funds function to include super_admin explicitly
CREATE OR REPLACE FUNCTION public.can_manage_funds()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  RETURN (
    public.is_reuben_admin() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'admin', 'fund_manager')
    )
  );
END;
$function$

-- Update can_edit_fund_data function to include super_admin explicitly
CREATE OR REPLACE FUNCTION public.can_edit_fund_data()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  RETURN (
    public.is_reuben_admin() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'admin', 'fund_manager', 'analyst')
    )
  );
END;
$function$