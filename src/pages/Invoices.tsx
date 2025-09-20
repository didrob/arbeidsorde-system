import { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, FileText, Download, Send, Eye, Edit } from "lucide-react";
import { useInvoices, useCreateInvoice } from "@/hooks/useInvoices";
import { LoadingState } from "@/components/common/LoadingState";
import { CreateInvoiceDialog } from "@/components/invoices/CreateInvoiceDialog";
import { InvoiceDetailsDialog } from "@/components/invoices/InvoiceDetailsDialog";
import { formatCurrency, formatDate } from "@/lib/utils";

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

export default function Invoices() {
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const { data: invoices = [], isLoading, error } = useInvoices();

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <PageLayout title="Fakturaer">
        <div className="text-center py-8">
          <p className="text-destructive">Kunne ikke laste fakturaer: {error.message}</p>
        </div>
      </PageLayout>
    );
  }

  const handleCreateInvoice = () => {
    setShowCreateDialog(true);
  };

  const handleViewInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setShowDetailsDialog(true);
  };

  return (
    <PageLayout 
      title="Fakturaer" 
      description="Administrer fakturagrunnlag og generer fakturaer"
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground">Fakturaer</h1>
            <p className="text-muted-foreground">
              Administrer fakturagrunnlag fra fullførte arbeidsordrer
            </p>
          </div>
          <Button onClick={handleCreateInvoice} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Ny faktura
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utkast</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {invoices.filter((i: any) => i.status === 'draft').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sendt</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {invoices.filter((i: any) => i.status === 'sent').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Betalt</CardTitle>
              <FileText className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {invoices.filter((i: any) => i.status === 'paid').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total verdi</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  invoices.reduce((sum: number, invoice: any) => sum + (invoice.total_amount || 0), 0)
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoices Table */}
        <Card>
          <CardHeader>
            <CardTitle>Fakturaer</CardTitle>
            <CardDescription>
              Oversikt over alle fakturaer og deres status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Ingen fakturaer ennå
                </h3>
                <p className="text-muted-foreground mb-4">
                  Opprett din første faktura basert på fullførte arbeidsordrer
                </p>
                <Button onClick={handleCreateInvoice}>
                  <Plus className="h-4 w-4 mr-2" />
                  Opprett faktura
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fakturanummer</TableHead>
                    <TableHead>Kunde</TableHead>
                    <TableHead>Dato</TableHead>
                    <TableHead>Forfallsdato</TableHead>
                    <TableHead>Beløp</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Handlinger</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice: any) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.invoice_number}
                      </TableCell>
                      <TableCell>
                        {invoice.customer?.name || 'Ukjent kunde'}
                      </TableCell>
                      <TableCell>
                        {formatDate(invoice.issue_date)}
                      </TableCell>
                      <TableCell>
                        {formatDate(invoice.due_date)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(invoice.total_amount)}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[invoice.status as keyof typeof statusColors]}>
                          {statusLabels[invoice.status as keyof typeof statusLabels]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewInvoice(invoice)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={invoice.status !== 'draft'}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <CreateInvoiceDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      <InvoiceDetailsDialog
        invoice={selectedInvoice}
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
      />
    </PageLayout>
  );
}