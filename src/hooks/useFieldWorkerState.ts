import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { toast } from 'sonner';

interface WorkOrder {
  id: string;
  title: string;
  description: string | null;
  status: string;
  customer_name: string;
  estimated_hours?: number | null;
  gps_location?: any;
  customers?: { name: string };
}

interface ActiveTimer {
  id: string;
  work_order_id: string;
  start_time: string;
  end_time?: string;
}

// Persistent query keys for field worker state
const FIELD_WORKER_KEYS = {
  assignedOrders: (userId: string) => ['fieldWorker', 'assignedOrders', userId],
  activeTimer: (userId: string) => ['fieldWorker', 'activeTimer', userId],
  activeOrder: (userId: string) => ['fieldWorker', 'activeOrder', userId],
} as const;

// Hook for getting assigned work orders with persistent cache
export const useAssignedWorkOrders = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: FIELD_WORKER_KEYS.assignedOrders(user?.id || ''),
    queryFn: async (): Promise<WorkOrder[]> => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('work_orders')
        .select(`
          *,
          customers (name)
        `)
        .eq('assigned_to', user.id)
        .in('status', ['pending', 'in_progress'])
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data?.map(order => ({
        ...order,
        customer_name: order.customers?.name || 'Unknown Customer'
      })) || [];
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache for offline
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};

// Hook for getting active timer with persistent cache
export const useActiveTimer = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: FIELD_WORKER_KEYS.activeTimer(user?.id || ''),
    queryFn: async (): Promise<ActiveTimer | null> => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('work_order_time_entries')
        .select('*')
        .eq('user_id', user.id)
        .is('end_time', null)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      return data || null;
    },
    enabled: !!user?.id,
    staleTime: 10 * 1000, // 10 seconds
    gcTime: 5 * 60 * 1000,
    refetchInterval: 30 * 1000, // Check every 30 seconds for timer sync
  });
};

// Hook for getting active work order (the one in progress)
export const useActiveWorkOrder = () => {
  const { user } = useAuth();
  const { data: assignedOrders = [] } = useAssignedWorkOrders();
  
  return useQuery({
    queryKey: FIELD_WORKER_KEYS.activeOrder(user?.id || ''),
    queryFn: async (): Promise<WorkOrder | null> => {
      const activeOrder = assignedOrders.find(order => order.status === 'in_progress');
      return activeOrder || null;
    },
    enabled: !!user?.id && assignedOrders.length > 0,
    staleTime: 10 * 1000,
  });
};

// Hook for realtime updates with automatic cache invalidation
export const useFieldWorkerRealtime = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('field-worker-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'work_orders',
          filter: `assigned_to=eq.${user.id}`
        },
        (payload) => {
          // Invalidate assigned orders to show new order
          queryClient.invalidateQueries({ 
            queryKey: FIELD_WORKER_KEYS.assignedOrders(user.id) 
          });
          toast.success(`Ny arbeidsordre: ${payload.new.title}`);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'work_orders',
          filter: `assigned_to=eq.${user.id}`
        },
        (payload) => {
          // Invalidate all related queries
          queryClient.invalidateQueries({ 
            queryKey: FIELD_WORKER_KEYS.assignedOrders(user.id) 
          });
          queryClient.invalidateQueries({ 
            queryKey: FIELD_WORKER_KEYS.activeOrder(user.id) 
          });
          
          if (payload.old.status !== payload.new.status) {
            toast.success(`Ordre oppdatert: ${payload.new.title}`);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'work_order_time_entries',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Invalidate timer queries when time entries change
          queryClient.invalidateQueries({ 
            queryKey: FIELD_WORKER_KEYS.activeTimer(user.id) 
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);
};

// Utility hook to refresh all field worker data
export const useRefreshFieldWorkerData = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return async () => {
    if (!user?.id) return;
    
    await Promise.all([
      queryClient.invalidateQueries({ 
        queryKey: FIELD_WORKER_KEYS.assignedOrders(user.id) 
      }),
      queryClient.invalidateQueries({ 
        queryKey: FIELD_WORKER_KEYS.activeTimer(user.id) 
      }),
      queryClient.invalidateQueries({ 
        queryKey: FIELD_WORKER_KEYS.activeOrder(user.id) 
      }),
    ]);
  };
};