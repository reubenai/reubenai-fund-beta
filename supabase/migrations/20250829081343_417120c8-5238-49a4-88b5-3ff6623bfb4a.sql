-- Create analysis orchestration tracking table
CREATE TABLE public.analysis_orchestration_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL,
  fund_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  trigger_reason TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  overall_status TEXT NOT NULL DEFAULT 'pending',
  stages JSONB NOT NULL DEFAULT '[]',
  progress INTEGER NOT NULL DEFAULT 0,
  estimated_completion TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.analysis_orchestration_tracking ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage orchestration for accessible funds"
ON public.analysis_orchestration_tracking
FOR ALL
USING (organization_id = get_jwt_org_id())
WITH CHECK (organization_id = get_jwt_org_id());

CREATE POLICY "Super admins can manage all orchestration"
ON public.analysis_orchestration_tracking
FOR ALL
USING (is_super_admin_by_email())
WITH CHECK (is_super_admin_by_email());

CREATE POLICY "Services can manage orchestration"
ON public.analysis_orchestration_tracking
FOR ALL
USING (true)
WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_analysis_orchestration_tracking_deal_id ON public.analysis_orchestration_tracking(deal_id);
CREATE INDEX idx_analysis_orchestration_tracking_fund_id ON public.analysis_orchestration_tracking(fund_id);
CREATE INDEX idx_analysis_orchestration_tracking_org_id ON public.analysis_orchestration_tracking(organization_id);
CREATE INDEX idx_analysis_orchestration_tracking_status ON public.analysis_orchestration_tracking(overall_status);
CREATE INDEX idx_analysis_orchestration_tracking_created_at ON public.analysis_orchestration_tracking(created_at);

-- Create trigger for updated_at
CREATE TRIGGER update_analysis_orchestration_tracking_updated_at
    BEFORE UPDATE ON public.analysis_orchestration_tracking
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();