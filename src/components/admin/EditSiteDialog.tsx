import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateSite, useOrganizations, type Site } from '@/hooks/useOrganizations';

interface EditSiteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  site: (Site & { organizations?: { name: string } }) | null;
}

export function EditSiteDialog({ open, onOpenChange, site }: EditSiteDialogProps) {
  const [name, setName] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  
  const { data: organizations, isLoading: organizationsLoading } = useOrganizations();
  const updateSite = useUpdateSite();

  // Update form when site changes
  useState(() => {
    if (site) {
      setName(site.name);
      setOrganizationId(site.organization_id);
      setLocation(site.location || '');
      setAddress(site.address || '');
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !organizationId || !site) return;

    try {
      await updateSite.mutateAsync({
        id: site.id,
        updates: {
          name: name.trim(),
          organization_id: organizationId,
          location: location.trim() || null,
          address: address.trim() || null
        }
      });
      handleClose();
    } catch (error) {
      console.error('Feil ved oppdatering av site:', error);
    }
  };

  const handleClose = () => {
    setName('');
    setOrganizationId('');
    setLocation('');
    setAddress('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rediger site</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Navn *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Site-navn"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="organization">Organisasjon *</Label>
              <Select value={organizationId} onValueChange={setOrganizationId} required>
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
            <div className="grid gap-2">
              <Label htmlFor="location">Lokasjon</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Lokasjon (valgfri)"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Adresse</Label>
              <Textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Adresse (valgfri)"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Avbryt
            </Button>
            <Button 
              type="submit" 
              disabled={!name.trim() || !organizationId || updateSite.isPending || organizationsLoading}
            >
              {updateSite.isPending ? 'Oppdaterer...' : 'Oppdater site'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}