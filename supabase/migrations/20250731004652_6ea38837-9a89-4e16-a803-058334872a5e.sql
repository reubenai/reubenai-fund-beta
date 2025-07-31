-- Fix security issues by adding missing RLS policies for remaining tables

-- IC Meetings policies
CREATE POLICY "Users can view IC meetings for accessible funds" ON public.ic_meetings
  FOR SELECT USING (
    fund_id IN (
      SELECT f.id FROM public.funds f
      JOIN public.profiles p ON f.organization_id = p.organization_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Fund managers can manage IC meetings" ON public.ic_meetings
  FOR ALL USING (
    fund_id IN (
      SELECT f.id FROM public.funds f
      JOIN public.profiles p ON f.organization_id = p.organization_id
      WHERE p.user_id = auth.uid() AND p.role IN ('admin', 'fund_manager')
    )
  );

-- IC Meeting Deals policies
CREATE POLICY "Users can view IC meeting deals for accessible meetings" ON public.ic_meeting_deals
  FOR SELECT USING (
    meeting_id IN (
      SELECT m.id FROM public.ic_meetings m
      JOIN public.funds f ON m.fund_id = f.id
      JOIN public.profiles p ON f.organization_id = p.organization_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Fund managers can manage IC meeting deals" ON public.ic_meeting_deals
  FOR ALL USING (
    meeting_id IN (
      SELECT m.id FROM public.ic_meetings m
      JOIN public.funds f ON m.fund_id = f.id
      JOIN public.profiles p ON f.organization_id = p.organization_id
      WHERE p.user_id = auth.uid() AND p.role IN ('admin', 'fund_manager')
    )
  );

-- Deal Documents policies
CREATE POLICY "Users can view deal documents for accessible deals" ON public.deal_documents
  FOR SELECT USING (
    deal_id IN (
      SELECT d.id FROM public.deals d
      JOIN public.funds f ON d.fund_id = f.id
      JOIN public.profiles p ON f.organization_id = p.organization_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage deal documents for accessible deals" ON public.deal_documents
  FOR ALL USING (
    deal_id IN (
      SELECT d.id FROM public.deals d
      JOIN public.funds f ON d.fund_id = f.id
      JOIN public.profiles p ON f.organization_id = p.organization_id
      WHERE p.user_id = auth.uid() AND p.role IN ('admin', 'fund_manager', 'analyst')
    )
  );

-- Deal Notes policies
CREATE POLICY "Users can view deal notes for accessible deals" ON public.deal_notes
  FOR SELECT USING (
    deal_id IN (
      SELECT d.id FROM public.deals d
      JOIN public.funds f ON d.fund_id = f.id
      JOIN public.profiles p ON f.organization_id = p.organization_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage deal notes for accessible deals" ON public.deal_notes
  FOR ALL USING (
    deal_id IN (
      SELECT d.id FROM public.deals d
      JOIN public.funds f ON d.fund_id = f.id
      JOIN public.profiles p ON f.organization_id = p.organization_id
      WHERE p.user_id = auth.uid() AND p.role IN ('admin', 'fund_manager', 'analyst')
    )
  );

-- Fix function search path issues
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is the demo user
  IF NEW.email = 'demo@goreuben.com' THEN
    INSERT INTO public.profiles (user_id, organization_id, email, first_name, last_name, role)
    VALUES (
      NEW.id, 
      '550e8400-e29b-41d4-a716-446655440000',
      NEW.email,
      'Demo',
      'User',
      'fund_manager'
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';