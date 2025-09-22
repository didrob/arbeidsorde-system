// Phase 2: API Abstraction Layer
import { supabase } from '@/integrations/supabase/client';
import type { 
  ApiResponse, 
  WorkOrder, 
  WorkOrderFilters, 
  CreateWorkOrderForm,
  UpdateWorkOrderForm,
  TimeEntry,
  Material,
  WorkOrderMaterial,
  Customer,
  User,
  DashboardStats
} from '@/types';

class ApiClient {
  private handleResponse<T>(data: T | null, error: any): ApiResponse<T> {
    if (error) {
      console.error('API Error:', error);
      return {
        success: false,
        error: {
          message: error.message || 'An unexpected error occurred',
          code: error.code,
          details: error.details
        }
      };
    }

    return {
      success: true,
      data: data || undefined
    };
  }

  // Work Orders API
  async getWorkOrders(filters?: WorkOrderFilters): Promise<ApiResponse<any[]>> {
    let query = supabase
      .from('work_orders')
      .select(`
        *,
        customer:customers(name, email, phone),
        assigned_user:profiles!assigned_to(full_name, role),
        creator:profiles!user_id(full_name, role)
      `)
      .order('created_at', { ascending: false });

    if (filters?.status?.length) {
      query = query.in('status', filters.status);
    }
    if (filters?.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }
    if (filters?.customer_id) {
      query = query.eq('customer_id', filters.customer_id);
    }
    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    return this.handleResponse(data, error);
  }

  async getWorkOrder(id: string): Promise<ApiResponse<any>> {
    const { data, error } = await supabase
      .from('work_orders')
      .select(`
        *,
        customer:customers(*),
        assigned_user:profiles!assigned_to(*),
        creator:profiles!user_id(*),
        materials:work_order_materials(*,
          material:materials(*),
          added_by_user:profiles!added_by(*)
        ),
        time_entries:work_order_time_entries(*,
          user:profiles!user_id(*)
        ),
        attachments:work_order_attachments(*)
      `)
      .eq('id', id)
      .single();

    return this.handleResponse(data, error);
  }

  async createWorkOrder(formData: CreateWorkOrderForm): Promise<ApiResponse<any>> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return this.handleResponse(null, { message: 'Not authenticated' });
    }

    // Derive sane defaults to avoid DB default overriding pricing
    const derivedPricingType = (formData as any).pricing_type
      ? (formData as any).pricing_type
      : formData.pricing_model === 'fixed'
        ? 'fixed'
        : 'hourly';

    const normalizedPriceValue = formData.pricing_model === 'fixed'
      ? formData.price_value ?? null
      : null; // ensure hourly/resource-based does not persist a fixed price

    const insertData = {
      ...formData,
      pricing_type: derivedPricingType,
      price_value: normalizedPriceValue,
      assigned_to: formData.assigned_to && formData.assigned_to.length > 0 ? formData.assigned_to : null,
      user_id: user.user.id
    };

    const { data, error } = await supabase
      .from('work_orders')
      .insert(insertData)
      .select()
      .single();

    return this.handleResponse(data, error);
  }

  async updateWorkOrder(id: string, updates: UpdateWorkOrderForm): Promise<ApiResponse<any>> {
    const { data, error } = await supabase
      .from('work_orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return this.handleResponse(data, error);
  }

  async deleteWorkOrder(id: string): Promise<ApiResponse<void>> {
    const { error } = await supabase
      .from('work_orders')
      .delete()
      .eq('id', id);

    return this.handleResponse(null, error);
  }

  // Time Tracking API
  async startTimeEntry(workOrderId: string, notes?: string): Promise<ApiResponse<TimeEntry>> {
    const { data, error } = await supabase
      .from('work_order_time_entries')
      .insert({
        work_order_id: workOrderId,
        user_id: (await supabase.auth.getUser()).data.user?.id!,
        notes
      })
      .select()
      .single();

    return this.handleResponse(data, error);
  }

  async endTimeEntry(entryId: string, notes?: string): Promise<ApiResponse<TimeEntry>> {
    const { data, error } = await supabase
      .from('work_order_time_entries')
      .update({
        end_time: new Date().toISOString(),
        notes
      })
      .eq('id', entryId)
      .select()
      .single();

    return this.handleResponse(data, error);
  }

  // Materials API
  async getMaterials(): Promise<ApiResponse<Material[]>> {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .order('name');

    return this.handleResponse(data, error);
  }

  async addMaterialToWorkOrder(
    workOrderId: string, 
    materialId: string, 
    quantity: number, 
    notes?: string
  ): Promise<ApiResponse<any>> {
    const { data, error } = await supabase
      .from('work_order_materials')
      .insert({
        work_order_id: workOrderId,
        material_id: materialId,
        quantity,
        added_by: (await supabase.auth.getUser()).data.user?.id!,
        notes
      })
      .select(`
        *,
        material:materials(*),
        added_by_user:profiles!added_by(*)
      `)
      .single();

    return this.handleResponse(data, error);
  }

  // Customers API
  async getCustomers(): Promise<ApiResponse<Customer[]>> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name');

    return this.handleResponse(data, error);
  }

  async createCustomer(customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Customer>> {
    const { data, error } = await supabase
      .from('customers')
      .insert(customerData)
      .select()
      .single();

    return this.handleResponse(data, error);
  }

  async updateCustomer(id: string, customerData: Partial<Omit<Customer, 'id' | 'created_at' | 'updated_at'>>): Promise<ApiResponse<Customer>> {
    const { data, error } = await supabase
      .from('customers')
      .update(customerData)
      .eq('id', id)
      .select()
      .single();

    return this.handleResponse(data, error);
  }

  // Users API
  async getFieldWorkers(): Promise<ApiResponse<any[]>> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, user_id')
      .eq('role', 'field_worker')
      .eq('is_active', true)
      .order('full_name');

    return this.handleResponse(data, error);
  }

  async getCurrentUser(): Promise<ApiResponse<any>> {
    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser.user) {
      return this.handleResponse(null, { message: 'Not authenticated' });
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', authUser.user.id)
      .single();

    return this.handleResponse(data, error);
  }

  // Dashboard API
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    // This would require multiple queries or a database function
    // For now, simplified version
    const { data: orders, error } = await supabase
      .from('work_orders')
      .select('status');

    if (error) {
      return this.handleResponse(null, error);
    }

    const stats: DashboardStats = {
      total_orders: orders?.length || 0,
      pending_orders: orders?.filter(o => o.status === 'pending').length || 0,
      in_progress_orders: orders?.filter(o => o.status === 'in_progress').length || 0,
      completed_orders: orders?.filter(o => o.status === 'completed').length || 0,
      total_hours_logged: 0, // Would require separate query
      active_field_workers: 0 // Would require separate query
    };

    return this.handleResponse(stats, null);
  }
}

// Export singleton instance
export const api = new ApiClient();

// Export individual methods for easier imports
export const {
  getWorkOrders,
  getWorkOrder,
  createWorkOrder,
  updateWorkOrder,
  deleteWorkOrder,
  startTimeEntry,
  endTimeEntry,
  getMaterials,
  addMaterialToWorkOrder,
  getCustomers,
  createCustomer,
  updateCustomer,
  getFieldWorkers,
  getCurrentUser,
  getDashboardStats
} = api;