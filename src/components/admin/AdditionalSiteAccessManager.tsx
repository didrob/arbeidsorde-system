import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

interface Site {
  id: string;
  name: string;
}

interface UserSiteAccess {
  id: string;
  site_id: string;
  sites: {
    id: string;
    name: string;
  };
}

interface AdditionalSiteAccessManagerProps {
  availableSites: Site[];
  userAdditionalSites: UserSiteAccess[];
  onGrantAccess: (siteId: string) => void;
  onRevokeAccess: (siteId: string) => void;
  isLoading?: boolean;
}

export function AdditionalSiteAccessManager({
  availableSites,
  userAdditionalSites,
  onGrantAccess,
  onRevokeAccess,
  isLoading = false
}: AdditionalSiteAccessManagerProps) {
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");

  const handleAddAccess = () => {
    if (selectedSiteId) {
      onGrantAccess(selectedSiteId);
      setSelectedSiteId("");
    }
  };

  const availableForGrant = availableSites.filter(site => 
    !userAdditionalSites.some(access => access.site_id === site.id)
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Additional Site Access</Label>
      </div>
      
      {/* Add new site access */}
      {availableForGrant.length > 0 && (
        <div className="flex gap-2">
          <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select site to add access" />
            </SelectTrigger>
            <SelectContent>
              {availableForGrant.map((site) => (
                <SelectItem key={site.id} value={site.id}>
                  {site.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddAccess}
            disabled={!selectedSiteId || isLoading}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Current additional sites */}
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {userAdditionalSites.map((access) => (
          <div key={access.id} className="flex items-center justify-between p-2 border rounded">
            <span className="text-sm">{access.sites.name}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onRevokeAccess(access.site_id)}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {userAdditionalSites.length === 0 && (
          <p className="text-sm text-muted-foreground">No additional site access</p>
        )}
      </div>
    </div>
  );
}