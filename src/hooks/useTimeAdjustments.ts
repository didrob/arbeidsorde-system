import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TimeAdjustment {
  id: string;
  work_order_id: string;
  user_id: string;
  adjustment_type: 'extra_time' | 'deviation';
  reason: string;
  extra_minutes: number;
  extra_cost: number;
  hourly_rate?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AdjustmentAttachment {
  id: string;
  adjustment_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size?: number;
  description?: string;
  created_at: string;
}

export interface CreateTimeAdjustmentData {
  work_order_id: string;
  adjustment_type: 'extra_time' | 'deviation';
  reason: string;
  extra_minutes?: number;
  hourly_rate?: number;
  notes?: string;
}

// Hooks for time adjustments
export const useTimeAdjustments = (workOrderId: string) => {
  return useQuery({
    queryKey: ['time-adjustments', workOrderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('work_order_time_adjustments')
        .select('*')
        .eq('work_order_id', workOrderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TimeAdjustment[];
    },
    enabled: !!workOrderId,
  });
};

export const useCreateTimeAdjustment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateTimeAdjustmentData) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      // Calculate extra cost if hourly rate and extra minutes are provided
      let extra_cost = 0;
      if (data.hourly_rate && data.extra_minutes) {
        extra_cost = (data.hourly_rate / 60) * data.extra_minutes;
      }

      const adjustmentData = {
        ...data,
        user_id: user.user.id,
        extra_cost,
        extra_minutes: data.extra_minutes || 0,
      };

      const { data: result, error } = await supabase
        .from('work_order_time_adjustments')
        .insert(adjustmentData)
        .select()
        .single();

      if (error) throw error;
      return result as TimeAdjustment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['time-adjustments', variables.work_order_id] });
      toast({
        title: 'Justering registrert',
        description: variables.adjustment_type === 'extra_time' 
          ? 'Ekstratid har blitt registrert' 
          : 'Avvik har blitt rapportert',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Feil',
        description: 'Kunne ikke registrere justering',
      });
      console.error('Error creating time adjustment:', error);
    },
  });
};

// Hooks for adjustment attachments
export const useAdjustmentAttachments = (adjustmentId: string) => {
  return useQuery({
    queryKey: ['adjustment-attachments', adjustmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('adjustment_attachments')
        .select('*')
        .eq('adjustment_id', adjustmentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AdjustmentAttachment[];
    },
    enabled: !!adjustmentId,
  });
};

export const useUploadAdjustmentAttachment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      adjustmentId, 
      file, 
      description 
    }: { 
      adjustmentId: string; 
      file: File; 
      description?: string 
    }) => {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${adjustmentId}_${Date.now()}.${fileExt}`;
      const filePath = `adjustments/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('work-order-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('work-order-attachments')
        .getPublicUrl(filePath);

      // Create attachment record
      const { data, error } = await supabase
        .from('adjustment_attachments')
        .insert({
          adjustment_id: adjustmentId,
          file_name: file.name,
          file_url: publicUrl,
          file_type: file.type,
          file_size: file.size,
          description: description,
        })
        .select()
        .single();

      if (error) throw error;
      return data as AdjustmentAttachment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adjustment-attachments', variables.adjustmentId] });
      toast({
        title: 'Vedlegg lastet opp',
        description: 'Filen har blitt lagt til justeringen',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Feil',
        description: 'Kunne ikke laste opp vedlegg',
      });
      console.error('Error uploading attachment:', error);
    },
  });
};