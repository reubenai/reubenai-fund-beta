-- Fix function search path security issues
ALTER FUNCTION public.log_ai_service_interaction() SET search_path = 'public';

-- Add missing RLS policies for tables that need them
CREATE POLICY "Reuben admins can manage lineage" ON public.data_lineage_log
  FOR ALL USING (is_reuben_email())
  WITH CHECK (is_reuben_email());

CREATE POLICY "Service can log lineage" ON public.data_lineage_log
  FOR INSERT WITH CHECK (true);