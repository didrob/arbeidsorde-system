import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface QuickStartData {
  customer_id: string;
  title: string;
  description?: string;
  pricing_model: 'fixed' | 'resource_based';
  pricing_type: 'hourly' | 'fixed';
  price_value?: number;
  estimated_hours?: number;
  hourly_rate?: number;
  equipment?: {
    id: string;
    quantity: number;
    rate: number;
    pricing_type: 'hourly' | 'daily' | 'fixed';
  }[];
  personnel?: {
    id: string;
    estimated_hours: number;
    hourly_rate: number;
  }[];
}

export const useQuickStartWorkOrder = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: QuickStartData) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Step 1: Create work order
      const { data: workOrder, error: workOrderError } = await supabase
        .from('work_orders')
        .insert({
          title: data.title,
          description: data.description,
          customer_id: data.customer_id,
          user_id: user.id,
          assigned_to: user.id,
          status: 'pending',
          pricing_type: data.pricing_type,
          pricing_model: data.pricing_model,
          price_value: data.price_value,
          estimated_hours: data.estimated_hours
        })
        .select('*')
        .single();

      if (workOrderError) {
        throw new Error(`Failed to create work order: ${workOrderError.message}`);
      }

      // Step 2: Immediately start time tracking
      const { data: timeEntry, error: timeError } = await supabase
        .from('work_order_time_entries')
        .insert({
          work_order_id: workOrder.id,
          user_id: user.id,
          start_time: new Date().toISOString(),
          notes: 'Hurtigstart'
        })
        .select('*')
        .single();

      if (timeError) {
        // Rollback: Delete the work order if time entry fails
        await supabase.from('work_orders').delete().eq('id', workOrder.id);
        throw new Error(`Failed to start time tracking: ${timeError.message}`);
      }

      // Step 3: Add equipment if specified
      if (data.equipment && data.equipment.length > 0) {
        for (const equipment of data.equipment) {
          const { error: equipmentError } = await supabase
            .from('work_order_equipment')
            .insert({
              work_order_id: workOrder.id,
              equipment_id: equipment.id,
              estimated_quantity: equipment.quantity,
              rate: equipment.rate,
              pricing_type: equipment.pricing_type
            });

          if (equipmentError) {
            // Rollback: Delete work order and time entry
            await supabase.from('work_order_time_entries').delete().eq('id', timeEntry.id);
            await supabase.from('work_orders').delete().eq('id', workOrder.id);
            throw new Error(`Failed to add equipment: ${equipmentError.message}`);
          }
        }
      }

      // Step 4: Add personnel if specified
      if (data.personnel && data.personnel.length > 0) {
        for (const person of data.personnel) {
          const { error: personnelError } = await supabase
            .from('work_order_personnel')
            .insert({
              work_order_id: workOrder.id,
              personnel_id: person.id,
              estimated_hours: person.estimated_hours,
              hourly_rate: person.hourly_rate
            });

          if (personnelError) {
            // Rollback: Delete work order, time entry, and equipment
            if (data.equipment && data.equipment.length > 0) {
              await supabase.from('work_order_equipment').delete().eq('work_order_id', workOrder.id);
            }
            await supabase.from('work_order_time_entries').delete().eq('id', timeEntry.id);
            await supabase.from('work_orders').delete().eq('id', workOrder.id);
            throw new Error(`Failed to add personnel: ${personnelError.message}`);
          }
        }
      }

      return {
        workOrder,
        timeEntry
      };
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
    onError: (error) => {
      toast.error(error.message || 'Kunne ikke starte arbeidsordre');
    },
  });
};