import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, ChevronRight, Play, Pause, CheckCircle, Plus, Camera, Paperclip, AlertTriangle, Search, Bell, LogOut, Menu, Timer } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { useCustomers, useCreateWorkOrder, useStartTimeEntry } from '@/hooks/useApi';
import { toast } from 'sonner';
import { AttachmentUpload } from './AttachmentUpload';
import { useCreateTimeAdjustment, useTimeAdjustments, useUploadAdjustmentAttachment } from '@/hooks/useTimeAdjustments';
import { WorkOrderPool } from './WorkOrderPool';
import { useNotifications } from '@/hooks/useNotifications';
import { PullToRefresh } from './mobile/PullToRefresh';
import { SwipeableCard } from './mobile/SwipeableCard';
import { QuickStartModal } from './QuickStartModal';
import { cn } from '@/lib/utils';

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
  const { user, signOut } = useAuth();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [activeOrder, setActiveOrder] = useState<WorkOrder | null>(null);
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [loading, setLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [isExtraTimeOpen, setIsExtraTimeOpen] = useState(false);
  const [isDeviationOpen, setIsDeviationOpen] = useState(false);
  const [showPool, setShowPool] = useState(false);
  const [extraTimeForm, setExtraTimeForm] = useState({
    reason: '',
    extra_minutes: '',
    notes: ''
  });
  const [deviationForm, setDeviationForm] = useState({
    reason: '',
    notes: ''
  });
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [showTimeDialog, setShowTimeDialog] = useState(false);
  const [showQuickStart, setShowQuickStart] = useState(false);

  const { data: customers } = useCustomers();
  const createWorkOrder = useCreateWorkOrder();
  const startTimeEntry = useStartTimeEntry();
  const { notifications, unreadCount } = useNotifications();
  
  // Time adjustment hooks
  const createTimeAdjustment = useCreateTimeAdjustment();
  const { data: timeAdjustments = [] } = useTimeAdjustments(activeOrder?.id || '');
  const uploadAttachment = useUploadAdjustmentAttachment();
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<QuickWorkOrderForm>();

  useEffect(() => {
    if (user) {
      fetchTodaysWork();
      fetchActiveTimer();
    }
  }, [user]);

  // Timer effect with proper formatting
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

  // Audio notification effect
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('work-order-audio-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'work_orders',
          filter: `assigned_to=eq.${user.id}`
        },
        (payload) => {
          // Play notification sound
          playNotificationSound();
          toast.success(`Ny arbeidsordre: ${payload.new.title}`);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const playNotificationSound = () => {
    // Create audio context and play notification sound
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Create a pleasant notification sound
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Audio notification not supported');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logget ut');
    } catch (error) {
      toast.error('Kunne ikke logge ut');
    }
  };

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

  const updateWorkOrderStatus = async (workOrderId: string, status: string) => {
    try {
      if (status === 'in_progress') {
        // Start via time entry to satisfy RLS/trigger path
        const { error: insertErr } = await supabase
          .from('work_order_time_entries')
          .insert({
            work_order_id: workOrderId,
            user_id: user?.id!,
            start_time: new Date().toISOString(),
            notes: ''
          });
        if (insertErr) throw insertErr;

        // Find and set the active order
        const order = workOrders.find(wo => wo.id === workOrderId);
        if (order) {
          setActiveOrder(order);
        }

        // Fetch fresh timer data
        await fetchActiveTimer();
      } else if (status === 'completed') {
        // Stop the latest active time entry for this user/order
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

        setActiveOrder(null);
        setActiveTimer(null);
      }

      await fetchTodaysWork();
      toast.success(`Arbeidsordre ${status === 'in_progress' ? 'startet' : 'fullført'}!`);
    } catch (error) {
      console.error('Error updating work order:', error);
      toast.error(status === 'in_progress' ? 'Kunne ikke starte arbeidsordre' : 'Kunne ikke fullføre arbeidsordre');
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
    <div className="min-h-screen bg-background safe-area-padding-top">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10 safe-area-padding-top">
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold">Dagens Arbeid</h1>
            <div className="flex items-center gap-2">
              {/* Clock/Timer Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTimeDialog(true)}
                className="focus-ring"
              >
                <Timer className="h-4 w-4" />
              </Button>
              
              {/* Notification Center */}
              <Button
                variant="ghost"
                size="sm"
                className="relative focus-ring"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-4 w-4 text-xs flex items-center justify-center p-0"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>
              
              {/* Menu Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="focus-ring">
                    <Menu className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowPool(!showPool)}>
                    <Search className="h-4 w-4 mr-2" />
                    {showPool ? 'Mine ordrer' : 'Ledig pool'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logg ut
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{workOrders.length} ordrer tildelt</span>
            <span>
              {new Intl.DateTimeFormat('nb-NO', { 
                weekday: 'short', 
                day: 'numeric', 
                month: 'short'
              }).format(new Date())}
            </span>
          </div>
        </div>
      </div>

      <PullToRefresh 
        onRefresh={async () => {
          await fetchTodaysWork();
          await fetchActiveTimer();
        }}
        className="flex-1"
      >
        <div className="p-4 space-y-4 pb-20 safe-area-padding-bottom">
          {/* Show pool or regular work orders */}
          {showPool ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Ledige Ordrer</h2>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowPool(false)}
                  className="focus-ring"
                >
                  Tilbake til mine ordrer
                </Button>
              </div>
              <WorkOrderPool isMobile={true} />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Active Work Timer */}
              {activeOrder && activeTimer && (
                <Card className="border-primary bg-primary/5 animate-fade-in">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>Aktiv Ordre</span>
                      <div className="flex items-center space-x-2 text-primary">
                        <Clock className="h-4 w-4" />
                        <span className="font-mono text-lg animate-pulse-subtle">
                          {Math.floor(elapsedTime / 3600)}:{String(Math.floor((elapsedTime % 3600) / 60)).padStart(2, '0')}:{String(elapsedTime % 60).padStart(2, '0')}
                        </span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h3 className="font-medium">{activeOrder.title}</h3>
                      <p className="text-sm text-muted-foreground">{activeOrder.customer_name}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Start Button */}
              <Card className="bg-primary/5 border-primary/20 animate-fade-in">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-primary">Hurtigstart</h3>
                      <p className="text-sm text-muted-foreground">
                        Start en ny jobb med én gang
                      </p>
                    </div>
                    <Button 
                      onClick={() => setShowQuickStart(true)}
                      className="bg-primary hover:bg-primary/90 focus-ring"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Start jobb
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Pending Orders */}
              {workOrders.filter(order => order.status === 'pending').length === 0 ? (
                <Card className="animate-fade-in">
                  <CardContent className="p-8 text-center">
                    <h3 className="text-lg font-medium mb-2">Ingen ventende ordrer</h3>
                    <p className="text-muted-foreground">
                      Alle dagens arbeidsordrer er fullført!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                workOrders
                  .filter(order => order.status === 'pending')
                  .map((order, index) => (
                    <SwipeableCard
                      key={order.id}
                      className={cn(
                        "transition-all duration-200 hover:shadow-md animate-fade-in"
                      )}
                      rightAction={<Play className="h-5 w-5" />}
                      onSwipeRight={() => updateWorkOrderStatus(order.id, 'in_progress')}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{order.title}</h3>
                          <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                          {order.estimated_hours && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Estimert: {order.estimated_hours}t
                            </p>
                          )}
                        </div>
                        <Button 
                          size="sm" 
                          className="focus-ring"
                          onClick={() => updateWorkOrderStatus(order.id, 'in_progress')}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Start
                        </Button>
                      </div>
                    </SwipeableCard>
                  ))
              )}
            </div>
          )}
        </div>
      </PullToRefresh>

      {/* Time Tracking Dialog */}
      <Dialog open={showTimeDialog} onOpenChange={setShowTimeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tidssporing</DialogTitle>
            <DialogDescription>
              {activeTimer ? 'Aktiv tidssporing' : 'Ingen aktiv tidssporing'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {activeTimer && activeOrder ? (
              <div className="text-center">
                <div className="text-3xl font-mono text-primary mb-2">
                  {Math.floor(elapsedTime / 3600)}:{String(Math.floor((elapsedTime % 3600) / 60)).padStart(2, '0')}:{String(elapsedTime % 60).padStart(2, '0')}
                </div>
                <p className="text-sm text-muted-foreground">{activeOrder.title}</p>
                <p className="text-xs text-muted-foreground">{activeOrder.customer_name}</p>
                <Button 
                  onClick={() => updateWorkOrderStatus(activeOrder.id, 'completed')}
                  className="mt-4 w-full"
                  variant="destructive"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Fullfør arbeid
                </Button>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Ingen aktiv tidssporing</p>
                <p className="text-xs">Start en arbeidsordre for å begynne tidssporing</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Start Modal */}
      <QuickStartModal 
        open={showQuickStart}
        onClose={() => setShowQuickStart(false)}
        onSuccess={async () => {
          await fetchTodaysWork();
          await fetchActiveTimer();
        }}
      />
    </div>
  );
};
