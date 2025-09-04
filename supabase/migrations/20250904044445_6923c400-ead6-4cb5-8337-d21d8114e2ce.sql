-- Create webhook configuration table
CREATE TABLE public.webhook_configs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  fund_id uuid REFERENCES public.funds(id) ON DELETE CASCADE,
  service_name text NOT NULL DEFAULT 'dify',
  webhook_url text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  config_data jsonb NOT NULL DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create webhook logs table for monitoring
CREATE TABLE public.webhook_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config_id uuid NOT NULL REFERENCES public.webhook_configs(id) ON DELETE CASCADE,
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  request_payload jsonb NOT NULL DEFAULT '{}',
  response_status integer,
  response_body text,
  error_message text,
  attempt_number integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on webhook_configs
ALTER TABLE public.webhook_configs ENABLE ROW LEVEL SECURITY;

-- RLS policies for webhook_configs
CREATE POLICY "Users can manage webhook configs for their organization"
ON public.webhook_configs
FOR ALL
USING (organization_id = get_jwt_org_id())
WITH CHECK (organization_id = get_jwt_org_id());

CREATE POLICY "Super admins can manage all webhook configs"
ON public.webhook_configs
FOR ALL
USING (is_super_admin_by_email())
WITH CHECK (is_super_admin_by_email());

-- Enable RLS on webhook_logs
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for webhook_logs
CREATE POLICY "Users can view webhook logs for their organization"
ON public.webhook_logs
FOR SELECT
USING (config_id IN (
  SELECT id FROM public.webhook_configs 
  WHERE organization_id = get_jwt_org_id()
));

CREATE POLICY "Super admins can view all webhook logs"
ON public.webhook_logs
FOR SELECT
USING (is_super_admin_by_email());

CREATE POLICY "Services can insert webhook logs"
ON public.webhook_logs
FOR INSERT
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_webhook_configs_org_id ON public.webhook_configs(organization_id);
CREATE INDEX idx_webhook_configs_fund_id ON public.webhook_configs(fund_id);
CREATE INDEX idx_webhook_configs_active ON public.webhook_configs(is_active);
CREATE INDEX idx_webhook_logs_config_id ON public.webhook_logs(config_id);
CREATE INDEX idx_webhook_logs_deal_id ON public.webhook_logs(deal_id);
CREATE INDEX idx_webhook_logs_created_at ON public.webhook_logs(created_at);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_webhook_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_webhook_configs_updated_at
  BEFORE UPDATE ON public.webhook_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_webhook_configs_updated_at();

-- Create trigger function for new deal webhook
CREATE OR REPLACE FUNCTION public.trigger_dify_webhook_on_deal_creation()
RETURNS TRIGGER AS $$
DECLARE
  service_role_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1ZXVpb296Y2dtZWRrdXhhd2p1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkyMDY0NSwiZXhwIjoyMDY5NDk2NjQ1fQ.xG6vI9lBx_4SIGiSdSGahtSaUu0E2Cp5KJl3d32B6kU';
  webhook_response record;
BEGIN
  -- Call edge function to handle webhook asynchronously
  SELECT INTO webhook_response * FROM net.http_post(
    url := 'https://bueuioozcgmedkuxawju.supabase.co/functions/v1/dify-webhook-handler',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := jsonb_build_object(
      'deal_id', NEW.id,
      'event_type', 'deal_created',
      'deal_data', jsonb_build_object(
        'id', NEW.id,
        'company_name', NEW.company_name,
        'industry', NEW.industry,
        'deal_size', NEW.deal_size,
        'valuation', NEW.valuation,
        'location', NEW.location,
        'founder', NEW.founder,
        'fund_id', NEW.fund_id,
        'organization_id', NEW.organization_id,
        'created_at', NEW.created_at,
        'status', NEW.status
      )
    ),
    timeout_milliseconds := 5000
  );
  
  -- Log any immediate errors (webhook processing happens async)
  IF webhook_response.status >= 400 THEN
    RAISE LOG 'Webhook trigger failed with status %: %', webhook_response.status, webhook_response.content;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail deal creation if webhook fails
    RAISE LOG 'Webhook trigger error: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for deal creation
CREATE TRIGGER deal_creation_dify_webhook_trigger
  AFTER INSERT ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_dify_webhook_on_deal_creation();