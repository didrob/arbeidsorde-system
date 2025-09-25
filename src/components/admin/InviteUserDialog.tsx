import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizations } from '@/hooks/useOrganizations';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

const inviteSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.string().min(1, 'Please select a role'),
  organizationId: z.string().optional(),
  siteId: z.string().optional(),
  notes: z.string().optional(),
});

type InviteForm = z.infer<typeof inviteSchema>;

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const roleLabels = {
  system_admin: 'System Admin',
  site_manager: 'Site Manager', 
  billing_manager: 'Billing Manager',
  field_supervisor: 'Field Supervisor',
  field_worker: 'Field Worker',
  admin: 'Admin'
};

export function InviteUserDialog({ open, onOpenChange }: InviteUserDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: organizations = [] } = useOrganizations();
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [sites, setSites] = useState<any[]>([]);
  
  const form = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      role: '',
      organizationId: '',
      siteId: '',
      notes: '',
    },
  });

  // Fetch sites when organization changes
  const handleOrganizationChange = async (orgId: string) => {
    setSelectedOrgId(orgId);
    form.setValue('organizationId', orgId);
    form.setValue('siteId', '');
    
    if (orgId) {
      const { data: orgSites } = await supabase
        .from('sites')
        .select('id, name')
        .eq('organization_id', orgId)
        .eq('is_active', true)
        .order('name');
      
      setSites(orgSites || []);
    } else {
      setSites([]);
    }
  };

  const createInvitation = useMutation({
    mutationFn: async (data: InviteForm) => {
      // Create invitation record
      const { data: invitation, error: inviteError } = await supabase
        .from('user_invitations')
        .insert({
          email: data.email,
          role: data.role,
          organization_id: data.organizationId || null,
          site_id: data.siteId || null,
          invited_by: user?.id,
          notes: data.notes || null,
        })
        .select(`
          *,
          organizations(name),
          sites(name)
        `)
        .single();

      if (inviteError) throw inviteError;

      // Get current user's profile for inviter name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user?.id)
        .single();

      // Send invitation email
      const { error: emailError } = await supabase.functions.invoke('send-invitation', {
        body: {
          email: data.email,
          role: data.role,
          organizationId: data.organizationId || null,
          siteId: data.siteId || null,
          invitationToken: invitation.invitation_token,
          inviterName: profile?.full_name || user?.email || 'Admin',
          organizationName: invitation.organizations?.name,
          siteName: invitation.sites?.name,
        },
      });

      if (emailError) throw emailError;

      return invitation;
    },
    onSuccess: () => {
      toast({
        title: 'Invitation sent!',
        description: 'The user will receive an email with instructions to join.',
      });
      queryClient.invalidateQueries({ queryKey: ['user-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error('Error sending invitation:', error);
      toast({
        title: 'Error sending invitation',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: InviteForm) => {
    createInvitation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              {...form.register('email')}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select onValueChange={(value) => form.setValue('role', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(roleLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.role && (
              <p className="text-sm text-destructive">{form.formState.errors.role.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="organization">Organization (Optional)</Label>
            <Select onValueChange={handleOrganizationChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select organization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No organization</SelectItem>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedOrgId && sites.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="site">Site (Optional)</Label>
              <Select onValueChange={(value) => form.setValue('siteId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select site" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No specific site</SelectItem>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional information for the invitee..."
              {...form.register('notes')}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createInvitation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createInvitation.isPending}>
              {createInvitation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Send Invitation
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}