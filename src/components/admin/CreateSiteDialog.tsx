import { useState } from 'react';
import { useOrganizations, useCreateSite } from '@/hooks/useOrganizations';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface CreateSiteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateSiteDialog({ open, onOpenChange }: CreateSiteDialogProps) {
  const [name, setName] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  
  const { data: organizations } = useOrganizations();
  const createSite = useCreateSite();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !organizationId) return;

    try {
      await createSite.mutateAsync({
        name: name.trim(),
        organization_id: organizationId,
        location: location.trim() || undefined,
        address: address.trim() || undefined,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        contact_email: contactEmail.trim() || undefined,
        contact_phone: contactPhone.trim() || undefined,
      });
      handleClose();
    } catch (error) {
      console.error('Failed to create site:', error);
    }
  };

  const handleClose = () => {
    setName('');
    setOrganizationId('');
    setLocation('');
    setAddress('');
    setLatitude('');
    setLongitude('');
    setContactEmail('');
    setContactPhone('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Opprett nytt site</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="site-name">Navn *</Label>
              <Input id="site-name" placeholder="Site navn" value={name} onChange={(e) => setName(e.target.value)} disabled={createSite.isPending} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization">Organisasjon *</Label>
              <Select value={organizationId} onValueChange={setOrganizationId} disabled={createSite.isPending} required>
                <SelectTrigger><SelectValue placeholder="Velg organisasjon" /></SelectTrigger>
                <SelectContent>
                  {organizations?.map((org) => (
                    <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="site-location">Lokasjon</Label>
              <Input id="site-location" placeholder="By eller område" value={location} onChange={(e) => setLocation(e.target.value)} disabled={createSite.isPending} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="site-address">Adresse</Label>
              <Textarea id="site-address" placeholder="Fullstendig adresse (valgfritt)" value={address} onChange={(e) => setAddress(e.target.value)} disabled={createSite.isPending} rows={2} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="site-lat">Breddegrad</Label>
                <Input id="site-lat" type="number" step="any" placeholder="58.0942" value={latitude} onChange={(e) => setLatitude(e.target.value)} disabled={createSite.isPending} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="site-lng">Lengdegrad</Label>
                <Input id="site-lng" type="number" step="any" placeholder="6.8045" value={longitude} onChange={(e) => setLongitude(e.target.value)} disabled={createSite.isPending} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="site-email">Kontakt-epost</Label>
              <Input id="site-email" type="email" placeholder="site@asco.no" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} disabled={createSite.isPending} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="site-phone">Kontakttelefon</Label>
              <Input id="site-phone" type="tel" placeholder="+47 000 00 000" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} disabled={createSite.isPending} />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={createSite.isPending}>Avbryt</Button>
            <Button type="submit" disabled={!name.trim() || !organizationId || createSite.isPending}>
              {createSite.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Opprett site
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
