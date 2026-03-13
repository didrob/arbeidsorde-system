import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import { useUserAccessibleSites } from '@/hooks/useOrganizations';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';

interface SiteSelectorProps {
  selectedSiteId?: string;
  onSiteChange: (siteId: string | undefined) => void;
  className?: string;
}

export function SiteSelector({ selectedSiteId, onSiteChange, className }: SiteSelectorProps) {
  const { data: accessibleSites, isLoading, error } = useUserAccessibleSites();
  const isMobile = useIsMobile();
  const { isSystemAdmin } = useAuth();

  useEffect(() => {
    if (accessibleSites && accessibleSites.length === 1 && !selectedSiteId) {
      onSiteChange(accessibleSites[0].site_id);
    }
  }, [accessibleSites, selectedSiteId, onSiteChange]);

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <MapPin className="w-4 h-4" />
        <span className="text-sm">Laster sites...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <MapPin className="w-4 h-4" />
        <span className="text-sm text-destructive">Feil ved lasting av sites</span>
      </div>
    );
  }

  if (!accessibleSites || accessibleSites.length === 0) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <MapPin className="w-4 h-4" />
        <span className="text-sm text-muted-foreground">Ingen sites tilgjengelig</span>
      </div>
    );
  }

  if (accessibleSites.length === 1) {
    const currentSite = accessibleSites[0];
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <MapPin className="w-4 h-4" />
        <Badge variant="outline">{currentSite.site_name}</Badge>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <MapPin className="w-4 h-4 flex-shrink-0" />
      <Select value={selectedSiteId || 'all'} onValueChange={(value) => onSiteChange(value === 'all' ? undefined : value)}>
        <SelectTrigger className={isMobile ? "w-full min-w-[140px]" : "w-[200px]"}>
          <SelectValue placeholder="Velg site" />
        </SelectTrigger>
        <SelectContent>
          {isSystemAdmin && (
            <SelectItem value="all">Alle lokasjoner</SelectItem>
          )}
          {accessibleSites.map((site) => (
            <SelectItem key={site.site_id} value={site.site_id}>
              <div className="flex flex-col">
                <span>{site.site_name}</span>
                <span className="text-xs text-muted-foreground">{site.organization_name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
