import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Personnel, Equipment, CustomerPricingAgreement, ApiResponse, EquipmentPricingType, AgreementType, ResourceType } from '@/types';
import { toast } from 'sonner';

// Query keys
export const resourceQueryKeys = {
  personnel: () => ['personnel'] as const,
  equipment: () => ['equipment'] as const,
  customerAgreements: (customerId?: string) => ['customer-agreements', customerId] as const,
};

// Personnel hooks
export function usePersonnel() {
  return useQuery({
    queryKey: resourceQueryKeys.personnel(),
    queryFn: async (): Promise<Personnel[]> => {
      const { data, error } = await supabase
        .from('personnel')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        toast.error('Failed to fetch personnel');
        throw error;
      }

      return data || [];
    },
  });
}

export function useCreatePersonnel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<Personnel, 'id' | 'created_at' | 'updated_at'>): Promise<Personnel> => {
      const { data: result, error } = await supabase
        .from('personnel')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resourceQueryKeys.personnel() });
      toast.success('Personnel created successfully');
    },
    onError: () => {
      toast.error('Failed to create personnel');
    },
  });
}

export function useUpdatePersonnel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Personnel> & { id: string }): Promise<Personnel> => {
      const { data: result, error } = await supabase
        .from('personnel')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resourceQueryKeys.personnel() });
      toast.success('Personnel updated successfully');
    },
    onError: () => {
      toast.error('Failed to update personnel');
    },
  });
}

export function useDeletePersonnel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('personnel')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resourceQueryKeys.personnel() });
      toast.success('Personnel deactivated successfully');
    },
    onError: () => {
      toast.error('Failed to deactivate personnel');
    },
  });
}

// Equipment hooks
export function useEquipment() {
  return useQuery({
    queryKey: resourceQueryKeys.equipment(),
    queryFn: async (): Promise<Equipment[]> => {
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        toast.error('Failed to fetch equipment');
        throw error;
      }

      return (data || []).map(item => ({
        ...item,
        pricing_type: item.pricing_type as EquipmentPricingType
      }));
    },
  });
}

export function useCreateEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<Equipment, 'id' | 'created_at' | 'updated_at'>): Promise<Equipment> => {
      const { data: result, error } = await supabase
        .from('equipment')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return {
        ...result,
        pricing_type: result.pricing_type as EquipmentPricingType
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resourceQueryKeys.equipment() });
      toast.success('Equipment created successfully');
    },
    onError: () => {
      toast.error('Failed to create equipment');
    },
  });
}

export function useUpdateEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Equipment> & { id: string }): Promise<Equipment> => {
      const { data: result, error } = await supabase
        .from('equipment')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return {
        ...result,
        pricing_type: result.pricing_type as EquipmentPricingType
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resourceQueryKeys.equipment() });
      toast.success('Equipment updated successfully');
    },
    onError: () => {
      toast.error('Failed to update equipment');
    },
  });
}

export function useDeleteEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('equipment')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resourceQueryKeys.equipment() });
      toast.success('Equipment deactivated successfully');
    },
    onError: () => {
      toast.error('Failed to deactivate equipment');
    },
  });
}

// Customer pricing agreements hooks
export function useCustomerPricingAgreements(customerId?: string) {
  return useQuery({
    queryKey: resourceQueryKeys.customerAgreements(customerId),
    queryFn: async (): Promise<CustomerPricingAgreement[]> => {
      let query = supabase
        .from('customer_pricing_agreements')
        .select(`
          *,
          customer:customers(*)
        `)
        .order('created_at', { ascending: false });

      if (customerId) {
        query = query.eq('customer_id', customerId);
      }

      const { data, error } = await query;

      if (error) {
        toast.error('Failed to fetch customer pricing agreements');
        throw error;
      }

      return (data || []).map(item => ({
        ...item,
        agreement_type: item.agreement_type as AgreementType,
        resource_type: item.resource_type as ResourceType
      }));
    },
    enabled: !!customerId || customerId === undefined,
  });
}

export function useCreateCustomerPricingAgreement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<CustomerPricingAgreement, 'id' | 'created_at' | 'updated_at'>): Promise<CustomerPricingAgreement> => {
      const { data: result, error } = await supabase
        .from('customer_pricing_agreements')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return {
        ...result,
        agreement_type: result.agreement_type as AgreementType,
        resource_type: result.resource_type as ResourceType
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: resourceQueryKeys.customerAgreements() });
      queryClient.invalidateQueries({ queryKey: resourceQueryKeys.customerAgreements(data.customer_id) });
      toast.success('Pricing agreement created successfully');
    },
    onError: () => {
      toast.error('Failed to create pricing agreement');
    },
  });
}