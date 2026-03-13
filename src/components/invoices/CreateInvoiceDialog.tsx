import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCustomers } from "@/hooks/useApi";
import { useWorkOrders } from "@/hooks/useApi";
import { isInternalCustomer } from "@/lib/internalOrders";
import { useCreateInvoice } from "@/hooks/useInvoices";
import { formatCurrency } from "@/lib/utils";

interface CreateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateInvoiceDialog({ open, onOpenChange }: CreateInvoiceDialogProps) {
  const [customerId, setCustomerId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedWorkOrders, setSelectedWorkOrders] = useState<string[]>([]);

  const { data: allCustomers = [] } = useCustomers();
  const customers = allCustomers.filter(c => !isInternalCustomer(c));
  const { data: workOrders = [] } = useWorkOrders();
  const createInvoiceMutation = useCreateInvoice();

  // Set default due date to 30 days from now
  useEffect(() => {
    if (open) {
      const defaultDueDate = new Date();
      defaultDueDate.setDate(defaultDueDate.getDate() + 30);
      setDueDate(defaultDueDate.toISOString().split('T')[0]);
    }
  }, [open]);

  // Filter work orders by selected customer, exclude internal orders
  const filteredWorkOrders = workOrders.filter(wo => 
    wo.customer_id === customerId && wo.status === 'completed' && !wo.is_internal
  );

  const calculateTotal = () => {
    return filteredWorkOrders
      .filter(wo => selectedWorkOrders.includes(wo.id))
      .reduce((sum, wo) => sum + (wo.price_value || 0), 0);
  };

  const handleSubmit = () => {
    if (!customerId || !dueDate) return;

    createInvoiceMutation.mutate({
      customer_id: customerId,
      due_date: dueDate,
      work_order_ids: selectedWorkOrders,
      notes: notes || undefined
    }, {
      onSuccess: () => {
        onOpenChange(false);
        resetForm();
      }
    });
  };

  const resetForm = () => {
    setCustomerId("");
    setDueDate("");
    setNotes("");
    setSelectedWorkOrders([]);
  };

  const handleWorkOrderToggle = (workOrderId: string) => {
    setSelectedWorkOrders(prev => 
      prev.includes(workOrderId) 
        ? prev.filter(id => id !== workOrderId)
        : [...prev, workOrderId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Opprett ny faktura</DialogTitle>
          <DialogDescription>
            Velg kunde og arbeidsordrer som skal faktureres
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column - Basic info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="customer">Kunde *</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg kunde" />
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

            <div>
              <Label htmlFor="dueDate">Forfallsdato *</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="notes">Notater</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ytterligere notater for fakturaen..."
                rows={4}
              />
            </div>

            {selectedWorkOrders.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sammendrag</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Arbeidsordrer valgt:</span>
                      <span>{selectedWorkOrders.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(calculateTotal())}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>MVA (25%):</span>
                      <span>{formatCurrency(calculateTotal() * 0.25)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>{formatCurrency(calculateTotal() * 1.25)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right column - Work orders */}
          <div className="space-y-4">
            <div>
              <Label>Arbeidsordrer for fakturering</Label>
              <div className="text-sm text-muted-foreground mb-3">
                {customerId 
                  ? `Fullførte arbeidsordrer for valgt kunde (${filteredWorkOrders.length})`
                  : "Velg en kunde først for å se arbeidsordrer"
                }
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {customers.length === 0 ? (
                <div className="text-center py-8 space-y-4">
                  <div className="text-muted-foreground">
                    <p className="font-medium">Ingen kunder registrert</p>
                    <p className="text-sm">Du må først registrere kunder for å kunne opprette fakturaer</p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.href = '/customers'}
                    className="mt-2"
                  >
                    Gå til Kunder
                  </Button>
                </div>
              ) : !customerId ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Velg en kunde for å se tilgjengelige arbeidsordrer</p>
                </div>
              ) : workOrders.filter(wo => wo.customer_id === customerId).length === 0 ? (
                <div className="text-center py-8 space-y-4">
                  <div className="text-muted-foreground">
                    <p className="font-medium">Ingen arbeidsordrer for denne kunden</p>
                    <p className="text-sm">Opprett arbeidsordrer først for å kunne fakturere</p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.href = '/work-orders'}
                    className="mt-2"
                  >
                    Opprett arbeidsordre
                  </Button>
                </div>
              ) : filteredWorkOrders.length === 0 ? (
                <div className="text-center py-8 space-y-4">
                  <div className="text-muted-foreground">
                    <p className="font-medium">Ingen fullførte arbeidsordrer for denne kunden</p>
                    <p className="text-sm">Arbeidsordrer må være merket som "fullført" for å kunne faktureres</p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.href = '/work-orders'}
                    className="mt-2"
                  >
                    Administrer arbeidsordrer
                  </Button>
                </div>
              ) : (
                filteredWorkOrders.map((workOrder) => (
                  <Card key={workOrder.id} className="p-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id={workOrder.id}
                        checked={selectedWorkOrders.includes(workOrder.id)}
                        onCheckedChange={() => handleWorkOrderToggle(workOrder.id)}
                      />
                      <div className="flex-1 space-y-1">
                        <Label
                          htmlFor={workOrder.id}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {workOrder.title}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {workOrder.description}
                        </p>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">
                            Fullført: {new Date(workOrder.completed_at).toLocaleDateString('nb-NO')}
                          </span>
                          <span className="font-medium">
                            {formatCurrency(workOrder.price_value || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!customerId || !dueDate || selectedWorkOrders.length === 0 || createInvoiceMutation.isPending}
          >
            {createInvoiceMutation.isPending ? "Oppretter..." : "Opprett faktura"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}