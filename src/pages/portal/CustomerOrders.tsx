import { useState } from 'react';
import { useCustomerOrders, OrderStatusFilter } from '@/hooks/useCustomerOrders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { nb } from 'date-fns/locale';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  pending: { label: 'Ventende', variant: 'outline', color: 'text-status-waiting' },
  in_progress: { label: 'Pågår', variant: 'default', color: 'text-status-active' },
  completed: { label: 'Fullført', variant: 'secondary', color: 'text-status-complete' },
  cancelled: { label: 'Kansellert', variant: 'destructive', color: 'text-status-urgent' },
};

const filters: { value: OrderStatusFilter; label: string }[] = [
  { value: 'all', label: 'Alle' },
  { value: 'pending', label: 'Ventende' },
  { value: 'in_progress', label: 'Pågår' },
  { value: 'completed', label: 'Fullført' },
];

interface OrderDetail {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  scheduled_start: string | null;
  scheduled_end: string | null;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
}

const CustomerOrders = () => {
  const [filter, setFilter] = useState<OrderStatusFilter>('all');
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const { data: orders, isLoading } = useCustomerOrders(filter);

  const timelineSteps = (order: OrderDetail) => {
    const steps = [
      { label: 'Bestilt', time: order.created_at, done: true },
      { label: 'Akseptert', time: order.started_at || order.scheduled_start, done: ['in_progress', 'completed'].includes(order.status) },
      { label: 'Pågår', time: order.started_at, done: ['in_progress', 'completed'].includes(order.status) },
      { label: 'Fullført', time: order.completed_at, done: order.status === 'completed' },
    ];
    return steps;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl text-foreground">Mine ordrer</h1>
        <p className="text-muted-foreground text-sm">Oversikt og status på dine bestillinger</p>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as OrderStatusFilter)}>
        <TabsList>
          {filters.map(f => (
            <TabsTrigger key={f.value} value={f.value}>{f.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : orders?.length === 0 ? (
        <Card className="shadow-brand-sm">
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Ingen ordrer funnet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders?.map(order => {
            const status = statusConfig[order.status] || statusConfig.pending;
            return (
              <Card
                key={order.id}
                className="shadow-brand-sm cursor-pointer hover:shadow-brand-lg transition-shadow"
                onClick={() => setSelectedOrder(order as OrderDetail)}
              >
                <CardContent className="py-4 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">{order.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(order.created_at), 'd. MMM yyyy', { locale: nb })}
                      {order.description && ` — ${order.description.slice(0, 50)}`}
                    </p>
                  </div>
                  <Badge variant={status.variant} className="ml-3 shrink-0">{status.label}</Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading">{selectedOrder.title}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Status badge */}
                <Badge variant={statusConfig[selectedOrder.status]?.variant || 'outline'}>
                  {statusConfig[selectedOrder.status]?.label || selectedOrder.status}
                </Badge>

                {/* Timeline */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">Tidslinje</p>
                  <div className="flex items-center gap-2">
                    {timelineSteps(selectedOrder).map((step, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <div className={`flex flex-col items-center ${i > 0 ? 'ml-1' : ''}`}>
                          <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${
                            step.done ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                          }`}>
                            {step.done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                          </div>
                          <span className="text-[10px] text-muted-foreground mt-0.5">{step.label}</span>
                          {step.time && step.done && (
                            <span className="text-[9px] text-muted-foreground">
                              {format(new Date(step.time), 'd/M', { locale: nb })}
                            </span>
                          )}
                        </div>
                        {i < 3 && <div className={`h-0.5 w-6 ${step.done ? 'bg-primary' : 'bg-muted'}`} />}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Description */}
                {selectedOrder.description && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Beskrivelse</p>
                    <p className="text-sm text-muted-foreground">{selectedOrder.description}</p>
                  </div>
                )}

                {/* Notes from ASCO */}
                {selectedOrder.notes && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Notat fra ASCO</p>
                    <p className="text-sm text-muted-foreground bg-accent p-3 rounded-brand">{selectedOrder.notes}</p>
                  </div>
                )}

                {/* Dates */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Opprettet: {format(new Date(selectedOrder.created_at), 'PPP', { locale: nb })}</p>
                  {selectedOrder.scheduled_start && (
                    <p>Planlagt: {format(new Date(selectedOrder.scheduled_start), 'PPP', { locale: nb })}</p>
                  )}
                  <p>Sist oppdatert: {formatDistanceToNow(new Date(selectedOrder.updated_at), { addSuffix: true, locale: nb })}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerOrders;
