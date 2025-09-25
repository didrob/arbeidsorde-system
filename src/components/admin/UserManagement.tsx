import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { UserPlus, Edit, Users } from 'lucide-react';
import { useOrganizations, useSites } from '@/hooks/useOrganizations';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email?: string;
  phone?: string;
  role: string;
  is_active: boolean;
  organization_id?: string;
  site_id?: string;
  created_at: string;
  organizations?: { name: string };
  sites?: { name: string };
}

const roleLabels = {
  'admin': 'Administrator',
  'system_admin': 'System Administrator',
  'site_manager': 'Site Manager',
  'billing_manager': 'Billing Manager',
  'field_supervisor': 'Field Supervisor',
  'field_worker': 'Field Worker'
};

const roleColors = {
  'admin': 'bg-red-100 text-red-800',
  'system_admin': 'bg-purple-100 text-purple-800',
  'site_manager': 'bg-blue-100 text-blue-800',
  'billing_manager': 'bg-green-100 text-green-800',
  'field_supervisor': 'bg-yellow-100 text-yellow-800',
  'field_worker': 'bg-gray-100 text-gray-800'
};

export function UserManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const queryClient = useQueryClient();

  const { data: organizations } = useOrganizations();
  const { data: sites } = useSites();

  // Fetch all user profiles
  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          organizations (name),
          sites (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as UserProfile[];
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: {
      email: string;
      password: string;
      full_name: string;
      role: string;
      organization_id?: string;
      site_id?: string;
      phone?: string;
    }) => {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          full_name: userData.full_name
        }
      });

      if (authError) throw authError;

      // Update profile with additional data
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          role: userData.role,
          organization_id: userData.organization_id || null,
          site_id: userData.site_id || null,
          phone: userData.phone || null
        })
        .eq('user_id', authData.user.id);

      if (profileError) throw profileError;

      return authData.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Bruker opprettet');
      setIsCreateDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(`Kunne ikke opprette bruker: ${error.message}`);
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (userData: {
      id: string;
      full_name: string;
      role: string;
      organization_id?: string;
      site_id?: string;
      phone?: string;
      is_active: boolean;
    }) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: userData.full_name,
          role: userData.role,
          organization_id: userData.organization_id || null,
          site_id: userData.site_id || null,
          phone: userData.phone || null,
          is_active: userData.is_active
        })
        .eq('id', userData.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Bruker oppdatert');
      setEditingUser(null);
    },
    onError: (error: any) => {
      toast.error(`Kunne ikke oppdatere bruker: ${error.message}`);
    },
  });

  const CreateUserDialog = () => {
    const [formData, setFormData] = useState({
      email: '',
      password: '',
      full_name: '',
      role: 'field_worker',
      organization_id: '',
      site_id: '',
      phone: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      createUserMutation.mutate({
        ...formData,
        organization_id: formData.organization_id || undefined,
        site_id: formData.site_id || undefined
      });
    };

    return (
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button>
            <UserPlus className="w-4 h-4 mr-2" />
            Ny bruker
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Opprett ny bruker</DialogTitle>
            <DialogDescription>
              Fyll ut informasjonen for den nye brukeren
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">E-post</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Passord</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="full_name">Fullt navn</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="role">Rolle</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(roleLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="organization">Organisasjon</Label>
              <Select value={formData.organization_id} onValueChange={(value) => setFormData(prev => ({ ...prev, organization_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg organisasjon" />
                </SelectTrigger>
                <SelectContent>
                  {organizations?.map((org) => (
                    <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="site">Site</Label>
              <Select value={formData.site_id} onValueChange={(value) => setFormData(prev => ({ ...prev, site_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg site" />
                </SelectTrigger>
                <SelectContent>
                  {sites?.map((site) => (
                    <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <Button type="submit" disabled={createUserMutation.isPending}>
              {createUserMutation.isPending ? 'Oppretter...' : 'Opprett bruker'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  if (isLoading) {
    return <div>Laster brukere...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Brukerhantering
            </CardTitle>
            <CardDescription>
              Administrer brukere, roller og tilganger
            </CardDescription>
          </div>
          <CreateUserDialog />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Navn</TableHead>
              <TableHead>Rolle</TableHead>
              <TableHead>Organisasjon</TableHead>
              <TableHead>Site</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Handlinger</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="font-medium">{user.full_name}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                </TableCell>
                <TableCell>
                  <Badge className={roleColors[user.role as keyof typeof roleColors]}>
                    {roleLabels[user.role as keyof typeof roleLabels]}
                  </Badge>
                </TableCell>
                <TableCell>{user.organizations?.name || '-'}</TableCell>
                <TableCell>{user.sites?.name || '-'}</TableCell>
                <TableCell>
                  <Badge variant={user.is_active ? 'default' : 'secondary'}>
                    {user.is_active ? 'Aktiv' : 'Inaktiv'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingUser(user)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}