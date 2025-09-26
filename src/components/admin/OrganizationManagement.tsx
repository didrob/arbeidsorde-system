import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Search, Edit, ToggleLeft, ToggleRight, Building2 } from 'lucide-react';
import { useOrganizations, useToggleOrganizationStatus, type Organization } from '@/hooks/useOrganizations';
import { CreateOrganizationDialog } from './CreateOrganizationDialog';
import { EditOrganizationDialog } from './EditOrganizationDialog';
import { LoadingState } from '@/components/common/LoadingState';

export function OrganizationManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingOrganization, setEditingOrganization] = useState<Organization | null>(null);
  const { data: organizations, isLoading } = useOrganizations();
  const toggleStatus = useToggleOrganizationStatus();

  const filteredOrganizations = useMemo(() => {
    return organizations?.filter(org =>
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.description?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];
  }, [organizations, searchTerm]);

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Organisasjoner</h3>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Opprett organisasjon
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Søk organisasjoner..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid gap-4">
        {filteredOrganizations.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center p-8">
              <div className="text-center text-muted-foreground">
                {organizations?.length === 0 ? 'Ingen organisasjoner funnet' : 'Ingen organisasjoner matcher søket'}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredOrganizations.map((org) => (
            <Card key={org.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-lg">{org.name}</CardTitle>
                      {org.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {org.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant={org.is_active ? 'default' : 'secondary'}>
                    {org.is_active ? 'Aktiv' : 'Inaktiv'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Opprettet: {new Date(org.created_at).toLocaleDateString('nb-NO')}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingOrganization(org)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Rediger
                    </Button>
                    <Button
                      size="sm"
                      variant={org.is_active ? "secondary" : "default"}
                      onClick={() => toggleStatus.mutate({ id: org.id, is_active: !org.is_active })}
                      disabled={toggleStatus.isPending}
                    >
                      {org.is_active ? (
                        <>
                          <ToggleLeft className="h-4 w-4 mr-1" />
                          Deaktiver
                        </>
                      ) : (
                        <>
                          <ToggleRight className="h-4 w-4 mr-1" />
                          Aktiver
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <CreateOrganizationDialog 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
      <EditOrganizationDialog
        open={!!editingOrganization}
        onOpenChange={(open) => !open && setEditingOrganization(null)}
        organization={editingOrganization}
      />
    </div>
  );
}