import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, ChevronRight, Play, Pause, CheckCircle, Plus, Camera, Paperclip, AlertTriangle, Search, Bell } from 'lucide-react';
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
            <div className="flex items-center gap-2">
              {/* Notification Center */}
              <Button
                variant="ghost"
                size="sm"
                className="relative"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 text-xs flex items-center justify-center p-0"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>
              
              {/* Pool toggle */}
              <Button
                variant={showPool ? "default" : "outline"}
                size="sm"
                onClick={() => setShowPool(!showPool)}
                className="h-9"
              >
                <Search className="h-4 w-4 mr-1" />
                Pool
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 pb-20">
        {/* Show pool or regular work orders */}
        {showPool ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Ledige Ordrer</h2>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowPool(false)}
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
              <Card className="border-primary bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>Aktiv Ordre</span>
                    <div className="flex items-center space-x-2 text-primary">
                      <Clock className="h-4 w-4" />
                      <span className="font-mono text-lg">{elapsedTime}</span>
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

            {/* Pending Orders */}
            {workOrders.filter(order => order.status === 'pending').length === 0 ? (
              <Card>
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
                .map(order => (
                  <Card key={order.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{order.title}</h3>
                          <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                        </div>
                        <Button size="sm">
                          <Play className="h-4 w-4 mr-1" />
                          Start
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
