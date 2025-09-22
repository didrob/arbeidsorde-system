import { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, FileText, Download, Send, Eye, Edit, Archive } from "lucide-react";
import { useInvoices, useCreateInvoice, useDownloadInvoicePDF } from "@/hooks/useInvoices";
import { LoadingState } from "@/components/common/LoadingState";
import { CreateInvoiceDialog } from "@/components/invoices/CreateInvoiceDialog";
import { InvoiceDetailsDialog } from "@/components/invoices/InvoiceDetailsDialog";
import { EditInvoiceDialog } from "@/components/invoices/EditInvoiceDialog";
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
  const [showEditDialog, setShowEditDialog] = useState(false);

  const { data: invoices = [], isLoading, error } = useInvoices();
  const downloadPDFMutation = useDownloadInvoicePDF();

  // Separate active and cancelled invoices
  const activeInvoices = invoices.filter(i => i.status !== 'cancelled');
  const cancelledInvoices = invoices.filter(i => i.status === 'cancelled');

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

  const handleEditInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setShowEditDialog(true);
  };

  const handleDownloadPDF = (invoice: any) => {
    downloadPDFMutation.mutate(invoice.id);
  };

  const InvoiceTable = ({ invoices: tableInvoices, showArchived = false }) => (
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
        {tableInvoices.map((invoice: any) => (
          <TableRow
            key={invoice.id}
            className={showArchived ? "opacity-60" : ""}
          >
            <TableCell className="font-medium">
              {invoice.invoice_number}
              {showArchived && <Archive className="inline-block ml-2 h-3 w-3 text-gray-500" />}
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
                  onClick={() => handleEditInvoice(invoice)}
                  disabled={invoice.status !== 'draft'}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadPDF(invoice)}
                  disabled={downloadPDFMutation.isPending}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

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
              <CardTitle className="text-sm font-medium">Aktive fakturaer</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activeInvoices.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Utkast, sendt, betalt
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Arkiverte</CardTitle>
              <Archive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {cancelledInvoices.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Kansellerte fakturaer
              </p>
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
              <CardTitle className="text-sm font-medium">Aktiv verdi</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  activeInvoices.reduce((sum: number, invoice: any) => sum + (invoice.total_amount || 0), 0)
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Ekskl. kansellerte
              </p>
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
              <div className="text-center py-12 space-y-6">
                <div>
                  <FileText className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Ingen fakturaer ennå
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    For å opprette fakturaer trenger du fullførte arbeidsordrer med korrekt prising
                  </p>
                </div>
                
                <div className="bg-muted/50 rounded-lg p-6 max-w-lg mx-auto">
                  <h4 className="font-medium mb-3">Slik kommer du i gang:</h4>
                  <div className="space-y-2 text-sm text-left">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-medium">1</div>
                      <span>Registrer kunder i systemet</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-medium">2</div>
                      <span>Opprett arbeidsordrer for kundene</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-medium">3</div>
                      <span>Merk arbeidsordrer som fullført når arbeidet er utført</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-medium">4</div>
                      <span>Opprett fakturaer basert på fullførte arbeidsordrer</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={() => window.location.href = '/work-orders'}>
                    <FileText className="h-4 w-4 mr-2" />
                    Arbeidsordrer
                  </Button>
                  <Button onClick={handleCreateInvoice}>
                    <Plus className="h-4 w-4 mr-2" />
                    Opprett faktura
                  </Button>
                </div>
              </div>
            ) : (
              <Tabs defaultValue="active" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="active">
                    Aktive fakturaer ({activeInvoices.length})
                  </TabsTrigger>
                  <TabsTrigger value="archived">
                    Arkiverte ({cancelledInvoices.length})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="active" className="mt-4">
                  <InvoiceTable invoices={activeInvoices} />
                </TabsContent>
                <TabsContent value="archived" className="mt-4">
                  {cancelledInvoices.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Archive className="mx-auto h-12 w-12 mb-4 opacity-50" />
                      <p>Ingen arkiverte fakturaer</p>
                    </div>
                  ) : (
                    <InvoiceTable invoices={cancelledInvoices} showArchived={true} />
                  )}
                </TabsContent>
              </Tabs>
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
        onEdit={handleEditInvoice}
      />

      <EditInvoiceDialog
        invoice={selectedInvoice}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />
    </PageLayout>
  );
}