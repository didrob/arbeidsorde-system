import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useUnscheduleWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from('work_orders')
        .update({
          scheduled_start: null,
          scheduled_end: null,
        })
        .eq('id', orderId);

      if (error) throw error;
      return { orderId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planner-work-orders'] });
      toast.success('Allokering fjernet');
    },
    onError: (error: Error) => {
      toast.error('Kunne ikke fjerne allokering: ' + error.message);
    },
  });
}
