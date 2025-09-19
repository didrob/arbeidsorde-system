import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, ChevronRight, Play, Pause, CheckCircle, Plus, Camera, Paperclip } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { useCustomers, useCreateWorkOrder, useStartTimeEntry } from '@/hooks/useApi';
import { toast } from 'sonner';
import { AttachmentUpload } from './AttachmentUpload';

interface WorkOrder {
  id: string;
  title: string;
  description: string | null;
  status: string;
  customer_name: string;
  estimated_hours?: number | null;
  gps_location?: any;
}

interface QuickWorkOrderForm {
  title: string;
  description: string;
  customer_id: string;
  estimated_hours: number;
}

interface ActiveTimer {
  id: string;
  work_order_id: string;
  start_time: string;
  end_time?: string;
}

export const MobileFieldWorker = () => {
  const { user } = useAuth();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [activeOrder, setActiveOrder] = useState<WorkOrder | null>(null);
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [loading, setLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);

  const { data: customers } = useCustomers();
  const createWorkOrder = useCreateWorkOrder();
  const startTimeEntry = useStartTimeEntry();
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<QuickWorkOrderForm>();

  useEffect(() => {
    if (user) {
      fetchTodaysWork();
      fetchActiveTimer();
    }
  }, [user]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTimer && !activeTimer.end_time) {
      interval = setInterval(() => {
        const startTime = new Date(activeTimer.start_time).getTime();
        const now = Date.now();
        setElapsedTime(Math.floor((now - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTimer]);

  const fetchTodaysWork = async () => {
    try {
      const { data, error } = await supabase
        .from('work_orders')
        .select(`
          *,
          customers (name)
        `)
        .eq('assigned_to', user?.id)
        .in('status', ['pending', 'in_progress'])
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedOrders = data?.map(order => ({
        ...order,
        customer_name: order.customers?.name || 'Unknown Customer'
      })) || [];

      setWorkOrders(formattedOrders);
      
      // Set active order if there's one in progress
      const inProgress = formattedOrders.find(order => order.status === 'in_progress');
      if (inProgress) {
        setActiveOrder(inProgress);
      }
    } catch (error) {
      console.error('Error fetching work orders:', error);
      toast.error('Kunne ikke hente arbeidsordrer');
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveTimer = async () => {
    try {
      const { data, error } = await supabase
        .from('work_order_time_entries')
        .select('*')
        .eq('user_id', user?.id)
        .is('end_time', null)
        .single();

      if (data) {
        setActiveTimer(data);
      }
    } catch (error) {
      // No active timer is fine
    }
  };

  const startWork = async (workOrder: WorkOrder) => {
    try {
      // Start timer
      const { data: timerData, error: timerError } = await supabase
        .from('work_order_time_entries')
        .insert({
          work_order_id: workOrder.id,
          user_id: user?.id,
          start_time: new Date().toISOString()
        })
        .select()
        .single();

      if (timerError) throw timerError;

      // Update work order status
      const { error: updateError } = await supabase
        .from('work_orders')
        .update({ 
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .eq('id', workOrder.id);

      if (updateError) throw updateError;

      setActiveTimer(timerData);
      setActiveOrder({ ...workOrder, status: 'in_progress' });
      
      // Refresh work orders
      fetchTodaysWork();
      
      toast.success(`Startet arbeid på "${workOrder.title}"`);
    } catch (error) {
      console.error('Error starting work:', error);
      toast.error('Kunne ikke starte arbeid');
    }
  };

  const completeWork = async () => {
    if (!activeTimer || !activeOrder) return;

    try {
      // End timer
      const { error: timerError } = await supabase
        .from('work_order_time_entries')
        .update({ end_time: new Date().toISOString() })
        .eq('id', activeTimer.id);

      if (timerError) throw timerError;

      // Update work order status
      const { error: updateError } = await supabase
        .from('work_orders')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', activeOrder.id);

      if (updateError) throw updateError;

      setActiveTimer(null);
      setActiveOrder(null);
      setElapsedTime(0);
      
      // Refresh work orders
      fetchTodaysWork();
      
      toast.success(`Fullført arbeid på "${activeOrder.title}"`);
    } catch (error) {
      console.error('Error completing work:', error);
      toast.error('Kunne ikke fullføre arbeid');
    }
  };

  const handleQuickSubmit = async (data: QuickWorkOrderForm) => {
    try {
      const workOrderData = {
        ...data,
        pricing_type: 'hourly' as const,
        assigned_to: user?.id,
        user_id: user?.id
      };

      const result = await createWorkOrder.mutateAsync(workOrderData);
      if (result.success) {
        toast.success('Raskt oppdrag opprettet - starter automatisk timer...');
        setIsQuickCreateOpen(false);
        reset();
        
        // Auto-start the work order
        await startWork(result.data);
      } else {
        toast.error(result.error?.message || 'Kunne ikke opprette raskt oppdrag');
      }
    } catch (error) {
      toast.error('Kunne ikke opprette raskt oppdrag');
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Venter</Badge>;
      case 'in_progress':
        return <Badge variant="default">Aktiv</Badge>;
      case 'completed':
        return <Badge variant="outline">Fullført</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Laster arbeidsordrer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Dagens Arbeid</h1>
              <p className="text-sm text-muted-foreground">
                {workOrders.length} ordrer tildelt
              </p>
            </div>
            <Dialog open={isQuickCreateOpen} onOpenChange={setIsQuickCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-9">
                  <Plus className="h-4 w-4 mr-1" />
                  Raskt oppdrag
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm mx-4">
                <DialogHeader>
                  <DialogTitle>Opprett raskt oppdrag</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(handleQuickSubmit)} className="space-y-4">
                  <div>
                    <Input
                      placeholder="Tittel"
                      {...register('title', { required: 'Tittel er påkrevd' })}
                    />
                    {errors.title && (
                      <p className="text-destructive text-xs mt-1">{errors.title.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Textarea
                      placeholder="Kort beskrivelse"
                      {...register('description')}
                      className="min-h-[60px] text-sm"
                    />
                  </div>

                  <div>
                    <Select onValueChange={(value) => setValue('customer_id', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Velg kunde" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {customers?.map((customer: any) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <input type="hidden" {...register('customer_id', { required: 'Kunde er påkrevd' })} />
                    {errors.customer_id && (
                      <p className="text-destructive text-xs mt-1">Kunde er påkrevd</p>
                    )}
                  </div>

                  <div>
                    <Input
                      type="number"
                      step="0.5"
                      placeholder="Estimerte timer"
                      {...register('estimated_hours', { 
                        required: 'Estimerte timer er påkrevd',
                        valueAsNumber: true,
                        min: { value: 0.5, message: 'Minimum 0.5 timer' }
                      })}
                    />
                    {errors.estimated_hours && (
                      <p className="text-destructive text-xs mt-1">{errors.estimated_hours.message}</p>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={createWorkOrder.isPending} className="flex-1 h-10">
                      {createWorkOrder.isPending ? 'Oppretter...' : 'Opprett & Start'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsQuickCreateOpen(false)}
                      className="h-10"
                    >
                      Avbryt
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 pb-20">
        {/* Active Work Timer */}
        {activeOrder && activeTimer && (
          <Card className="border-primary bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Aktiv Ordre</span>
                <div className="flex items-center space-x-2 text-primary">
                  <Clock className="h-4 w-4" />
                  <span className="font-mono text-lg">{formatTime(elapsedTime)}</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="font-medium">{activeOrder.title}</h3>
                <p className="text-sm text-muted-foreground">{activeOrder.customer_name}</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setShowAttachments(!showAttachments)}
                  variant="outline"
                  className="flex-1 h-12"
                  size="lg"
                >
                  <Paperclip className="h-5 w-5 mr-2" />
                  Vedlegg
                </Button>
                <Button 
                  onClick={completeWork} 
                  className="flex-1 h-12 text-base"
                  size="lg"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Fullfør
                </Button>
              </div>
              {showAttachments && (
                <div className="mt-4">
                  <AttachmentUpload 
                    workOrderId={activeOrder.id}
                    onUploadComplete={() => {}}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pending Work Orders */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Ventende Ordrer</h2>
          {workOrders.filter(order => order.status === 'pending').map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{order.title}</h3>
                    <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                  </div>
                  {getStatusBadge(order.status)}
                </div>
                
                {order.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {order.description}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center text-xs text-muted-foreground">
                    {order.estimated_hours && (
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {order.estimated_hours}t
                      </div>
                    )}
                    {order.gps_location && (
                      <div className="flex items-center ml-3">
                        <MapPin className="h-3 w-3 mr-1" />
                        Lokasjon
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    onClick={() => startWork(order)}
                    disabled={!!activeOrder}
                    size="sm"
                    className="h-9"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Start
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {workOrders.filter(order => order.status === 'pending').length === 0 && !activeOrder && (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Ingen ventende ordrer</h3>
              <p className="text-muted-foreground">
                Alle dagens arbeidsordrer er fullført!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};