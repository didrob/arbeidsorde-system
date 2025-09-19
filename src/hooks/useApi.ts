// Phase 3: React Query Integration with API Layer
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { 
  WorkOrderFilters, 
  CreateWorkOrderForm,
  UpdateWorkOrderForm,
  DashboardStats,
  Customer
} from '@/types';

// Query Keys
export const queryKeys = {
  workOrders: (filters?: WorkOrderFilters) => ['workOrders', filters],
  workOrder: (id: string) => ['workOrder', id],
  materials: () => ['materials'],
  customers: () => ['customers'],
  fieldWorkers: () => ['fieldWorkers'],
  currentUser: () => ['currentUser'],
  dashboardStats: () => ['dashboardStats'],
} as const;

// Work Orders Hooks
export const useWorkOrders = (filters?: WorkOrderFilters) => {
  return useQuery({
    queryKey: queryKeys.workOrders(filters),
    queryFn: async () => {
      const response = await api.getWorkOrders(filters);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch work orders');
      }
      return response.data!;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useWorkOrder = (id: string) => {
  return useQuery({
    queryKey: queryKeys.workOrder(id),
    queryFn: async () => {
      const response = await api.getWorkOrder(id);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch work order');
      }
      return response.data!;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCreateWorkOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateWorkOrderForm) => {
      const response = await api.createWorkOrder(data);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to create work order');
      }
      return response.data!;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats() });
      toast.success('Work order created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create work order');
    },
  });
};

export const useUpdateWorkOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateWorkOrderForm }) => {
      const response = await api.updateWorkOrder(id, data);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to update work order');
      }
      return response.data!;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.workOrder(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats() });
      toast.success('Work order updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update work order');
    },
  });
};

export const useDeleteWorkOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.deleteWorkOrder(id);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to delete work order');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats() });
      toast.success('Work order deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete work order');
    },
  });
};

// Time Tracking Hooks
export const useStartTimeEntry = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ workOrderId, notes }: { workOrderId: string; notes?: string }) => {
      const response = await api.startTimeEntry(workOrderId, notes);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to start time entry');
      }
      return response.data!;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workOrder(data.work_order_id) });
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
      toast.success('Time tracking started');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to start time tracking');
    },
  });
};

export const useEndTimeEntry = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ entryId, notes }: { entryId: string; notes?: string }) => {
      const response = await api.endTimeEntry(entryId, notes);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to end time entry');
      }
      return response.data!;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workOrder(data.work_order_id) });
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats() });
      toast.success('Time tracking stopped');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to stop time tracking');
    },
  });
};

// Materials Hooks
export const useMaterials = () => {
  return useQuery({
    queryKey: queryKeys.materials(),
    queryFn: async () => {
      const response = await api.getMaterials();
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch materials');
      }
      return response.data!;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes (materials don't change often)
  });
};

export const useAddMaterialToWorkOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      workOrderId, 
      materialId, 
      quantity, 
      notes 
    }: { 
      workOrderId: string; 
      materialId: string; 
      quantity: number; 
      notes?: string; 
    }) => {
      const response = await api.addMaterialToWorkOrder(workOrderId, materialId, quantity, notes);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to add material');
      }
      return response.data!;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workOrder(data.work_order_id) });
      toast.success('Material added successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add material');
    },
  });
};

// Customers Hooks
export const useCustomers = () => {
  return useQuery({
    queryKey: queryKeys.customers(),
    queryFn: async () => {
      const response = await api.getCustomers();
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch customers');
      }
      return response.data!;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => {
      const response = await api.createCustomer(data);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to create customer');
      }
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers() });
      toast.success('Customer created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create customer');
    },
  });
};

// Users Hooks
export const useFieldWorkers = () => {
  return useQuery({
    queryKey: queryKeys.fieldWorkers(),
    queryFn: async () => {
      const response = await api.getFieldWorkers();
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch field workers');
      }
      return response.data!;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: queryKeys.currentUser(),
    queryFn: async () => {
      const response = await api.getCurrentUser();
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch current user');
      }
      return response.data!;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Don't retry too much for auth failures
  });
};

// Dashboard Hooks
export const useDashboardStats = () => {
  return useQuery({
    queryKey: queryKeys.dashboardStats(),
    queryFn: async () => {
      const response = await api.getDashboardStats();
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch dashboard stats');
      }
      return response.data!;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });
};