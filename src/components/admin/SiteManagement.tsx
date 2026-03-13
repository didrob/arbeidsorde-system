import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, ToggleLeft, ToggleRight, MapPin, Building, Mail, Phone } from 'lucide-react';
import { useSites, useToggleSiteStatus } from '@/hooks/useOrganizations';
import { CreateSiteDialog } from './CreateSiteDialog';
import { EditSiteDialog } from './EditSiteDialog';
import { LoadingState } from '@/components/common/LoadingState';

export function SiteManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingSite, setEditingSite] = useState<any>(null);
  const { data: sites, isLoading } = useSites();
  const toggleStatus = useToggleSiteStatus();

  const filteredSites = useMemo(() => {
    return sites?.filter(site =>
      site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.address?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];
  }, [sites, searchTerm]);

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Sites</h3>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Opprett site
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input placeholder="Søk sites..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm" />
      </div>

      <div className="grid gap-4">
        {filteredSites.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center p-8">
              <div className="text-center text-muted-foreground">
                {sites?.length === 0 ? 'Ingen sites funnet' : 'Ingen sites matcher søket'}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredSites.map((site) => (
            <Card key={site.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-lg">{site.name}</CardTitle>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        {site.organizations && (
                          <div className="flex items-center gap-1">
                            <Building className="w-3 h-3" />
                            <span>{site.organizations.name}</span>
                          </div>
                        )}
                        {site.location && <span>{site.location}</span>}
                      </div>
                      {site.address && (
                        <p className="text-sm text-muted-foreground mt-1">{site.address}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                        {site.contact_email && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            <span>{site.contact_email}</span>
                          </div>
                        )}
                        {site.contact_phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>{site.contact_phone}</span>
                          </div>
                        )}
                        {(site.latitude && site.longitude) && (
                          <span className="text-xs">📍 {site.latitude}, {site.longitude}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge variant={site.is_active ? 'default' : 'secondary'}>
                    {site.is_active ? 'Aktiv' : 'Inaktiv'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Opprettet: {new Date(site.created_at).toLocaleDateString('nb-NO')}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditingSite(site)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Rediger
                    </Button>
                    <Button
                      size="sm"
                      variant={site.is_active ? "secondary" : "default"}
                      onClick={() => toggleStatus.mutate({ id: site.id, is_active: !site.is_active })}
                      disabled={toggleStatus.isPending}
                    >
                      {site.is_active ? (
                        <><ToggleLeft className="h-4 w-4 mr-1" />Deaktiver</>
                      ) : (
                        <><ToggleRight className="h-4 w-4 mr-1" />Aktiver</>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <CreateSiteDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
      <EditSiteDialog open={!!editingSite} onOpenChange={(open) => !open && setEditingSite(null)} site={editingSite} />
    </div>
  );
}
