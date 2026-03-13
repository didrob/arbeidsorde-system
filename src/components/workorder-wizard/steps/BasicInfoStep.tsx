import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Info } from 'lucide-react';
import { useWizard } from '../WizardContext';
import { useCustomers, useFieldWorkers } from '@/hooks/useApi';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useWorkOrders } from '@/hooks/useApi';
import { COST_CENTERS, getInternalCustomerForSite, isInternalCustomer } from '@/lib/internalOrders';

export function BasicInfoStep() {
  const { formData, dispatch } = useWizard();
  const { data: allCustomers } = useCustomers();
  const { data: fieldWorkers } = useFieldWorkers();
  const { data: profile } = useUserProfile();
  const { data: existingOrders } = useWorkOrders();

  // Filter out internal customers from normal customer list
  const customers = allCustomers?.filter((c: any) => !isInternalCustomer(c));
  const internalCustomer = allCustomers ? getInternalCustomerForSite(allCustomers, profile?.site_id) : undefined;

  // Non-internal orders for linked_order_id dropdown
  const linkableOrders = existingOrders?.filter((o: any) => !o.is_internal && o.status !== 'cancelled');

  const updateFormData = (field: string, value: any) => {
    dispatch({ 
      type: 'UPDATE_DATA', 
      payload: { [field]: value } 
    });

    if (field === 'title' || field === 'customer_id') {
      setTimeout(() => {
        if (formData.title && formData.customer_id) {
          dispatch({ type: 'MARK_STEP_COMPLETE', payload: 1 });
        }
      }, 100);
    }
  };

  const handleInternalToggle = (checked: boolean) => {
    if (checked && internalCustomer) {
      dispatch({
        type: 'UPDATE_DATA',
        payload: {
          is_internal: true,
          customer_id: internalCustomer.id,
          price_value: 0,
          pricing_model: 'fixed' as const,
        },
      });
      // Auto-mark step complete if title exists
      if (formData.title) {
        dispatch({ type: 'MARK_STEP_COMPLETE', payload: 1 });
      }
    } else {
      dispatch({
        type: 'UPDATE_DATA',
        payload: {
          is_internal: false,
          customer_id: '',
          cost_center: undefined,
          linked_order_id: undefined,
        },
      });
    }
  };

  React.useEffect(() => {
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

      {/* Internal Order Toggle */}
      <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/30">
        <Switch
          id="internal-toggle"
          checked={formData.is_internal || false}
          onCheckedChange={handleInternalToggle}
          disabled={!internalCustomer}
        />
        <Label htmlFor="internal-toggle" className="cursor-pointer font-medium">
          Intern ordre
        </Label>
        {!internalCustomer && (
          <span className="text-xs text-muted-foreground">(Ingen intern-kunde for denne siten)</span>
        )}
      </div>

      {/* Internal Order Banner */}
      {formData.is_internal && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-[hsl(var(--cobalt))] text-white">
          <Info className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Intern ordre — Ikke fakturerbar</p>
            <p className="text-sm opacity-90">Denne ordren registreres som intern kostnad og vises ikke i fakturering.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          {/* Customer Selection - hidden for internal orders */}
          {!formData.is_internal && (
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
          )}

          {/* Cost Center - only for internal orders */}
          {formData.is_internal && (
            <div className="space-y-2">
              <Label>Kostnadssenter</Label>
              <Select
                value={formData.cost_center || ''}
                onValueChange={(value) => updateFormData('cost_center', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Velg kostnadssenter" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {COST_CENTERS.map((center) => (
                    <SelectItem key={center} value={center}>
                      {center}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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

          {/* Linked Order - only for internal orders */}
          {formData.is_internal && linkableOrders && linkableOrders.length > 0 && (
            <div className="space-y-2">
              <Label>Knyttet til kundeoppdrag (valgfritt)</Label>
              <Select
                value={formData.linked_order_id || ''}
                onValueChange={(value) => updateFormData('linked_order_id', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Velg kundeoppdrag" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {linkableOrders.map((order: any) => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.title} — {order.customer?.name || 'Ukjent'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        <span className="text-destructive">*</span> = Påkrevde felt
      </div>
    </div>
  );
}
