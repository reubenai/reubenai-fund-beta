-- Fix function search paths for security compliance

CREATE OR REPLACE FUNCTION public.is_reuben_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user email ends with @goreuben.com or @reuben.com
  RETURN (
    auth.email() LIKE '%@goreuben.com' OR 
    auth.email() LIKE '%@reuben.com' OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = '';

CREATE OR REPLACE FUNCTION public.can_manage_funds()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    public.is_reuben_admin() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'fund_manager')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = '';

CREATE OR REPLACE FUNCTION public.can_edit_fund_data()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    public.is_reuben_admin() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'fund_manager', 'analyst')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = '';

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = '';