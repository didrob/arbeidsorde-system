import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useInvitations = () => {
  return useQuery({
    queryKey: ['user-invitations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_invitations')
        .select(`
          *,
          organizations(name),
          sites(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

export const useResendInvitation = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      // Get invitation details
      const { data: invitation, error: fetchError } = await supabase
        .from('user_invitations')
        .select(`
          *,
          organizations(name),
          sites(name)
        `)
        .eq('id', invitationId)
        .single();

      if (fetchError) throw fetchError;

      // Generate new token and extend expiry
      const newToken = crypto.randomUUID();
      const { error: updateError } = await supabase
        .from('user_invitations')
        .update({
          invitation_token: newToken,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          updated_at: new Date().toISOString(),
        })
        .eq('id', invitationId);

      if (updateError) throw updateError;

      // Send invitation email
      const { error: emailError } = await supabase.functions.invoke('send-invitation', {
        body: {
          email: invitation.email,
          role: invitation.role,
          organizationId: invitation.organization_id,
          siteId: invitation.site_id,
          invitationToken: newToken,
          inviterName: 'Admin',
          organizationName: invitation.organizations?.name,
          siteName: invitation.sites?.name,
        },
      });

      if (emailError) throw emailError;

      return invitation;
    },
    onSuccess: () => {
      toast({
        title: 'Invitation resent!',
        description: 'The invitation email has been sent again.',
      });
      queryClient.invalidateQueries({ queryKey: ['user-invitations'] });
    },
    onError: (error: any) => {
      console.error('Error resending invitation:', error);
      toast({
        title: 'Error resending invitation',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

export const useCancelInvitation = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from('user_invitations')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', invitationId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Invitation cancelled',
        description: 'The invitation has been cancelled.',
      });
      queryClient.invalidateQueries({ queryKey: ['user-invitations'] });
    },
    onError: (error: any) => {
      console.error('Error cancelling invitation:', error);
      toast({
        title: 'Error cancelling invitation',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    },
  });
};