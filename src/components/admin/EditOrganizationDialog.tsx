import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateOrganization, type Organization } from '@/hooks/useOrganizations';

interface EditOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: Organization | null;
}

export function EditOrganizationDialog({ open, onOpenChange, organization }: EditOrganizationDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const updateOrganization = useUpdateOrganization();

  // Update form when organization changes
  useState(() => {
    if (organization) {
      setName(organization.name);
      setDescription(organization.description || '');
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !organization) return;

    try {
      await updateOrganization.mutateAsync({
        id: organization.id,
        updates: { name: name.trim(), description: description.trim() || null }
      });
      handleClose();
    } catch (error) {
      console.error('Feil ved oppdatering av organisasjon:', error);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rediger organisasjon</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Navn *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Organisasjonsnavn"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Beskrivelse</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Organisasjonsbeskrivelse (valgfri)"
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
              disabled={!name.trim() || updateOrganization.isPending}
            >
              {updateOrganization.isPending ? 'Oppdaterer...' : 'Oppdater organisasjon'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}