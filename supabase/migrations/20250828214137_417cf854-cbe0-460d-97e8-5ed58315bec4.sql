-- Create CRM integrations table for storing connection configurations
CREATE TABLE IF NOT EXISTS public.crm_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  fund_id UUID,
  crm_type TEXT NOT NULL CHECK (crm_type IN ('hubspot', 'salesforce', 'affinity', 'pipedrive')),
  connection_name TEXT NOT NULL,
  credentials JSONB NOT NULL DEFAULT '{}',
  field_mappings JSONB NOT NULL DEFAULT '{}',
  sync_settings JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create CRM sync log table for tracking sync history and errors
CREATE TABLE IF NOT EXISTS public.crm_sync_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID NOT NULL REFERENCES public.crm_integrations(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('full_sync', 'incremental_sync', 'webhook_sync')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')) DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  records_processed INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add CRM-related fields to deals table
ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS crm_source TEXT CHECK (crm_source IN ('hubspot', 'salesforce', 'affinity', 'pipedrive')),
ADD COLUMN IF NOT EXISTS crm_external_id TEXT,
ADD COLUMN IF NOT EXISTS crm_integration_id UUID REFERENCES public.crm_integrations(id),
ADD COLUMN IF NOT EXISTS last_crm_sync TIMESTAMP WITH TIME ZONE;

-- Create indexes for efficient CRM lookups
CREATE INDEX IF NOT EXISTS idx_deals_crm_source ON public.deals(crm_source);
CREATE INDEX IF NOT EXISTS idx_deals_crm_external_id ON public.deals(crm_external_id);
CREATE INDEX IF NOT EXISTS idx_deals_crm_integration_id ON public.deals(crm_integration_id);
CREATE INDEX IF NOT EXISTS idx_crm_integrations_org_fund ON public.crm_integrations(organization_id, fund_id);
CREATE INDEX IF NOT EXISTS idx_crm_sync_log_integration_status ON public.crm_sync_log(integration_id, status);

-- Enable RLS on new tables
ALTER TABLE public.crm_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_sync_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for crm_integrations
CREATE POLICY "Users can manage CRM integrations for their organization"
ON public.crm_integrations
FOR ALL
USING (organization_id = auth_org_id())
WITH CHECK (organization_id = auth_org_id());

CREATE POLICY "Super admins can manage all CRM integrations"
ON public.crm_integrations
FOR ALL
USING (auth_is_super_admin())
WITH CHECK (auth_is_super_admin());

-- Create RLS policies for crm_sync_log
CREATE POLICY "Users can view CRM sync logs for their organization"
ON public.crm_sync_log
FOR SELECT
USING (integration_id IN (
  SELECT id FROM public.crm_integrations 
  WHERE organization_id = auth_org_id()
));

CREATE POLICY "Super admins can view all CRM sync logs"
ON public.crm_sync_log
FOR SELECT
USING (auth_is_super_admin());

CREATE POLICY "Services can manage CRM sync logs"
ON public.crm_sync_log
FOR ALL
USING (true)
WITH CHECK (true);

-- Create trigger to update updated_at on crm_integrations
CREATE OR REPLACE FUNCTION update_crm_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_crm_integrations_updated_at
BEFORE UPDATE ON public.crm_integrations
FOR EACH ROW
EXECUTE FUNCTION update_crm_integrations_updated_at();