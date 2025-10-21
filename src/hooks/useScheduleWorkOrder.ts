import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ScheduleOrderParams {
  orderId: string;
  personnelId: string;
  scheduledStart: string;
  scheduledEnd: string;
}

export function useScheduleWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, personnelId, scheduledStart, scheduledEnd }: ScheduleOrderParams) => {
      // Update work order with scheduled times
      const { error: orderError } = await supabase
        .from('work_orders')
        .update({
          scheduled_start: scheduledStart,
          scheduled_end: scheduledEnd,
        })
        .eq('id', orderId);

      if (orderError) throw orderError;

      // Check if personnel is already assigned to this work order
      const { data: existing } = await supabase
        .from('work_order_personnel')
        .select('id')
        .eq('work_order_id', orderId)
        .eq('personnel_id', personnelId)
        .maybeSingle();

      if (!existing) {
        // Get personnel info for rate
        const { data: personnel, error: personnelError } = await supabase
          .from('personnel')
          .select('standard_hourly_rate')
          .eq('id', personnelId)
          .single();

        if (personnelError) throw personnelError;

        // Add personnel to work order
        const { error: personnelAssignError } = await supabase
          .from('work_order_personnel')
          .insert({
            work_order_id: orderId,
            personnel_id: personnelId,
            hourly_rate: personnel.standard_hourly_rate || 0,
          });

        if (personnelAssignError) throw personnelAssignError;
      }

      return { orderId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planner-work-orders'] });
      toast.success('Ordre planlagt');
    },
    onError: (error: Error) => {
      toast.error('Kunne ikke planlegge ordre: ' + error.message);
    },
  });
}
