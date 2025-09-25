import { useState } from 'react';
import { useSites, useCreateSite } from '@/hooks/useOrganizations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateSiteDialog } from './CreateSiteDialog';
import { Loader2, Plus, Search, MapPin, Building2 } from 'lucide-react';

export function SiteManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  const { data: sites, isLoading } = useSites();

  const filteredSites = sites?.filter(site =>
    site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    site.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    site.address?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

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
        <Input
          placeholder="Søk sites..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
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
                            <Building2 className="w-3 h-3" />
                            <span>{site.organizations.name}</span>
                          </div>
                        )}
                        {site.location && (
                          <span>{site.location}</span>
                        )}
                      </div>
                      {site.address && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {site.address}
                        </p>
                      )}
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
                    <Button variant="outline" size="sm">
                      Rediger
                    </Button>
                    <Button variant="outline" size="sm">
                      {site.is_active ? 'Deaktiver' : 'Aktiver'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <CreateSiteDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}