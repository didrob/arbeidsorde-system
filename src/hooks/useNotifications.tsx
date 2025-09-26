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

  // Fetch notifications - now only real notifications, not mock data
  const fetchNotifications = async () => {
    if (!user) return;
    // Real notifications would be fetched from a notifications table
    // For now, we start with empty notifications
    setNotifications([]);
    setUnreadCount(0);
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

          // Add real notification for status change
          const newNotification: Notification = {
            id: `wo-update-${workOrder.id}`,
            type: 'status_change',
            title: 'Arbeidsordre oppdatert',
            message: `${workOrder.title} er nå i gang`,
            work_order_id: workOrder.id,
            read: false,
            created_at: new Date().toISOString()
          };

          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
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