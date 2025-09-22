import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWizard } from '../WizardContext';
import { useCustomers } from '@/hooks/useApi';
import { useFieldWorkers } from '@/hooks/useApi';

export function BasicInfoStep() {
  const { formData, dispatch } = useWizard();
  const { data: customers } = useCustomers();
  const { data: fieldWorkers } = useFieldWorkers();

  const updateFormData = (field: string, value: any) => {
    dispatch({ 
      type: 'UPDATE_DATA', 
      payload: { [field]: value } 
    });

    // Mark step as completed if required fields are filled
    if (field === 'title' || field === 'customer_id') {
      setTimeout(() => {
        if (formData.title && formData.customer_id) {
          dispatch({ type: 'MARK_STEP_COMPLETE', payload: 1 });
        }
      }, 100);
    }
  };

  React.useEffect(() => {
    // Check if step should be marked complete on mount
    if (formData.title && formData.customer_id) {
      dispatch({ type: 'MARK_STEP_COMPLETE', payload: 1 });
    }
  }, [formData.title, formData.customer_id, dispatch]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Grunnleggende informasjon</h3>
        <p className="text-sm text-muted-foreground">
          Fyll ut grunnleggende informasjon om arbeidsordren
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customer">Kunde *</Label>
            <Select
              value={formData.customer_id}
              onValueChange={(value) => updateFormData('customer_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Velg kunde" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {customers?.map((customer: any) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!customers || customers.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Ingen kunder tilgjengelig. Opprett en kunde først.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Tittel *</Label>
            <Input
              id="title"
              placeholder="Skriv inn arbeidsordretittel"
              value={formData.title}
              onChange={(e) => updateFormData('title', e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigned_to">Tildel til feltarbeider</Label>
            <Select
              value={formData.assigned_to || ''}
              onValueChange={(value) => updateFormData('assigned_to', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Velg feltarbeider (valgfritt)" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {fieldWorkers?.map((worker: any) => (
                  <SelectItem key={worker.user_id ?? worker.id} value={worker.user_id}>
                    {worker.full_name || worker.user_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Beskrivelse</Label>
            <Textarea
              id="description"
              placeholder="Detaljert beskrivelse av arbeidet som skal utføres"
              value={formData.description || ''}
              onChange={(e) => updateFormData('description', e.target.value)}
              className="min-h-[120px] resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Spesielle kommentarer</Label>
            <Textarea
              id="notes"
              placeholder="Ekstra notater eller spesielle instruksjoner"
              value={formData.notes || ''}
              onChange={(e) => updateFormData('notes', e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>
        </div>
      </div>

      {/* Required field indicator */}
      <div className="text-sm text-muted-foreground">
        <span className="text-destructive">*</span> = Påkrevde felt
      </div>
    </div>
  );
}