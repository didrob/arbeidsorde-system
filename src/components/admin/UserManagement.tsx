import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizations, useSites, useUserAdditionalSites, useGrantSiteAccess, useRevokeSiteAccess } from "@/hooks/useOrganizations";
import { useInvitations, useResendInvitation, useCancelInvitation } from "@/hooks/useInvitations";
import { InviteUserDialog } from "./InviteUserDialog";
import { AdditionalSiteAccessManager } from "./AdditionalSiteAccessManager";
import { Pencil, UserPlus, Mail, Search, RotateCcw, X, Download, Users, Shield, Wrench, MapPin } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  organization_name?: string;
  site_name?: string;
  auth_email?: string;
}

const roleLabels: Record<string, string> = {
  system_admin: 'System Admin',
  site_manager: 'Site Manager', 
  billing_manager: 'Billing Manager',
  field_supervisor: 'Field Supervisor',
  field_worker: 'Field Worker',
  customer: 'Kunde',
  admin: 'Admin'
};

const roleColors: Record<string, string> = {
  system_admin: 'bg-purple-100 text-purple-800',
  site_manager: 'bg-blue-100 text-blue-800',
  billing_manager: 'bg-green-100 text-green-800',
  field_supervisor: 'bg-yellow-100 text-yellow-800', 
  field_worker: 'bg-gray-100 text-gray-800',
  customer: 'bg-teal-100 text-teal-800',
  admin: 'bg-red-100 text-red-800'
};

