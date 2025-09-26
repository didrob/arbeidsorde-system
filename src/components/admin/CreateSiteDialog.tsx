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
      });
      
      setName('');
      setOrganizationId('');
      setLocation('');
      setAddress('');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create site:', error);
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
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Opprett nytt site</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="site-name">Navn *</Label>
              <Input
                id="site-name"
                placeholder="Site navn"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={createSite.isPending}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization">Organisasjon *</Label>
              <Select
                value={organizationId}
                onValueChange={setOrganizationId}
                disabled={createSite.isPending}
                required
              >
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
            
            <div className="space-y-2">
              <Label htmlFor="site-location">Lokasjon</Label>
              <Input
                id="site-location"
                placeholder="By eller område"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={createSite.isPending}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="site-address">Adresse</Label>
              <Textarea
                id="site-address"
                placeholder="Fullstendig adresse (valgfritt)"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={createSite.isPending}
                rows={2}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createSite.isPending}
            >
              Avbryt
            </Button>
            <Button 
              type="submit" 
              disabled={!name.trim() || !organizationId || createSite.isPending}
            >
              {createSite.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Opprett site
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}