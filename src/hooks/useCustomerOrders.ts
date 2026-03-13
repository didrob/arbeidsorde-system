import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type OrderStatusFilter = 'all' | 'pending' | 'in_progress' | 'completed';

export function useCustomerOrders(statusFilter: OrderStatusFilter = 'all') {
  const { customerId } = useAuth();

  return useQuery({
    queryKey: ['customer-orders', customerId, statusFilter],
    queryFn: async () => {
      if (!customerId) return [];
      
      let query = supabase
        .from('work_orders')
        .select('id, title, description, status, created_at, updated_at, scheduled_start, scheduled_end, started_at, completed_at, notes, site_id')
        .eq('customer_id', customerId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!customerId,
  });
}

export function useCustomerOrderStats() {
  const { customerId } = useAuth();

  return useQuery({
    queryKey: ['customer-order-stats', customerId],
    queryFn: async () => {
      if (!customerId) return { active: 0, thisMonth: 0, lastActivity: null as string | null };
      
      const { data, error } = await supabase
        .from('work_orders')
        .select('id, status, created_at, updated_at')
        .eq('customer_id', customerId)
        .eq('is_deleted', false);

      if (error) throw error;

      const orders = data || [];
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      return {
        active: orders.filter(o => ['pending', 'in_progress'].includes(o.status)).length,
        thisMonth: orders.filter(o => o.created_at >= monthStart).length,
        lastActivity: orders.length > 0
          ? orders.reduce((latest, o) => o.updated_at > latest ? o.updated_at : latest, orders[0].updated_at)
          : null,
      };
    },
    enabled: !!customerId,
  });
}
