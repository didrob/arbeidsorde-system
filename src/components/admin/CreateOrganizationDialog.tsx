import { useState } from 'react';
import { useCreateOrganization } from '@/hooks/useOrganizations';
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
import { Loader2 } from 'lucide-react';

interface CreateOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateOrganizationDialog({ open, onOpenChange }: CreateOrganizationDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  const createOrganization = useCreateOrganization();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;

    try {
      await createOrganization.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      
      setName('');
      setDescription('');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create organization:', error);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Opprett ny organisasjon</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Navn *</Label>
              <Input
                id="org-name"
                placeholder="Organisasjonsnavn"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={createOrganization.isPending}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="org-description">Beskrivelse</Label>
              <Textarea
                id="org-description"
                placeholder="Beskrivelse av organisasjonen (valgfritt)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={createOrganization.isPending}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createOrganization.isPending}
            >
              Avbryt
            </Button>
            <Button 
              type="submit" 
              disabled={!name.trim() || createOrganization.isPending}
            >
              {createOrganization.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Opprett organisasjon
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}