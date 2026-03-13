import React, { useState, useEffect } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, AlertTriangle, Send, Play, Info } from 'lucide-react';
import { SpeechInput } from './SpeechInput';
import { useQuickOrder } from './useQuickOrder';
import { useCustomers } from '@/hooks/useApi';
import { useUserProfile } from '@/hooks/useUserProfile';
import { cn } from '@/lib/utils';
import { COST_CENTERS, getInternalCustomerForSite, isInternalCustomer } from '@/lib/internalOrders';

interface QuickOrderSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const QuickOrderSheet: React.FC<QuickOrderSheetProps> = ({ open, onOpenChange }) => {
  const { gpsPosition, requestGps, getLastCustomerId, createOrder, isSubmitting } = useQuickOrder();
  const { data: allCustomers = [] } = useCustomers();
  const { profile } = useUserProfile();

  const customers = allCustomers.filter((c: any) => !isInternalCustomer(c));
  const internalCustomer = getInternalCustomerForSite(allCustomers, profile?.site_id);

  const [title, setTitle] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [isInternal, setIsInternal] = useState(false);
  const [costCenter, setCostCenter] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (open) {
      requestGps();
      if (!isInternal) {
        const lastId = getLastCustomerId();
        if (lastId && customers.some((c) => c.id === lastId)) {
          setCustomerId(lastId);
        } else if (customers.length > 0) {
          setCustomerId(customers[0].id);
        }
      }
    }
  }, [open, customers, requestGps, getLastCustomerId, isInternal]);

  const handleInternalToggle = (checked: boolean) => {
    setIsInternal(checked);
    if (checked && internalCustomer) {
      setCustomerId(internalCustomer.id);
    } else {
      const lastId = getLastCustomerId();
      if (lastId && customers.some(c => c.id === lastId)) {
        setCustomerId(lastId);
      } else if (customers.length > 0) {
        setCustomerId(customers[0].id);
      }
      setCostCenter('');
    }
  };

  const resetForm = () => {
    setTitle('');
    setIsUrgent(false);
    setIsInternal(false);
    setCostCenter('');
    setImageFile(null);
    setShowConfirmation(false);
  };

  const handleSubmit = () => {
    if (!title.trim() || !customerId) return;
    setShowConfirmation(true);
  };

  const handleAction = async (action: 'assign_self' | 'send_to_dispatcher') => {
    await createOrder(
      {
        title: title.trim(),
        customer_id: customerId,
        is_urgent: isUrgent,
        is_internal: isInternal,
        cost_center: isInternal ? costCenter || undefined : undefined,
        image_file: imageFile,
        gps_lat: gpsPosition?.lat,
        gps_lng: gpsPosition?.lng,
      },
      action
    );
    resetForm();
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} snapPoints={[0.65, 1]}>
      <DrawerContent className="max-h-[96vh]">
        <DrawerHeader className="text-left pb-2">
          <DrawerTitle className="text-xl">Ny ordre</DrawerTitle>
          <DrawerDescription>Registrer et nytt oppdrag raskt</DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-6 space-y-5 overflow-y-auto">
          {!showConfirmation ? (
            <>
              {/* INTERN TOGGLE */}
              {internalCustomer && (
                <div className="flex items-center gap-3 min-h-[56px] rounded-lg bg-muted/50 px-4">
                  <Info
                    size={20}
                    className={cn(isInternal ? 'text-[hsl(var(--cobalt))]' : 'text-muted-foreground')}
                  />
                  <Label htmlFor="internal-toggle-mobile" className="flex-1 text-base cursor-pointer">
                    Intern ordre
                  </Label>
                  <Switch
                    id="internal-toggle-mobile"
                    checked={isInternal}
                    onCheckedChange={handleInternalToggle}
                  />
                </div>
              )}

              {/* Internal Banner */}
              {isInternal && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-[hsl(var(--cobalt))] text-white text-sm">
                  <Info size={16} className="shrink-0" />
                  <span>Intern ordre — Ikke fakturerbar</span>
                </div>
              )}

              {/* HVA */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Hva skal gjøres?
                </Label>
                <SpeechInput
                  value={title}
                  onChange={setTitle}
                  placeholder="Beskriv oppdraget..."
                />
              </div>

              {/* KUNDE - hidden for internal */}
              {!isInternal && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Kunde
                  </Label>
                  <Select value={customerId} onValueChange={setCustomerId}>
                    <SelectTrigger className="min-h-[56px] text-base">
                      <SelectValue placeholder="Velg kunde" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="min-h-[48px] text-base">
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* KOSTNADSSENTER - only for internal */}
              {isInternal && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Kostnadssenter
                  </Label>
                  <Select value={costCenter} onValueChange={setCostCenter}>
                    <SelectTrigger className="min-h-[56px] text-base">
                      <SelectValue placeholder="Velg kostnadssenter" />
                    </SelectTrigger>
                    <SelectContent>
                      {COST_CENTERS.map((center) => (
                        <SelectItem key={center} value={center} className="min-h-[48px] text-base">
                          {center}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* HASTER + BILDE row */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 flex-1 min-h-[56px] rounded-lg bg-muted/50 px-4">
                  <AlertTriangle
                    size={20}
                    className={cn(isUrgent ? 'text-destructive' : 'text-muted-foreground')}
                  />
                  <Label htmlFor="urgent-toggle" className="flex-1 text-base cursor-pointer">
                    Haster
                  </Label>
                  <Switch
                    id="urgent-toggle"
                    checked={isUrgent}
                    onCheckedChange={setIsUrgent}
                    className={cn(isUrgent && 'data-[state=checked]:bg-destructive')}
                  />
                </div>

                <label className="flex items-center justify-center min-h-[56px] min-w-[56px] rounded-lg bg-muted/50 cursor-pointer hover:bg-accent transition-colors relative">
                  <Camera size={24} className="text-muted-foreground" />
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="sr-only"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  />
                  {imageFile && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary" />
                  )}
                </label>
              </div>

              {gpsPosition && (
                <p className="text-xs text-muted-foreground">
                  📍 GPS registrert ({gpsPosition.lat.toFixed(4)}, {gpsPosition.lng.toFixed(4)})
                </p>
              )}

              <Button
                onClick={handleSubmit}
                disabled={!title.trim() || !customerId}
                className="w-full min-h-[56px] text-lg font-semibold bg-asco-teal text-cobalt hover:bg-asco-teal/90"
              >
                Opprett
              </Button>
            </>
          ) : (
            <div className="space-y-4 py-4">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">
                  {isInternal ? 'ASCO Intern' : allCustomers.find((c) => c.id === customerId)?.name}
                  {isUrgent && ' • 🔴 Haster'}
                  {isInternal && ' • 🏢 Intern'}
                </p>
              </div>

              <Button
                onClick={() => handleAction('assign_self')}
                disabled={isSubmitting}
                className="w-full min-h-[56px] text-base font-semibold bg-asco-teal text-cobalt hover:bg-asco-teal/90"
              >
                <Play size={20} className="mr-2" />
                Tildel til meg + Start nå
              </Button>

              <Button
                onClick={() => handleAction('send_to_dispatcher')}
                disabled={isSubmitting}
                variant="outline"
                className="w-full min-h-[56px] text-base font-semibold"
              >
                <Send size={20} className="mr-2" />
                Send til disponent
              </Button>

              <Button
                onClick={() => setShowConfirmation(false)}
                variant="ghost"
                className="w-full min-h-[48px]"
              >
                Tilbake
              </Button>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
