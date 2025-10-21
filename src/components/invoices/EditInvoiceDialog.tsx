import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useUpdateInvoiceMutation } from "@/hooks/useInvoices";
import { formatCurrency } from "@/lib/utils";

interface EditInvoiceDialogProps {
  invoice: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditInvoiceDialog({ invoice, open, onOpenChange }: EditInvoiceDialogProps) {
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  const updateInvoiceMutation = useUpdateInvoiceMutation();

  // Populate form when invoice changes
  useEffect(() => {
    if (invoice && open) {
      setDueDate(invoice.due_date || "");
      setNotes(invoice.notes || "");
      setInternalNotes(invoice.internal_notes || "");
    }
  }, [invoice, open]);

  const handleSubmit = () => {
    if (!invoice || !dueDate) return;

    updateInvoiceMutation.mutate({
      id: invoice.id,
      updates: {
        due_date: dueDate,
        notes: notes || undefined,
        internal_notes: internalNotes || undefined
      }
    }, {
      onSuccess: () => {
        onOpenChange(false);
      }
    });
  };

  const resetForm = () => {
    setDueDate("");
    setNotes("");
    setInternalNotes("");
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rediger faktura {invoice.invoice_number}</DialogTitle>
          <DialogDescription>
            Rediger forfallsdato og notater for fakturaen
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invoice Info (Read-only) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fakturainformasjon</CardTitle>
              <CardDescription>
                Kun forfallsdato og notater kan endres for utkast-fakturaer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Kunde</Label>
                  <p className="font-medium">{invoice.customer?.name || 'Ukjent kunde'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Fakturanummer</Label>
                  <p className="font-medium">{invoice.invoice_number}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Utstedelsesdato</Label>
                  <p>{new Date(invoice.issue_date).toLocaleDateString('nb-NO')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Total beløp</Label>
                  <p className="font-medium">{formatCurrency(invoice.total_amount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Editable Fields */}
          <div className="space-y-4">
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
              <Label htmlFor="notes">Kundenotater</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notater som vises på fakturaen til kunden..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Disse notatene vises på PDF-fakturaen som sendes til kunden
              </p>
            </div>

            <Separator />

            <div>
              <Label htmlFor="internalNotes">Interne notater</Label>
              <Textarea
                id="internalNotes"
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Interne notater for revisjon og oppføling..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Interne notater som kun er synlige for ansatte, ikke på kunde-fakturaen
              </p>
            </div>
          </div>

          {/* Line Items Preview */}
          {invoice.line_items && invoice.line_items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fakturalinjer</CardTitle>
                <CardDescription>
                  Fakturalinjer kan ikke endres etter opprettelse
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {invoice.line_items.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <div>
                        <p className="font-medium text-sm">{item.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} × {formatCurrency(item.unit_price)}
                        </p>
                      </div>
                      <p className="font-medium">{formatCurrency(item.line_total)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!dueDate || updateInvoiceMutation.isPending}
          >
            {updateInvoiceMutation.isPending ? "Lagrer..." : "Lagre endringer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
