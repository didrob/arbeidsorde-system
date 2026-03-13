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
import { WorkOrderCompletionDialog } from './WorkOrderCompletionDialog';
import { WorkOrderConfirmationDialog } from './WorkOrderConfirmationDialog';
import { TimeTracker } from './TimeTracker';

import { QuickOrderSheet } from '@/features/field-orders/QuickOrderSheet';
import { useQuickOrder } from '@/features/field-orders/useQuickOrder';
import { 
  useAssignedWorkOrders, 
  useActiveTimer, 
  useActiveWorkOrder,
  useFieldWorkerRealtime,
  useRefreshFieldWorkerData,
  usePoolNotifications
} from '@/hooks/useFieldWorkerState';
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
  
  // Replace local state with persistent React Query hooks
  const { data: workOrders = [], isLoading: workOrdersLoading, refetch: refetchWorkOrders } = useAssignedWorkOrders();
  const { data: activeTimer, refetch: refetchActiveTimer } = useActiveTimer();
  const { data: activeOrder } = useActiveWorkOrder();
  const { data: poolNotificationCount = 0 } = usePoolNotifications();
  const refreshFieldWorkerData = useRefreshFieldWorkerData();
  
  // Setup realtime updates
  useFieldWorkerRealtime();
  
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [isExtraTimeOpen, setIsExtraTimeOpen] = useState(false);
  const [isDeviationOpen, setIsDeviationOpen] = useState(false);
  const [showPool, setShowPool] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [completingOrder, setCompletingOrder] = useState<WorkOrder | null>(null);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [pendingCompletionOrder, setPendingCompletionOrder] = useState<WorkOrder | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
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
  const [showTimeTracker, setShowTimeTracker] = useState(false);
  const [activeWorkOrderId, setActiveWorkOrderId] = useState<string | null>(null);
  const [quickOrderOpen, setQuickOrderOpen] = useState(false);
  const { queueLength } = useQuickOrder();

  const { data: customers } = useCustomers();
  const createWorkOrder = useCreateWorkOrder();
  const startTimeEntry = useStartTimeEntry();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  
  // Time adjustment hooks
  const createTimeAdjustment = useCreateTimeAdjustment();
  const { data: timeAdjustments = [] } = useTimeAdjustments(activeOrder?.id || '');
  const uploadAttachment = useUploadAdjustmentAttachment();
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<QuickWorkOrderForm>();

  // Timer effect with proper formatting
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (activeTimer && !activeTimer.end_time) {
      interval = setInterval(() => {
        const startTime = new Date(activeTimer.start_time).getTime();
        const now = Date.now();
        setElapsedTime(Math.floor((now - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTimer]);

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

  const updateWorkOrderStatus = async (workOrderId: string, status: string) => {
    try {
      if (status === 'in_progress') {
        // Don't create time entry here - let TimeTracker handle it
        // Just update work order status and open TimeTracker
        const { error: updateErr } = await supabase
          .from('work_orders')
          .update({ status: 'in_progress', started_at: new Date().toISOString() })
          .eq('id', workOrderId);
        
        if (updateErr) throw updateErr;

        // Open TimeTracker for this work order
        setActiveWorkOrderId(workOrderId);
        setShowTimeTracker(true);
        
        // Refresh data using React Query
        await Promise.all([
          refetchWorkOrders(),
          refetchActiveTimer()
        ]);
        
        toast.success('Arbeidsordre startet! Start tidssporing i TimeTracker.');
      } else if (status === 'completed') {
        // Show confirmation dialog first
        const order = workOrders.find(wo => wo.id === workOrderId);
        if (order) {
          setPendingCompletionOrder(order);
          setShowConfirmationDialog(true);
        }
      }
    } catch (error) {
      console.error('Error updating work order:', error);
      toast.error('Kunne ikke oppdatere arbeidsordre');
    }
  };

  const handleCompletionSuccess = async () => {
    // Refresh all data after successful completion
    await refreshFieldWorkerData();
    setCompletingOrder(null);
    setShowCompletionDialog(false);
    
    // Show enhanced success message
    toast.success(
      `Arbeidsordre "${completingOrder?.title}" er fullført!`,
      {
        description: "Ordren er nå registrert som fullført og klar for fakturering."
      }
    );
  };

  const handleConfirmCompletion = async () => {
    if (!pendingCompletionOrder) return;

    try {
      // Stop active timer if exists
      if (activeTimer && activeTimer.work_order_id === pendingCompletionOrder.id) {
        const { error: stopErr } = await supabase
          .from('work_order_time_entries')
          .update({ end_time: new Date().toISOString() })
          .eq('id', activeTimer.id);
        
        if (stopErr) throw stopErr;
        
        // Refresh active timer state
        await refetchActiveTimer();
      }
      
      // Close confirmation and open completion dialog
      setShowConfirmationDialog(false);
      setCompletingOrder(pendingCompletionOrder);
      setShowCompletionDialog(true);
      setPendingCompletionOrder(null);
      
    } catch (error) {
      console.error('Error stopping timer:', error);
      toast.error('Kunne ikke stoppe tidssporing');
    }
  };

  if (workOrdersLoading) {
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
                onClick={() => setShowNotifications(true)}
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
                    <span>{showPool ? 'Mine ordrer' : 'Ledig pool'}</span>
                    {!showPool && poolNotificationCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="ml-2 h-4 text-xs"
                      >
                        {poolNotificationCount} nye
                      </Badge>
                    )}
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
        onRefresh={refreshFieldWorkerData}
        className="flex-1"
      >
        <div className="p-4 space-y-4 pb-20 safe-area-padding-bottom">
          {/* Show pool or regular work orders */}
          {showPool ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">Ledige Ordrer</h2>
                  {poolNotificationCount > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {poolNotificationCount} nye
                    </Badge>
                  )}
                </div>
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
                      <div className="flex items-center space-x-2 text-foreground">
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

              {/* Show ALL assigned orders (not just active one) - supporting multiple orders */}
              {workOrders.length > 0 && (
                <Card className="animate-fade-in">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>Mine tildelte ordrer</span>
                      <Badge variant="secondary">{workOrders.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {workOrders.map((order) => (
                      <div key={order.id} className={cn(
                        "p-3 rounded-lg border transition-all",
                        order.status === 'in_progress' 
                          ? "border-primary bg-primary/5" 
                          : "border-border bg-card hover:bg-accent/50"
                      )}>
                        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{order.title}</h4>
                              <Badge variant={order.status === 'in_progress' ? 'default' : 'secondary'}>
                                {order.status === 'in_progress' ? 'Aktiv' : 'Venter'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                            {order.estimated_hours && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Estimert: {order.estimated_hours}t
                              </p>
                            )}
                          </div>
                          
                          {order.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => updateWorkOrderStatus(order.id, 'in_progress')}
                              className="focus-ring"
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Start
                            </Button>
                          )}
                           
                          {order.status === 'in_progress' && (
                            <div className="flex flex-col gap-2 w-full">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setActiveWorkOrderId(order.id);
                                  setShowTimeTracker(true);
                                }}
                                className="focus-ring w-full"
                              >
                                <Clock className="h-4 w-4 mr-2" />
                                Timer
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateWorkOrderStatus(order.id, 'completed')}
                                className="focus-ring bg-status-complete-subtle border-status-complete text-status-complete hover:bg-status-complete-subtle/80 w-full"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Fullfør
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Show message when no orders */}
              {workOrders.length === 0 && (
                <Card className="animate-fade-in">
                  <CardContent className="p-8 text-center">
                    <h3 className="text-lg font-medium mb-2">Ingen tildelte ordrer</h3>
                    <p className="text-muted-foreground mb-4">
                      Du har ingen arbeidsordrer tildelt for øyeblikket.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setShowPool(true)}
                      className="focus-ring"
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Se ledige ordrer
                    </Button>
                  </CardContent>
                </Card>
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
                <div className="text-3xl font-mono text-foreground mb-2">
                  {Math.floor(elapsedTime / 3600)}:{String(Math.floor((elapsedTime % 3600) / 60)).padStart(2, '0')}:{String(elapsedTime % 60).padStart(2, '0')}
                </div>
                <p className="text-sm text-muted-foreground">{activeOrder.title}</p>
                <p className="text-xs text-muted-foreground">{activeOrder.customer_name}</p>
                <Button 
                  onClick={() => updateWorkOrderStatus(activeOrder.id, 'completed')}
                  className="mt-4 w-full"
                  variant="outline"
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
        onSuccess={refreshFieldWorkerData}
      />

      {/* Work Order Confirmation Dialog */}
      {pendingCompletionOrder && (
        <WorkOrderConfirmationDialog
          open={showConfirmationDialog}
          onClose={() => {
            setShowConfirmationDialog(false);
            setPendingCompletionOrder(null);
          }}
          workOrder={pendingCompletionOrder}
          onConfirm={handleConfirmCompletion}
        />
      )}

      {/* Work Order Completion Dialog */}
      {completingOrder && (
        <WorkOrderCompletionDialog
          open={showCompletionDialog}
          onClose={() => {
            setShowCompletionDialog(false);
            setCompletingOrder(null);
          }}
          workOrder={completingOrder}
          onComplete={handleCompletionSuccess}
        />
      )}

      {/* TimeTracker Dialog */}
      <Dialog open={showTimeTracker} onOpenChange={setShowTimeTracker}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tidssporing</DialogTitle>
            <DialogDescription>
              Registrer arbeidstid for denne ordren
            </DialogDescription>
          </DialogHeader>
          {activeWorkOrderId && (
            <TimeTracker 
              workOrderId={activeWorkOrderId}
              onComplete={() => {
                setShowTimeTracker(false);
                setActiveWorkOrderId(null);
                refreshFieldWorkerData();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Notifications Dialog */}
      <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Varsler</span>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={markAllAsRead}
                >
                  Merk alle som lest
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {notifications.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Ingen varsler
              </p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border ${
                    !notification.read ? 'bg-muted/50' : ''
                  }`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{notification.title}</h4>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.created_at).toLocaleTimeString('nb-NO', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-destructive mt-2" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          {notifications.length > 0 && (
            <div className="flex justify-between">
              <Button variant="outline" size="sm" onClick={clearAll}>
                Tøm alle
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowNotifications(false)}>
                Lukk
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Quick Order Sheet (opened from bottom nav) */}
      <QuickOrderSheet open={quickOrderOpen} onOpenChange={setQuickOrderOpen} />
    </div>
  );
};