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
  poolOrders: () => ['fieldWorker', 'poolOrders'],
  poolNotifications: (userId: string) => ['fieldWorker', 'poolNotifications', userId],
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
    staleTime: 10 * 1000, // 10 seconds for faster updates
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

// Hook for pool orders with notifications
export const usePoolOrders = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: FIELD_WORKER_KEYS.poolOrders(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('work_orders')
        .select(`
          *,
          customers (name, address)
        `)
        .is('assigned_to', null)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 10 * 1000, // 10 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
  });
};

// Hook for pool notifications counter
export const usePoolNotifications = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: FIELD_WORKER_KEYS.poolNotifications(user?.id || ''),
    queryFn: async () => {
      // Count unassigned orders created in the last hour as "new"
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const { count, error } = await supabase
        .from('work_orders')
        .select('*', { count: 'exact', head: true })
        .is('assigned_to', null)
        .eq('status', 'pending')
        .gte('created_at', oneHourAgo);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000, // Check every minute for new notifications
  });
};

// Enhanced realtime updates with pool monitoring and better notifications
export const useFieldWorkerRealtime = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;

    console.log('🔄 Setting up field worker realtime listeners');

    const channel = supabase
      .channel('enhanced-field-worker-realtime')
      // Listen for assigned orders (existing functionality)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'work_orders',
          filter: `assigned_to=eq.${user.id}`
        },
        (payload) => {
          console.log('📥 New assigned order:', payload.new);
          
          // Invalidate assigned orders to show new order
          queryClient.invalidateQueries({ 
            queryKey: FIELD_WORKER_KEYS.assignedOrders(user.id) 
          });
          
          // Enhanced notification with vibration
          if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
          }
          
          toast.success(`🎯 Ny arbeidsordre tildelt: ${payload.new.title}`, {
            description: "Ordren er nå klar for start",
            duration: 5000,
          });
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
          console.log('📝 Assigned order updated:', payload.new);
          
          // Invalidate all related queries
          queryClient.invalidateQueries({ 
            queryKey: FIELD_WORKER_KEYS.assignedOrders(user.id) 
          });
          queryClient.invalidateQueries({ 
            queryKey: FIELD_WORKER_KEYS.activeOrder(user.id) 
          });
          
          if (payload.old.status !== payload.new.status) {
            toast.success(`📋 Ordre oppdatert: ${payload.new.title}`, {
              description: `Status endret til: ${payload.new.status}`,
            });
          }
        }
      )
      // NEW: Listen for ALL work orders (pool monitoring)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'work_orders'
        },
        (payload) => {
          console.log('🔍 New work order in system:', payload.new);
          
          // Always invalidate pool data
          queryClient.invalidateQueries({ 
            queryKey: FIELD_WORKER_KEYS.poolOrders() 
          });
          queryClient.invalidateQueries({ 
            queryKey: FIELD_WORKER_KEYS.poolNotifications(user.id) 
          });
          
          // If it's unassigned, notify about pool availability
          if (!payload.new.assigned_to) {
            toast.success(`📢 Ny ordre i pool: ${payload.new.title}`, {
              description: "Klikk for å se ledige ordrer",
              duration: 4000,
            });
            
            // Gentle vibration for pool notifications
            if (navigator.vibrate) {
              navigator.vibrate([100]);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'work_orders'
        },
        (payload) => {
          console.log('🔄 Work order updated:', payload.new);
          
          // Always invalidate pool data for assignment changes
          queryClient.invalidateQueries({ 
            queryKey: FIELD_WORKER_KEYS.poolOrders() 
          });
          queryClient.invalidateQueries({ 
            queryKey: FIELD_WORKER_KEYS.poolNotifications(user.id) 
          });
          
          // Notify if order moved to/from pool
          if (payload.old.assigned_to !== payload.new.assigned_to) {
            if (!payload.new.assigned_to) {
              toast.info(`🔄 Ordre tilbake i pool: ${payload.new.title}`, {
                description: "Ordren er nå ledig igjen",
              });
            } else if (!payload.old.assigned_to) {
              toast.info(`👤 Ordre tatt: ${payload.new.title}`, {
                description: "Ordren ble tatt av en annen",
              });
            }
          }
        }
      )
      // Time entries monitoring
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'work_order_time_entries',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          console.log('⏱️ Time entry changed');
          // Invalidate timer queries when time entries change
          queryClient.invalidateQueries({ 
            queryKey: FIELD_WORKER_KEYS.activeTimer(user.id) 
          });
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Cleaning up field worker realtime listeners');
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
    
    console.log('🔄 Refreshing all field worker data');
    
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
      queryClient.invalidateQueries({ 
        queryKey: FIELD_WORKER_KEYS.poolOrders() 
      }),
      queryClient.invalidateQueries({ 
        queryKey: FIELD_WORKER_KEYS.poolNotifications(user.id) 
      }),
    ]);
  };
};