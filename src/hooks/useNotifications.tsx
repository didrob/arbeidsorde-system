import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Notification {
  id: string;
  type: 'assignment' | 'status_change' | 'message' | 'urgent';
  title: string;
  message: string;
  work_order_id?: string;
  read: boolean;
  created_at: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;

    try {
      // For now, we'll simulate notifications based on work order changes
      // In a real app, you'd have a notifications table
      const { data: workOrders } = await supabase
        .from('work_orders')
        .select('*')
        .eq('assigned_to', user.id)
        .order('updated_at', { ascending: false })
        .limit(10);

      // Convert recent work order updates to notifications
      const mockNotifications: Notification[] = workOrders?.map(order => ({
        id: `wo-${order.id}`,
        type: 'assignment' as const,
        title: 'Ny arbeidsordre tildelt',
        message: `Du har fått tildelt: ${order.title}`,
        work_order_id: order.id,
        read: false,
        created_at: order.updated_at
      })) || [];

      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Listen for real-time work order changes
  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    // Subscribe to work order changes
    const channel = supabase
      .channel('work-order-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'work_orders',
          filter: `assigned_to=eq.${user.id}`
        },
        (payload) => {
          const workOrder = payload.new;
          
          // Show toast notification for real-time updates
          if (workOrder.status === 'in_progress') {
            toast({
              title: 'Arbeidsordre oppdatert',
              description: `${workOrder.title} er nå i gang`
            });
          }

          // Refresh notifications
          fetchNotifications();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'work_orders',
          filter: `assigned_to=eq.${user.id}`
        },
        (payload) => {
          const workOrder = payload.new;
          
          // Show toast for new assignment
          toast({
            title: 'Ny arbeidsordre tildelt',
            description: workOrder.title
          });

          // Add to notifications
          const newNotification: Notification = {
            id: `wo-new-${workOrder.id}`,
            type: 'assignment',
            title: 'Ny arbeidsordre tildelt',
            message: `Du har fått tildelt: ${workOrder.title}`,
            work_order_id: workOrder.id,
            read: false,
            created_at: new Date().toISOString()
          };

          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  // Mark notification as read
  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  // Clear all notifications
  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    refresh: fetchNotifications
  };
};