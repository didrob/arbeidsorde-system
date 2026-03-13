import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import {
  useReadyForSalesOrder,
  useSalesOrders,
  useSalesOrder,
  useCreateSalesOrder,
  useUpdateSalesOrderStatus,
  useDeleteSalesOrder,
  type SalesOrder,
  type ReadyCustomerGroup,
} from '@/hooks/useSalesOrders';
import { exportSalesOrderCSV, exportSalesOrderPDF } from '@/utils/salesOrderExport';
import {
  Plus, FileText, Download, Check, Trash2, CreditCard, FileDown,
  ClipboardList, CheckCircle2, Upload, Banknote,
} from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/use-mobile';

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: 'Utkast', className: 'bg-muted text-muted-foreground' },
  approved: { label: 'Godkjent', className: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300' },
  exported: { label: 'Eksportert', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  paid: { label: 'Betalt', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' },
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('nb-NO', { style: 'currency', currency: 'NOK', maximumFractionDigits: 0 }).format(amount);
}

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.draft;
  return <Badge className={config.className}>{config.label}</Badge>;
}

export default function SalesOrders() {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('draft');
  const [selectedSOId, setSelectedSOId] = useState<string | null>(null);

  const { data: readyGroups = [], isLoading: readyLoading } = useReadyForSalesOrder();
  const { data: allOrders = [], isLoading: ordersLoading } = useSalesOrders();
  const { data: detail } = useSalesOrder(selectedSOId);
  const createSO = useCreateSalesOrder();
  const updateStatus = useUpdateSalesOrderStatus();
  const deleteSO = useDeleteSalesOrder();

  const filtered = allOrders.filter(o => o.status === activeTab);
  const counts = {
    draft: allOrders.filter(o => o.status === 'draft').length,
    approved: allOrders.filter(o => o.status === 'approved').length,
    exported: allOrders.filter(o => o.status === 'exported').length,
    paid: allOrders.filter(o => o.status === 'paid').length,
  };

  const handleCreateAll = () => {
    readyGroups.forEach(g => createSO.mutate(g));
  };

  const handleExportCSV = () => {
    if (detail) exportSalesOrderCSV(detail.salesOrder, detail.lines);
  };

  const handleExportPDF = () => {
    if (detail) exportSalesOrderPDF(detail.salesOrder, detail.lines);
  };

  // Group detail lines by item_type
  const lineGroups = detail?.lines.reduce((acc, line) => {
    const type = line.item_type || 'Annet';
    if (!acc[type]) acc[type] = [];
    acc[type].push(line);
    return acc;
  }, {} as Record<string, typeof detail.lines>) || {};

  const typeLabels: Record<string, string> = {
    hourly: 'Timebasert', fixed: 'Fastpris', material_only: 'Kun materiell',
  };

  return (
    <PageLayout title="Salgsordrer" description="Generer og administrer salgsordrer for eksport">
      {/* Ready for Sales Order */}
      {readyGroups.length > 0 && (
        <Card className="border-primary/30 bg-primary/5 mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-teal-600" />
                Klare for salgsordre
                <Badge variant="secondary">{readyGroups.reduce((s, g) => s + g.orders.length, 0)} ordrer</Badge>
              </CardTitle>
              <Button size="sm" onClick={handleCreateAll} disabled={createSO.isPending}>
                <Plus className="h-4 w-4 mr-1" /> Opprett alle
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {readyGroups.map(group => (
                <Card key={group.customer_id} className="bg-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm truncate">{group.customer_name}</p>
                      <Badge variant="outline" className="text-xs">{group.orders.length} ordrer</Badge>
                    </div>
                    <p className="text-lg font-semibold text-foreground mb-3">
                      {formatCurrency(group.estimated_total)}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => createSO.mutate(group)}
                      disabled={createSO.isPending}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Opprett salgsordre
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {(['draft', 'approved', 'exported', 'paid'] as const).map(status => {
          const cfg = statusConfig[status];
          const count = counts[status];
          const total = allOrders.filter(o => o.status === status).reduce((s, o) => s + o.total_amount, 0);
          return (
            <Card key={status} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab(status)}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">{cfg.label}</p>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(total)}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="draft">Utkast ({counts.draft})</TabsTrigger>
          <TabsTrigger value="approved">Godkjent ({counts.approved})</TabsTrigger>
          <TabsTrigger value="exported">Eksportert ({counts.exported})</TabsTrigger>
          <TabsTrigger value="paid">Betalt ({counts.paid})</TabsTrigger>
        </TabsList>

        {(['draft', 'approved', 'exported', 'paid'] as const).map(status => (
          <TabsContent key={status} value={status}>
            {filtered.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Ingen salgsordrer med status «{statusConfig[status].label}»
                </CardContent>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SO-nummer</TableHead>
                      <TableHead>Kunde</TableHead>
                      {!isMobile && <TableHead>Periode</TableHead>}
                      <TableHead className="text-right">Beløp</TableHead>
                      <TableHead>Status</TableHead>
                      {!isMobile && <TableHead>Dato</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(so => (
                      <TableRow
                        key={so.id}
                        className="cursor-pointer"
                        onClick={() => setSelectedSOId(so.id)}
                      >
                        <TableCell className="font-mono text-sm">{so.sales_order_number}</TableCell>
                        <TableCell>{(so.customers as any)?.name || '—'}</TableCell>
                        {!isMobile && (
                          <TableCell className="text-sm text-muted-foreground">
                            {so.period_from && so.period_to
                              ? `${so.period_from} — ${so.period_to}`
                              : '—'}
                          </TableCell>
                        )}
                        <TableCell className="text-right font-medium">{formatCurrency(so.total_amount)}</TableCell>
                        <TableCell><StatusBadge status={so.status} /></TableCell>
                        {!isMobile && (
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(so.created_at), 'dd. MMM yyyy', { locale: nb })}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Detail Modal */}
      <Dialog open={!!selectedSOId} onOpenChange={(open) => !open && setSelectedSOId(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className="font-mono">{detail.salesOrder.sales_order_number}</span>
                  <StatusBadge status={detail.salesOrder.status} />
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Customer + Period */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Kunde</p>
                    <p className="font-medium">{(detail.salesOrder.customers as any)?.name}</p>
                    {(detail.salesOrder.customers as any)?.org_number && (
                      <p className="text-xs text-muted-foreground">Org.nr: {(detail.salesOrder.customers as any).org_number}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-muted-foreground">Periode</p>
                    <p className="font-medium">
                      {detail.salesOrder.period_from && detail.salesOrder.period_to
                        ? `${detail.salesOrder.period_from} — ${detail.salesOrder.period_to}`
                        : 'Ikke angitt'}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Lines grouped by type */}
                {Object.entries(lineGroups).map(([type, groupLines]) => (
                  <div key={type}>
                    <p className="text-sm font-semibold mb-2">{typeLabels[type] || type}</p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Beskrivelse</TableHead>
                          <TableHead className="text-right">Beløp</TableHead>
                          <TableHead className="text-right">MVA</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groupLines.map(line => (
                          <TableRow key={line.id}>
                            <TableCell className="text-sm">{line.description}</TableCell>
                            <TableCell className="text-right text-sm">{formatCurrency(line.line_total)}</TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground">{formatCurrency(line.vat_amount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ))}

                <Separator />

                {/* Totals */}
                <div className="space-y-1 text-sm text-right">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(detail.salesOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">MVA (25%)</span>
                    <span>{formatCurrency(detail.salesOrder.tax_amount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base pt-1">
                    <span>Total</span>
                    <span>{formatCurrency(detail.salesOrder.total_amount)}</span>
                  </div>
                </div>

                <Separator />

                {/* Actions */}
                <div className="flex flex-wrap gap-2 justify-end">
                  {detail.salesOrder.status === 'draft' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { deleteSO.mutate(detail.salesOrder.id); setSelectedSOId(null); }}
                        disabled={deleteSO.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Slett
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => updateStatus.mutate({ id: detail.salesOrder.id, status: 'approved' })}
                        disabled={updateStatus.isPending}
                      >
                        <Check className="h-4 w-4 mr-1" /> Godkjenn
                      </Button>
                    </>
                  )}
                  {detail.salesOrder.status === 'approved' && (
                    <>
                      <Button variant="outline" size="sm" onClick={handleExportCSV}>
                        <Download className="h-4 w-4 mr-1" /> CSV
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleExportPDF}>
                        <FileDown className="h-4 w-4 mr-1" /> PDF
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          updateStatus.mutate({ id: detail.salesOrder.id, status: 'exported' });
                          handleExportCSV();
                        }}
                        disabled={updateStatus.isPending}
                      >
                        <Upload className="h-4 w-4 mr-1" /> Eksporter
                      </Button>
                    </>
                  )}
                  {(detail.salesOrder.status === 'approved' || detail.salesOrder.status === 'exported') && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => updateStatus.mutate({ id: detail.salesOrder.id, status: 'paid' })}
                      disabled={updateStatus.isPending}
                    >
                      <Banknote className="h-4 w-4 mr-1" /> Marker betalt
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
