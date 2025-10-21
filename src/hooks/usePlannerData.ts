import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Personnel, WorkOrder } from '@/types';

export function usePlannerData(siteId: string | undefined, date: Date) {
  // Fetch personnel for selected site
  const { data: personnel = [], isLoading: personnelLoading } = useQuery({
    queryKey: ['planner-personnel', siteId],
    queryFn: async () => {
      let query = supabase
        .from('personnel')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (siteId) {
        query = query.eq('site_id', siteId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Personnel[];
    },
  });

  // Fetch work orders for the selected date
  const { data: workOrders = [], isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ['planner-work-orders', siteId, date.toISOString()],
    queryFn: async () => {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      let query = supabase
        .from('work_orders')
        .select(`
          *,
          customer:customers(*),
          personnel:work_order_personnel(
            *,
            personnel:personnel(*)
          )
        `)
        .eq('is_deleted', false)
        .in('status', ['pending', 'in_progress']);

      if (siteId) {
        query = query.eq('site_id', siteId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as WorkOrder[];
    },
  });

  // Split orders into scheduled and unassigned
  const scheduledOrders = workOrders.filter(order => order.scheduled_start);
  const unassignedOrders = workOrders.filter(order => !order.scheduled_start);

  return {
    personnel,
    scheduledOrders,
    unassignedOrders,
    isLoading: personnelLoading || ordersLoading,
    refetchOrders,
  };
}
