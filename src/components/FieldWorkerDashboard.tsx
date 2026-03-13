import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, User, CheckCircle, Play, Square } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { TimeTracker } from './TimeTracker';
import { MaterialTracker } from './MaterialTracker';

interface WorkOrder {
  id: string;
  title: string;
  description: string;
  status: string;
  customer: {
    name: string;
    address: string;
    phone: string;
  };
  estimated_hours: number;
  created_at: string;
  started_at: string;
  completed_at: string;
}

export function FieldWorkerDashboard() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeWorkOrder, setActiveWorkOrder] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchAssignedWorkOrders();
    }
  }, [user]);

  const fetchAssignedWorkOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('work_orders')
        .select(`
          id, title, description, status, estimated_hours,
          created_at, started_at, completed_at,
          customer:customers!work_orders_customer_id_fkey (name, address, phone)
        `)
        .eq('assigned_to', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkOrders(data || []);
    } catch (error) {
      console.error('Error fetching work orders:', error);
      toast({
        variant: "destructive",
        title: "Feil ved henting av arbeidsordrer",
        description: "Kunne ikke hente dine arbeidsordrer.",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateWorkOrderStatus = async (workOrderId: string, status: string) => {
    try {
      if (status === 'in_progress') {
        const { error: insertErr } = await supabase
          .from('work_order_time_entries')
          .insert({
            work_order_id: workOrderId,
            user_id: user?.id!,
            start_time: new Date().toISOString(),
            notes: ''
          });
        if (insertErr) throw insertErr;
        setActiveWorkOrder(workOrderId);
      } else if (status === 'completed') {
        const { data: activeEntry, error: fetchErr } = await supabase
          .from('work_order_time_entries')
          .select('*')
          .eq('work_order_id', workOrderId)
          .eq('user_id', user?.id!)
          .is('end_time', null)
          .order('start_time', { ascending: false })
          .limit(1)
          .single();
        if (fetchErr) throw fetchErr;

        const { error: stopErr } = await supabase
          .from('work_order_time_entries')
          .update({ end_time: new Date().toISOString() })
          .eq('id', activeEntry.id);
        if (stopErr) throw stopErr;
        setActiveWorkOrder(null);
      }

      await fetchAssignedWorkOrders();
      toast({
        title: 'Status oppdatert',
        description: `Arbeidsordre ${status === 'in_progress' ? 'startet' : 'fullført'}.`,
      });
    } catch (error) {
      console.error('Error updating work order:', error);
      toast({
        variant: 'destructive',
        title: 'Feil',
        description: status === 'in_progress' ? 'Kunne ikke starte arbeidsordre.' : 'Kunne ikke fullføre arbeidsordre.',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-status-active border-status-active">Venter</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="text-primary-text border-primary-text">Pågår</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-status-complete border-status-complete">Fullført</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const pendingOrders = workOrders.filter(wo => wo.status === 'pending');
  const activeOrders = workOrders.filter(wo => wo.status === 'in_progress');
  const completedOrders = workOrders.filter(wo => wo.status === 'completed');

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      <div className="text-center pb-4">
        <h1 className="text-2xl font-bold text-foreground">Mine Arbeidsordrer</h1>
        <p className="text-muted-foreground">Feltarbeider Dashboard</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-status-active">{pendingOrders.length}</div>
            <div className="text-sm text-muted-foreground">Venter</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-primary-text">{activeOrders.length}</div>
            <div className="text-sm text-muted-foreground">Aktiv</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-status-complete">{completedOrders.length}</div>
            <div className="text-sm text-muted-foreground">Fullført</div>
          </CardContent>
        </Card>
      </div>

      {activeWorkOrder && (
        <TimeTracker 
          workOrderId={activeWorkOrder} 
          onComplete={() => setActiveWorkOrder(null)}
        />
      )}

      {pendingOrders.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Nye Oppdrag</h2>
          {pendingOrders.map((workOrder) => (
            <Card key={workOrder.id} className="border-l-4 border-l-status-active">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{workOrder.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{workOrder.description}</p>
                  </div>
                  {getStatusBadge(workOrder.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4" />
                  <span>{workOrder.customer.name}</span>
                </div>
                {workOrder.customer.address && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4" />
                    <span>{workOrder.customer.address}</span>
                  </div>
                )}
                {workOrder.estimated_hours && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>{workOrder.estimated_hours} timer estimert</span>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => updateWorkOrderStatus(workOrder.id, 'in_progress')}
                    className="flex-1"
                    size="lg"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Jobb
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeOrders.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Pågående Arbeid</h2>
          {activeOrders.map((workOrder) => (
            <Card key={workOrder.id} className="border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{workOrder.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{workOrder.description}</p>
                  </div>
                  {getStatusBadge(workOrder.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4" />
                  <span>{workOrder.customer.name}</span>
                </div>
                {workOrder.customer.address && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4" />
                    <span>{workOrder.customer.address}</span>
                  </div>
                )}
                {workOrder.started_at && (
                  <div className="text-sm text-muted-foreground">
                    Startet: {format(new Date(workOrder.started_at), 'dd.MM.yyyy HH:mm')}
                  </div>
                )}
                <MaterialTracker workOrderId={workOrder.id} />
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => updateWorkOrderStatus(workOrder.id, 'completed')}
                    className="flex-1"
                    size="lg"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Fullfør Jobb
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {completedOrders.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Fullførte Oppdrag</h2>
          {completedOrders.slice(0, 3).map((workOrder) => (
            <Card key={workOrder.id} className="border-l-4 border-l-status-complete opacity-75">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{workOrder.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{workOrder.customer.name}</p>
                  </div>
                  {getStatusBadge(workOrder.status)}
                </div>
              </CardHeader>
              {workOrder.completed_at && (
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Fullført: {format(new Date(workOrder.completed_at), 'dd.MM.yyyy HH:mm')}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {workOrders.length === 0 && (
        <Card className="text-center py-8">
          <CardContent>
            <p className="text-muted-foreground">
              Du har ingen tildelte arbeidsordrer for øyeblikket.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
