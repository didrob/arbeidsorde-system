import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import { useUserAccessibleSites } from '@/hooks/useOrganizations';
import { useIsMobile } from '@/hooks/use-mobile';

interface SiteSelectorProps {
  selectedSiteId?: string;
  onSiteChange: (siteId: string | undefined) => void;
  className?: string;
}

export function SiteSelector({ selectedSiteId, onSiteChange, className }: SiteSelectorProps) {
  const { data: accessibleSites, isLoading } = useUserAccessibleSites();
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <MapPin className="w-4 h-4" />
        <span className="text-sm">Laster sites...</span>
      </div>
    );
  }

  if (!accessibleSites || accessibleSites.length <= 1) {
    // Only show selector if user has access to multiple sites
    const currentSite = accessibleSites?.[0];
    return currentSite ? (
      <div className={`flex items-center gap-2 ${className}`}>
        <MapPin className="w-4 h-4" />
        <Badge variant="outline">{currentSite.site_name}</Badge>
      </div>
    ) : null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <MapPin className="w-4 h-4 flex-shrink-0" />
      <Select value={selectedSiteId || 'all'} onValueChange={(value) => onSiteChange(value === 'all' ? undefined : value)}>
        <SelectTrigger className={isMobile ? "w-full min-w-[140px]" : "w-[200px]"}>
          <SelectValue placeholder="Velg site" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle sites</SelectItem>
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