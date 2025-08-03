-- Create ic_memo_versions table for version control
CREATE TABLE public.ic_memo_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL,
  fund_id UUID NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ic_memo_versions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage memo versions with proper access" 
ON public.ic_memo_versions 
FOR ALL 
USING (fund_id IN ( 
  SELECT f.id
  FROM funds f
  JOIN profiles p ON f.organization_id = p.organization_id
  WHERE p.user_id = auth.uid() AND p.role = ANY (ARRAY['super_admin'::user_role, 'admin'::user_role, 'fund_manager'::user_role, 'analyst'::user_role])
));

CREATE POLICY "Users can view memo versions for accessible funds" 
ON public.ic_memo_versions 
FOR SELECT 
USING (fund_id IN ( 
  SELECT f.id
  FROM funds f
  JOIN profiles p ON f.organization_id = p.organization_id
  WHERE p.user_id = auth.uid()
));

-- Add updated_at trigger
CREATE TRIGGER update_ic_memo_versions_updated_at
BEFORE UPDATE ON public.ic_memo_versions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();