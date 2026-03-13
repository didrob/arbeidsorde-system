import { useState, useEffect } from 'react';
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
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  
  const { data: organizations, isLoading: organizationsLoading } = useOrganizations();
  const updateSite = useUpdateSite();

  useEffect(() => {
    if (site) {
      setName(site.name);
      setOrganizationId(site.organization_id);
      setLocation(site.location || '');
      setAddress(site.address || '');
      setLatitude(site.latitude?.toString() || '');
      setLongitude(site.longitude?.toString() || '');
      setContactEmail(site.contact_email || '');
      setContactPhone(site.contact_phone || '');
    }
  }, [site]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !organizationId || !site) return;

    try {
      await updateSite.mutateAsync({
        id: site.id,
        updates: {
          name: name.trim(),
          organization_id: organizationId,
          location: location.trim() || undefined,
          address: address.trim() || undefined,
          latitude: latitude ? parseFloat(latitude) : undefined,
          longitude: longitude ? parseFloat(longitude) : undefined,
          contact_email: contactEmail.trim() || undefined,
          contact_phone: contactPhone.trim() || undefined,
        }
      });
      handleClose();
    } catch (error) {
      console.error('Feil ved oppdatering av site:', error);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rediger site</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Navn *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Site-navn" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organization">Organisasjon *</Label>
              <Select value={organizationId} onValueChange={setOrganizationId} required>
                <SelectTrigger><SelectValue placeholder="Velg organisasjon" /></SelectTrigger>
                <SelectContent>
                  {organizations?.map((org) => (
                    <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Lokasjon</Label>
              <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Lokasjon (valgfri)" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Adresse (valgfri)" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-lat">Breddegrad</Label>
                <Input id="edit-lat" type="number" step="any" placeholder="58.0942" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lng">Lengdegrad</Label>
                <Input id="edit-lng" type="number" step="any" placeholder="6.8045" value={longitude} onChange={(e) => setLongitude(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Kontakt-epost</Label>
              <Input id="edit-email" type="email" placeholder="site@asco.no" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Kontakttelefon</Label>
              <Input id="edit-phone" type="tel" placeholder="+47 000 00 000" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>Avbryt</Button>
            <Button type="submit" disabled={!name.trim() || !organizationId || updateSite.isPending || organizationsLoading}>
              {updateSite.isPending ? 'Oppdaterer...' : 'Oppdater site'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
