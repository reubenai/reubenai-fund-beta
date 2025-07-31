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