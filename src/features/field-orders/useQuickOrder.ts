import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { sendOrderEmail } from '@/lib/emailService';

const LAST_CUSTOMER_KEY = 'quick-order-last-customer';
const OFFLINE_QUEUE_KEY = 'quick-order-offline-queue';

export interface QuickOrderData {
  title: string;
  customer_id: string;
  is_urgent: boolean;
  image_file?: File | null;
  gps_lat?: number | null;
  gps_lng?: number | null;
}

interface QueuedOrder extends QuickOrderData {
  queued_at: string;
  user_id: string;
}

export const useQuickOrder = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [gpsPosition, setGpsPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get GPS on mount
  const requestGps = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setGpsPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}, // silently fail
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Last used customer
  const getLastCustomerId = (): string | null => {
    try { return localStorage.getItem(LAST_CUSTOMER_KEY); } catch { return null; }
  };

  const setLastCustomerId = (id: string) => {
    try { localStorage.setItem(LAST_CUSTOMER_KEY, id); } catch {}
  };

  // Offline queue
  const getOfflineQueue = (): QueuedOrder[] => {
    try {
      return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
    } catch { return []; }
  };

  const addToQueue = (order: QueuedOrder) => {
    const queue = getOfflineQueue();
    queue.push(order);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  };

  const clearQueue = () => {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  };

  const queueLength = getOfflineQueue().length;

  // Sync offline queue when online
  useEffect(() => {
    const syncQueue = async () => {
      const queue = getOfflineQueue();
      if (queue.length === 0) return;

      for (const order of queue) {
        try {
          await supabase.from('work_orders').insert({
            title: order.title,
            customer_id: order.customer_id,
            user_id: order.user_id,
            status: order.is_urgent ? 'pending' : 'pending',
            pricing_type: 'hourly',
            notes: order.is_urgent ? 'HASTER' : undefined,
            gps_location: order.gps_lat && order.gps_lng
              ? `(${order.gps_lng},${order.gps_lat})`
              : undefined,
          });
        } catch {
          // keep in queue if fails
          return;
        }
      }
      clearQueue();
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
      toast.success(`${queue.length} køede ordrer synkronisert`);
    };

    window.addEventListener('online', syncQueue);
    // Also try on mount
    if (navigator.onLine) syncQueue();
    return () => window.removeEventListener('online', syncQueue);
  }, [queryClient]);

  const createOrder = async (
    data: QuickOrderData,
    action: 'assign_self' | 'send_to_dispatcher'
  ) => {
    if (!user) return;
    setIsSubmitting(true);

    setLastCustomerId(data.customer_id);

    const orderPayload = {
      title: data.title,
      customer_id: data.customer_id,
      user_id: user.id,
      assigned_to: action === 'assign_self' ? user.id : null,
      status: action === 'assign_self' ? 'in_progress' : 'pending',
      started_at: action === 'assign_self' ? new Date().toISOString() : null,
      pricing_type: 'hourly' as const,
      notes: data.is_urgent ? 'HASTER' : undefined,
      gps_location: data.gps_lat && data.gps_lng
        ? `(${data.gps_lng},${data.gps_lat})`
        : undefined,
    };

    if (!navigator.onLine) {
      addToQueue({ ...data, queued_at: new Date().toISOString(), user_id: user.id });
      setIsSubmitting(false);
      toast.success('Ordre lagret i kø — synkes når du er online');
      return;
    }

    try {
      const { data: workOrder, error } = await supabase
        .from('work_orders')
        .insert(orderPayload)
        .select('id')
        .single();

      if (error) throw error;

      // Start time entry if assigning to self
      if (action === 'assign_self' && workOrder) {
        await supabase.from('work_order_time_entries').insert({
          work_order_id: workOrder.id,
          user_id: user.id,
          start_time: new Date().toISOString(),
          notes: 'Hurtigopprettelse fra felt',
        });
      }

      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
      queryClient.invalidateQueries({ queryKey: ['assignedWorkOrders'] });
      queryClient.invalidateQueries({ queryKey: ['activeTimer'] });

      toast.success(
        action === 'assign_self'
          ? 'Ordre opprettet og startet!'
          : 'Ordre sendt til disponent'
      );
    } catch (err: any) {
      toast.error(err.message || 'Kunne ikke opprette ordre');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    gpsPosition,
    requestGps,
    getLastCustomerId,
    createOrder,
    isSubmitting,
    queueLength,
  };
};