export function UserManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("users");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterSite, setFilterSite] = useState<string>("all");
  const [createForm, setCreateForm] = useState({
    email: "",
    full_name: "",
    role: "",
    organization_id: "",
    site_id: "",
  });
  const [editForm, setEditForm] = useState({
    full_name: "",
    role: "",
    organization_id: "",
    site_id: "",
    is_active: true,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: organizations = [] } = useOrganizations();
  const { data: invitations = [] } = useInvitations();
  const { data: createSites = [] } = useSites(createForm.organization_id);
  const { data: editSites = [] } = useSites(editForm.organization_id);
  const { data: userAdditionalSites = [] } = useUserAdditionalSites(selectedUser?.user_id);
  const resendInvitation = useResendInvitation();
  const cancelInvitation = useCancelInvitation();
  const grantSiteAccess = useGrantSiteAccess();
  const revokeSiteAccess = useRevokeSiteAccess();

  // Fetch all sites for filter dropdown
  const allSites = useQuery({
    queryKey: ['all-sites'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sites')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch users with auth email
  const users = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          organizations:organization_id(name),
          sites:site_id(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data.map(user => ({
        ...user,
        organization_name: (user.organizations as any)?.name,
        site_name: (user.sites as any)?.name
      })) as UserProfile[];
    },
  });

  // Filter users based on search query, role, and site
  const filteredUsers = useMemo(() => {
    if (!users.data) return [];
    let result = users.data;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(user => 
        user.full_name?.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query) ||
        user.organization_name?.toLowerCase().includes(query) ||
        user.site_name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
      );
    }

    if (filterRole !== "all") {
      result = result.filter(user => user.role === filterRole);
    }

    if (filterSite !== "all") {
      result = result.filter(user => user.site_id === filterSite);
    }
    
    return result;
  }, [users.data, searchQuery, filterRole, filterSite]);

  // Role summary counts
  const roleSummary = useMemo(() => {
    if (!users.data) return {};
    const counts: Record<string, number> = {};
    users.data.forEach(user => {
      counts[user.role] = (counts[user.role] || 0) + 1;
    });
    return counts;
  }, [users.data]);

  // Filter invitations based on search query
  const filteredInvitations = useMemo(() => {
    if (!searchQuery) return invitations;
    
    const query = searchQuery.toLowerCase();
    return invitations.filter(invitation => 
      invitation.email?.toLowerCase().includes(query) ||
      invitation.role.toLowerCase().includes(query) ||
      (invitation as any).organizations?.name?.toLowerCase().includes(query) ||
      (invitation as any).sites?.name?.toLowerCase().includes(query)
    );
  }, [invitations, searchQuery]);

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const exportUsers = () => {
    const csvContent = [
      'Name,Email,Role,Organization,Site,Status',
      ...filteredUsers.map(user => 
        `"${user.full_name || ''}","${user.email || ''}","${roleLabels[user.role] || user.role}","${user.organization_name || ''}","${user.site_name || ''}","${user.is_active ? 'Active' : 'Inactive'}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof createForm) => {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: 'TempPassword123!',
        email_confirm: true,
        user_metadata: {
          full_name: userData.full_name
        }
      });

      if (authError) throw authError;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          role: userData.role,
          organization_id: userData.organization_id || null,
          site_id: userData.site_id || null,
        })
        .eq('user_id', authData.user.id);

      if (profileError) throw profileError;

      return authData.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'User created successfully',
        description: 'The user has been created and can now log in.',
      });
      setIsCreateDialogOpen(false);
      setCreateForm({ email: "", full_name: "", role: "", organization_id: "", site_id: "" });
    },
    onError: (error: any) => {
      toast({
        title: 'Error creating user',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Update user mutation - now also syncs user_roles
  const updateUserMutation = useMutation({
    mutationFn: async (userData: typeof editForm & { id: string; user_id: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: userData.full_name,
          role: userData.role,
          organization_id: userData.organization_id || null,
          site_id: userData.site_id || null,
          is_active: userData.is_active
        })
        .eq('id', userData.id);

      if (error) throw error;

      // Sync user_roles table
      // First delete existing roles, then insert new one
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userData.user_id);

      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userData.user_id,
          role: userData.role as any,
        });

      if (roleError) throw roleError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'User updated successfully',
        description: 'The user profile and role have been updated.',
      });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating user',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleEditClick = (user: UserProfile) => {
    setSelectedUser(user);
    setEditForm({
      full_name: user.full_name,
      role: user.role,
      organization_id: user.organization_id || "",
      site_id: user.site_id || "",
      is_active: user.is_active,
    });
    setIsEditDialogOpen(true);
  };

  const onSubmit = (data: typeof createForm) => {
    createUserMutation.mutate(data);
  };

  const onEditSubmit = (data: typeof editForm) => {
    if (!selectedUser) return;
    updateUserMutation.mutate({ ...data, id: selectedUser.id, user_id: selectedUser.user_id });
  };

  if (users.isLoading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  const pendingInvitationsCount = invitations.filter(inv => inv.status === 'pending').length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          User Management
          {pendingInvitationsCount > 0 && (
            <Badge variant="secondary">{pendingInvitationsCount} pending invitations</Badge>
          )}
        </CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportUsers}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => setIsInviteDialogOpen(true)}>
            <Mail className="mr-2 h-4 w-4" />
            Invite User
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Create User
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Role Summary */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted text-sm">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium">{users.data?.length || 0}</span>
              <span className="text-muted-foreground">totalt</span>
            </div>
            {Object.entries(roleSummary).map(([role, count]) => (
              <div key={role} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm ${roleColors[role] || 'bg-muted'}`}>
                <span className="font-medium">{count}</span>
                <span>{roleLabels[role] || role}</span>
              </div>
            ))}
          </div>

          {/* Search + Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Søk brukere..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Alle roller" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle roller</SelectItem>
                {Object.entries(roleLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterSite} onValueChange={setFilterSite}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Alle lokasjoner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle lokasjoner</SelectItem>
                {(allSites.data || []).map((site) => (
                  <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="users">Active Users ({filteredUsers.length})</TabsTrigger>
              <TabsTrigger value="invitations">
                Invitations ({filteredInvitations.length})
                {pendingInvitationsCount > 0 && (
                  <Badge variant="secondary" className="ml-2">{pendingInvitationsCount}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4">
              {/* Bulk Actions */}
              {selectedUsers.length > 0 && (
                <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                  <span className="text-sm text-muted-foreground">
                    {selectedUsers.length} user(s) selected
                  </span>
                  <Button variant="outline" size="sm" onClick={() => setSelectedUsers([])}>
                    Clear Selection
                  </Button>
                </div>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Navn</TableHead>
                    <TableHead>E-post</TableHead>
                    <TableHead>Rolle</TableHead>
                    <TableHead>Lokasjon</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Handlinger</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{user.email || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={roleColors[user.role] || "bg-gray-500"}>
                          {roleLabels[user.role] || user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.site_name || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? "default" : "secondary"}>
                          {user.is_active ? "Aktiv" : "Inaktiv"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(user)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="invitations" className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell className="font-medium">{invitation.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={roleColors[invitation.role] || "bg-gray-500"}>
                          {roleLabels[invitation.role] || invitation.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{(invitation as any).organizations?.name || "—"}</TableCell>
                      <TableCell>{(invitation as any).sites?.name || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={
                          invitation.status === 'pending' ? "secondary" :
                          invitation.status === 'accepted' ? "default" :
                          invitation.status === 'expired' ? "destructive" : "outline"
                        }>
                          {invitation.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(invitation.expires_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {invitation.status === 'pending' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                Actions
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem 
                                onClick={() => resendInvitation.mutate(invitation.id)}
                                disabled={resendInvitation.isPending}
                              >
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Resend Invitation
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => cancelInvitation.mutate(invitation.id)}
                                disabled={cancelInvitation.isPending}
                                className="text-destructive"
                              >
                                <X className="mr-2 h-4 w-4" />
                                Cancel Invitation
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>

      {/* Invite User Dialog */}
      <InviteUserDialog 
        open={isInviteDialogOpen} 
        onOpenChange={setIsInviteDialogOpen} 
      />

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Create a new user account with direct access.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); onSubmit(createForm); }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-name">Full Name</Label>
              <Input
                id="create-name"
                value={createForm.full_name}
                onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-role">Role</Label>
              <Select onValueChange={(value) => setCreateForm({ ...createForm, role: value })}>
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-org">Organization (Optional)</Label>
              <Select onValueChange={(value) => {
                const orgId = value === 'none' ? '' : value;
                setCreateForm({ ...createForm, organization_id: orgId, site_id: '' });
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No organization</SelectItem>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-site">Primary Site (Optional)</Label>
              <Select 
                value={createForm.site_id || 'none'} 
                onValueChange={(value) => setCreateForm({ ...createForm, site_id: value === 'none' ? '' : value })}
                disabled={!createForm.organization_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder={!createForm.organization_id ? "Select organization first" : "Select primary site"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No primary site</SelectItem>
                  {createSites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={createUserMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createUserMutation.isPending}>
                {createUserMutation.isPending ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); onEditSubmit(editForm); }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select value={editForm.role} onValueChange={(value) => setEditForm({ ...editForm, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(roleLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-org">Organization</Label>
              <Select value={editForm.organization_id || 'none'} onValueChange={(value) => {
                const orgId = value === 'none' ? '' : value;
                setEditForm({ ...editForm, organization_id: orgId, site_id: '' });
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No organization</SelectItem>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-site">Primary Site</Label>
              <Select 
                value={editForm.site_id || 'none'} 
                onValueChange={(value) => setEditForm({ ...editForm, site_id: value === 'none' ? '' : value })}
                disabled={!editForm.organization_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder={!editForm.organization_id ? "Select organization first" : "Select primary site"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No primary site</SelectItem>
                  {editSites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Additional Site Access Section */}
            {selectedUser && (
              <AdditionalSiteAccessManager
                availableSites={editSites}
                userAdditionalSites={userAdditionalSites}
                onGrantAccess={(siteId) => grantSiteAccess.mutate({ 
                  userId: selectedUser.user_id, 
                  siteId 
                })}
                onRevokeAccess={(siteId) => revokeSiteAccess.mutate({ 
                  userId: selectedUser.user_id, 
                  siteId 
                })}
                isLoading={grantSiteAccess.isPending || revokeSiteAccess.isPending}
              />
            )}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-active"
                checked={editForm.is_active}
                onCheckedChange={(checked) => setEditForm({ ...editForm, is_active: checked as boolean })}
              />
              <Label htmlFor="edit-active">Active User</Label>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={updateUserMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateUserMutation.isPending}>
                {updateUserMutation.isPending ? 'Updating...' : 'Update User'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
