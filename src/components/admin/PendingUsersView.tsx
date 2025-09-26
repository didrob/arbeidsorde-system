import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { UserCheck, Clock, Building2, MapPin } from 'lucide-react';
import { useOrganizations, useSites } from '@/hooks/useOrganizations';

interface PendingUser {
  id: string;
  user_id: string;
  full_name: string;
  email?: string;
  phone?: string;
  role: string;
  created_at: string;
  organization_id?: string;
  site_id?: string;
}

export function PendingUsersView() {
  const [assigningUser, setAssigningUser] = useState<PendingUser | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const queryClient = useQueryClient();

  const { data: organizations } = useOrganizations();
  const { data: sites } = useSites();

  // Fetch users without organization/site assignment
  const { data: pendingUsers, isLoading } = useQuery({
    queryKey: ['pending-users'],
    queryFn: async () => {
      // Get profiles where organization_id or site_id is null
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .or('organization_id.is.null,site_id.is.null')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get email from auth.users for each profile
      const usersWithEmails = await Promise.all(
        profilesData.map(async (profile) => {
          const { data: userData, error: userError } = await supabase.auth.admin.getUserById(profile.user_id);
          
          return {
            ...profile,
            email: userData?.user?.email || 'Ikke tilgjengelig'
          };
        })
      );

      return usersWithEmails as PendingUser[];
    },
  });

  // Filter sites based on selected organization
  const availableSites = sites?.filter(site => 
    !selectedOrgId || site.organization_id === selectedOrgId
  );

  // Assign organization and site to user
  const assignUserMutation = useMutation({
    mutationFn: async ({ 
      userId, 
      organizationId, 
      siteId 
    }: { 
      userId: string; 
      organizationId: string; 
      siteId: string; 
    }) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          organization_id: organizationId,
          site_id: siteId
        })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Bruker tilordnet organisasjon og site');
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setAssigningUser(null);
      setSelectedOrgId('');
      setSelectedSiteId('');
    },
    onError: (error: any) => {
      toast.error('Feil ved tilordning: ' + error.message);
    }
  });

  const handleAssignUser = () => {
    if (!assigningUser || !selectedOrgId || !selectedSiteId) {
      toast.error('Vennligst velg organisasjon og site');
      return;
    }

    assignUserMutation.mutate({
      userId: assigningUser.user_id,
      organizationId: selectedOrgId,
      siteId: selectedSiteId
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Ventende brukere
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Ventende brukere
          {pendingUsers && pendingUsers.length > 0 && (
            <Badge variant="secondary">{pendingUsers.length}</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Brukere som ikke er tilordnet organisasjon eller arbeidssted
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!pendingUsers || pendingUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Alle brukere er tilordnet organisasjon og arbeidssted</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Navn</TableHead>
                  <TableHead>E-post</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Rolle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registrert</TableHead>
                  <TableHead>Handling</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm">
                        {!user.organization_id && (
                          <Badge variant="destructive" className="text-xs">Ingen organisasjon</Badge>
                        )}
                        {!user.site_id && (
                          <Badge variant="destructive" className="text-xs">Ingen site</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('no-NO')}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setAssigningUser(user);
                              setSelectedOrgId(user.organization_id || '');
                              setSelectedSiteId(user.site_id || '');
                            }}
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            Tilordne
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Tilordne bruker</DialogTitle>
                            <DialogDescription>
                              Velg organisasjon og arbeidssted for {assigningUser?.full_name}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label className="flex items-center gap-2">
                                <Building2 className="w-4 h-4" />
                                Organisasjon
                              </Label>
                              <Select
                                value={selectedOrgId}
                                onValueChange={(value) => {
                                  setSelectedOrgId(value);
                                  setSelectedSiteId(''); // Reset site when org changes
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Velg organisasjon" />
                                </SelectTrigger>
                                <SelectContent>
                                  {organizations?.map((org) => (
                                    <SelectItem key={org.id} value={org.id}>
                                      {org.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {selectedOrgId && (
                              <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4" />
                                  Arbeidssted
                                </Label>
                                <Select
                                  value={selectedSiteId}
                                  onValueChange={setSelectedSiteId}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Velg arbeidssted" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableSites?.map((site) => (
                                      <SelectItem key={site.id} value={site.id}>
                                        {site.name} {site.location && `(${site.location})`}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            <div className="flex gap-2 pt-4">
                              <Button
                                onClick={handleAssignUser}
                                disabled={!selectedOrgId || !selectedSiteId || assignUserMutation.isPending}
                                className="flex-1"
                              >
                                {assignUserMutation.isPending ? 'Tilordner...' : 'Tilordne'}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}