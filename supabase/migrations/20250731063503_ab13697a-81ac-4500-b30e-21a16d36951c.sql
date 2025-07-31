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