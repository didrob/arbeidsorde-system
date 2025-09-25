import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCustomers } from '@/hooks/useApi';
import { useEquipment } from '@/hooks/useResources';
import { useQuickStartWorkOrder } from '@/hooks/useQuickStart';
import { toast } from 'sonner';
import { Loader2, Zap, Calculator, Plus, X } from 'lucide-react';

interface SelectedEquipment {
  id: string;
  quantity: number;
  rate: number;
  pricing_type: 'hourly' | 'daily' | 'fixed';
}

interface QuickStartModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const QuickStartModal = ({ open, onClose, onSuccess }: QuickStartModalProps) => {
  const { data: customers = [], isLoading: customersLoading } = useCustomers();
  const { data: equipmentList = [], isLoading: equipmentLoading } = useEquipment();
  const quickStartMutation = useQuickStartWorkOrder();
  
  // Form state
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [description, setDescription] = useState('');
  const [pricingModel, setPricingModel] = useState<'fixed' | 'hourly'>('fixed');
  const [fixedPrice, setFixedPrice] = useState<string>('');
  const [estimatedHours, setEstimatedHours] = useState<string>('');
  const [hourlyRate, setHourlyRate] = useState<string>('500');
  const [selectedEquipment, setSelectedEquipment] = useState<SelectedEquipment[]>([]);
  const [newEquipmentId, setNewEquipmentId] = useState<string>('');
  const [newEquipmentQuantity, setNewEquipmentQuantity] = useState<string>('1');

