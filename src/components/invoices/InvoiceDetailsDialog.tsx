import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Download, Send, Edit, Check, X } from "lucide-react";
import { useUpdateInvoiceStatus } from "@/hooks/useInvoices";
import { formatCurrency, formatDate } from "@/lib/utils";

interface InvoiceDetailsDialogProps {
  invoice: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusColors = {
  draft: "bg-secondary text-secondary-foreground",
  sent: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800", 
  overdue: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
};

const statusLabels = {
  draft: "Utkast",
  sent: "Sendt",
  paid: "Betalt",
  overdue: "Forfalt",
  cancelled: "Kansellert",
};

export function InvoiceDetailsDialog({ invoice, open, onOpenChange }: InvoiceDetailsDialogProps) {
  const updateStatusMutation = useUpdateInvoiceStatus();

  if (!invoice) return null;

  const handleStatusChange = (status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled') => {
    updateStatusMutation.mutate({ id: invoice.id, status });
  };

  const canEdit = invoice.status === 'draft';
  const canMarkAsSent = invoice.status === 'draft';
  const canMarkAsPaid = invoice.status === 'sent';
  const canCancel = ['draft', 'sent'].includes(invoice.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Faktura {invoice.invoice_number}
            <Badge className={statusColors[invoice.status as keyof typeof statusColors]}>
              {statusLabels[invoice.status as keyof typeof statusLabels]}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Fakturadetaljer og handlinger
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {canEdit && (
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Rediger
              </Button>
            )}
            {canMarkAsSent && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleStatusChange('sent')}
                disabled={updateStatusMutation.isPending}
              >
                <Send className="h-4 w-4 mr-2" />
                Marker som sendt
              </Button>
            )}
            {canMarkAsPaid && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleStatusChange('paid')}
                disabled={updateStatusMutation.isPending}
                className="text-green-600 border-green-600 hover:bg-green-50"
              >
                <Check className="h-4 w-4 mr-2" />
                Marker som betalt
              </Button>
            )}
            {canCancel && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleStatusChange('cancelled')}
                disabled={updateStatusMutation.isPending}
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                <X className="h-4 w-4 mr-2" />
                Avbryt faktura
              </Button>
            )}
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Last ned PDF
            </Button>
          </div>

          {/* Invoice header info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Kundeinformasjon</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="font-medium">{invoice.customer?.name || 'Ukjent kunde'}</p>
                  {invoice.customer?.contact_person && (
                    <p className="text-sm text-muted-foreground">
                      Kontakt: {invoice.customer.contact_person}
                    </p>
                  )}
                  {invoice.customer?.email && (
                    <p className="text-sm text-muted-foreground">
                      E-post: {invoice.customer.email}
                    </p>
                  )}
                  {invoice.customer?.address && (
                    <p className="text-sm text-muted-foreground">
                      {invoice.customer.address}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fakturadetaljer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fakturadato:</span>
                  <span>{formatDate(invoice.issue_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Forfallsdato:</span>
                  <span>{formatDate(invoice.due_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Opprettet:</span>
                  <span>{formatDate(invoice.created_at)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Line items */}
          <Card>
            <CardHeader>
              <CardTitle>Fakturalinjer</CardTitle>
              <CardDescription>
                Detaljert oversikt over tjenester og kostnader
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invoice.line_items && invoice.line_items.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Beskrivelse</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Antall</TableHead>
                      <TableHead className="text-right">Enhetspris</TableHead>
                      <TableHead className="text-right">Sum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.line_items.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {item.item_type === 'service' && 'Tjeneste'}
                            {item.item_type === 'material' && 'Materiale'}
                            {item.item_type === 'equipment' && 'Utstyr'}
                            {item.item_type === 'extra_time' && 'Ekstratid'}
                            {item.item_type === 'adjustment' && 'Justering'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.line_total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  Ingen fakturalinjer funnet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Totals */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>MVA (25%):</span>
                  <span>{formatCurrency(invoice.tax_amount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Totalt å betale:</span>
                  <span>{formatCurrency(invoice.total_amount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notater</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}