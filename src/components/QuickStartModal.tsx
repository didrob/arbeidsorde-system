import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCustomers } from '@/hooks/useApi';
import { useQuickStartWorkOrder } from '@/hooks/useQuickStart';
import { toast } from 'sonner';
import { Loader2, Zap } from 'lucide-react';

interface QuickStartForm {
  customer_id: string;
  description?: string;
}

interface QuickStartModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const QuickStartModal = ({ open, onClose, onSuccess }: QuickStartModalProps) => {
  const { data: customers = [], isLoading: customersLoading } = useCustomers();
  const quickStartMutation = useQuickStartWorkOrder();
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [description, setDescription] = useState('');

  const generateTitle = (customerName: string) => {
    const today = new Intl.DateTimeFormat('nb-NO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date());
    return `Hurtigstart - ${customerName} - ${today}`;
  };

  const handleQuickStart = async () => {
    if (!selectedCustomer) {
      toast.error('Velg kunde');
      return;
    }

    const selectedCustomerData = customers.find(c => c.id === selectedCustomer);
    if (!selectedCustomerData) return;

    const title = generateTitle(selectedCustomerData.name);
    
    try {
      await quickStartMutation.mutateAsync({
        customer_id: selectedCustomer,
        title,
        description: description || undefined,
      });
      
      // Reset form
      setSelectedCustomer('');
      setDescription('');
      
      onSuccess?.();
      onClose();
      toast.success('Arbeidsordre startet!');
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Hurtigstart
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          {/* Customer Selection */}
          <div className="space-y-2">
            <Label htmlFor="customer">Kunde *</Label>
            <Select 
              value={selectedCustomer} 
              onValueChange={setSelectedCustomer}
              disabled={customersLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={customersLoading ? "Laster kunder..." : "Velg kunde"} />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Optional Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Beskrivelse (valgfritt)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kort beskrivelse av arbeidet..."
              className="resize-none"
              rows={3}
            />
          </div>

          {/* Preview */}
          {selectedCustomer && (
            <div className="p-3 bg-muted rounded-lg text-sm">
              <p className="font-medium">Tittel:</p>
              <p className="text-muted-foreground">
                {generateTitle(customers.find(c => c.id === selectedCustomer)?.name || '')}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={quickStartMutation.isPending}
          >
            Avbryt
          </Button>
          <Button 
            onClick={handleQuickStart}
            disabled={!selectedCustomer || quickStartMutation.isPending}
            className="min-w-[120px]"
          >
            {quickStartMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Starter...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Start jobb nå
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};