  const generateTitle = (customerName: string) => {
    const today = new Intl.DateTimeFormat('nb-NO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date());
    return `Hurtigstart - ${customerName} - ${today}`;
  };

  // Calculate total estimated cost
  const totalEstimatedCost = useMemo(() => {
    let total = 0;
    
    if (pricingModel === 'fixed' && fixedPrice) {
      total += parseFloat(fixedPrice) || 0;
    } else if (pricingModel === 'hourly' && estimatedHours && hourlyRate) {
      total += (parseFloat(estimatedHours) || 0) * (parseFloat(hourlyRate) || 0);
    }
    
    selectedEquipment.forEach(eq => {
      total += eq.quantity * eq.rate;
    });
    
    return total;
  }, [pricingModel, fixedPrice, estimatedHours, hourlyRate, selectedEquipment]);

  const addEquipment = () => {
    if (!newEquipmentId) return;
    
    const equipment = equipmentList.find(e => e.id === newEquipmentId);
    if (!equipment) return;
    
    const quantity = parseFloat(newEquipmentQuantity) || 1;
    
    setSelectedEquipment(prev => [...prev, {
      id: equipment.id,
      quantity,
      rate: equipment.standard_rate || 0,
      pricing_type: equipment.pricing_type as 'hourly' | 'daily' | 'fixed'
    }]);
    
    setNewEquipmentId('');
    setNewEquipmentQuantity('1');
  };

  const removeEquipment = (index: number) => {
    setSelectedEquipment(prev => prev.filter((_, i) => i !== index));
  };

  const handleQuickStart = async () => {
    if (!selectedCustomer) {
      toast.error('Velg kunde');
      return;
    }

    // Validate pricing inputs
    if (pricingModel === 'fixed' && (!fixedPrice || parseFloat(fixedPrice) <= 0)) {
      toast.error('Skriv inn gyldig fastpris');
      return;
    }

    if (pricingModel === 'hourly' && (!estimatedHours || !hourlyRate || parseFloat(estimatedHours) <= 0 || parseFloat(hourlyRate) <= 0)) {
      toast.error('Skriv inn gyldige timer og timepris');
      return;
    }

    const selectedCustomerData = customers.find(c => c.id === selectedCustomer);
    if (!selectedCustomerData) return;

    const title = generateTitle(selectedCustomerData.name);
    
    try {
      const requestData = {
        customer_id: selectedCustomer,
        title,
        description: description || undefined,
        pricing_model: pricingModel === 'fixed' ? 'fixed' as const : 'resource_based' as const,
        pricing_type: pricingModel === 'fixed' ? 'fixed' as const : 'hourly' as const,
        price_value: pricingModel === 'fixed' ? parseFloat(fixedPrice) : undefined,
        estimated_hours: pricingModel === 'hourly' ? parseFloat(estimatedHours) : undefined,
        hourly_rate: pricingModel === 'hourly' ? parseFloat(hourlyRate) : undefined,
        equipment: selectedEquipment.length > 0 ? selectedEquipment : undefined
      };

      await quickStartMutation.mutateAsync(requestData);
      
      // Reset form
      setSelectedCustomer('');
      setDescription('');
      setPricingModel('fixed');
      setFixedPrice('');
      setEstimatedHours('');
      setHourlyRate('500');
      setSelectedEquipment([]);
      
      onSuccess?.();
      onClose();
      toast.success('Arbeidsordre startet!');
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Hurtigstart
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
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

          {/* Pricing Model */}
          <div className="space-y-3">
            <Label>Prismodell *</Label>
            <RadioGroup value={pricingModel} onValueChange={(value: 'fixed' | 'hourly') => setPricingModel(value)} className="grid grid-cols-2 gap-4">
              <div>
                <RadioGroupItem value="fixed" id="fixed" className="peer sr-only" />
                <Label htmlFor="fixed" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                  <Calculator className="mb-3 h-6 w-6" />
                  Fastpris
                </Label>
              </div>
              <div>
                <RadioGroupItem value="hourly" id="hourly" className="peer sr-only" />
                <Label htmlFor="hourly" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                  <Zap className="mb-3 h-6 w-6" />
                  Timepris
                </Label>
              </div>
            </RadioGroup>

            {/* Pricing Input Fields */}
            {pricingModel === 'fixed' ? (
              <div className="space-y-2">
                <Label htmlFor="fixedPrice">Fastpris (kr) *</Label>
                <Input
                  id="fixedPrice"
                  type="number"
                  placeholder="0"
                  value={fixedPrice}
                  onChange={(e) => setFixedPrice(e.target.value)}
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estimatedHours">Estimerte timer *</Label>
                  <Input
                    id="estimatedHours"
                    type="number"
                    step="0.5"
                    placeholder="0"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Timepris (kr) *</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    placeholder="500"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Equipment Section */}
          <div className="space-y-3">
            <Label>Utstyr (valgfritt)</Label>
            <div className="space-y-3">
              {/* Add Equipment */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Select
                        value={newEquipmentId}
                        onValueChange={setNewEquipmentId}
                        disabled={equipmentLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={equipmentLoading ? "Laster utstyr..." : "Velg utstyr"} />
                        </SelectTrigger>
                        <SelectContent>
                          {equipmentList
                            .filter(e => !selectedEquipment.find(se => se.id === e.id))
                            .map(equipment => (
                            <SelectItem key={equipment.id} value={equipment.id}>
                              {equipment.name} - {equipment.standard_rate || 0} kr/{equipment.pricing_type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-20">
                      <Input
                        type="number"
                        placeholder="1"
                        value={newEquipmentQuantity}
                        onChange={(e) => setNewEquipmentQuantity(e.target.value)}
                        min="1"
                        step="1"
                      />
                    </div>
                    <Button onClick={addEquipment} disabled={!newEquipmentId} size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Selected Equipment List */}
              {selectedEquipment.map((eq, index) => {
                const equipmentData = equipmentList.find(e => e.id === eq.id);
                return (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{equipmentData?.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {eq.quantity} x {eq.rate} kr = {(eq.quantity * eq.rate).toLocaleString('no-NO')} kr
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeEquipment(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
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

          <Separator />

          {/* Preview */}
          {selectedCustomer && (
            <div className="space-y-3">
              <div className="p-3 bg-muted rounded-lg text-sm">
                <p className="font-medium">Arbeidsordre:</p>
                <p className="text-muted-foreground">
                  {generateTitle(customers.find(c => c.id === selectedCustomer)?.name || '')}
                </p>
              </div>
              
              {/* Cost Preview */}
              {totalEstimatedCost > 0 && (
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Estimert kostnad:</span>
                    <span className="text-lg font-bold text-primary">
                      {totalEstimatedCost.toLocaleString('no-NO')} kr
                    </span>
                  </div>
                  {pricingModel === 'hourly' && estimatedHours && hourlyRate && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {estimatedHours} timer × {hourlyRate} kr/time
                      {selectedEquipment.length > 0 && ' + utstyr'}
                    </p>
                  )}
                </div>
              )}
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