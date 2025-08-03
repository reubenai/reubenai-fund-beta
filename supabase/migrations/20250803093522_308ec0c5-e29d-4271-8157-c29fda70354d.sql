-- Create user invitations table for custom invitation flow
CREATE TABLE public.user_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  invited_by UUID NOT NULL,
  custom_message TEXT,
  invitation_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- Create policies for user invitations
CREATE POLICY "Super admins can manage invitations" 
ON public.user_invitations 
FOR ALL 
USING (is_reuben_admin() OR (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
));

CREATE POLICY "Users can view invitations in their organization" 
ON public.user_invitations 
FOR SELECT 
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

-- Create trigger for updating updated_at
CREATE TRIGGER update_user_invitations_updated_at
BEFORE UPDATE ON public.user_invitations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate invitation token
CREATE OR REPLACE FUNCTION public.generate_invitation_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$;