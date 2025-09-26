-- Create user invitations table for tracking pending invitations
CREATE TABLE public.user_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  organization_id UUID REFERENCES public.organizations(id),
  site_id UUID REFERENCES public.sites(id),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  invitation_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user invitations
CREATE POLICY "System admins can manage all invitations"
ON public.user_invitations
FOR ALL
USING (get_current_user_role() = 'system_admin');

CREATE POLICY "Site managers can manage invitations for their sites"
ON public.user_invitations  
FOR ALL
USING (
  get_current_user_role() = 'site_manager' 
  AND EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.site_id = user_invitations.site_id
  )
);

-- Add unique constraint to prevent duplicate invitations
CREATE UNIQUE INDEX idx_user_invitations_email_pending 
ON public.user_invitations (email) 
WHERE status = 'pending';

-- Add indexes for performance
CREATE INDEX idx_user_invitations_status ON public.user_invitations (status);
CREATE INDEX idx_user_invitations_expires_at ON public.user_invitations (expires_at);
CREATE INDEX idx_user_invitations_token ON public.user_invitations (invitation_token);

-- Create trigger for updating updated_at
CREATE TRIGGER update_user_invitations_updated_at
  BEFORE UPDATE ON public.user_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();