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

  // Work Orders API - Site segregation handled by RLS + manual filtering
  async getWorkOrders(filters?: WorkOrderFilters, selectedSiteId?: string): Promise<ApiResponse<any[]>> {
    let query = supabase
      .from('work_orders')
      .select(`
        *,
        customer:customers(name, email, phone),
        site:sites(name)
      `)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    // Apply site filtering if specified
    if (selectedSiteId) {
      query = query.eq('site_id', selectedSiteId);
    }

    // Apply other filters
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
    return this.handleResponse(data || [], error);
  }

  async getWorkOrder(id: string): Promise<ApiResponse<any>> {
    const buildQuery = (withDeletedFilter: boolean) => {
      let query = supabase
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
        .eq('id', id);
      if (withDeletedFilter) {
        query = query.eq('is_deleted', false);
      }
      return query.single();
    };

    let { data, error }: any = await buildQuery(true);
    if (error && (String(error.message || '').includes('is_deleted') || String(error.details || '').includes('is_deleted'))) {
      const res = await buildQuery(false);
      data = res.data; error = res.error;
    }
    return this.handleResponse(data, error);
  }

  async createWorkOrder(formData: CreateWorkOrderForm): Promise<ApiResponse<any>> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return this.handleResponse(null, { message: 'Not authenticated' });
    }

    // The formData from the wizard now contains all correct fields,
    // including pricing_type and price_value. No extra logic is needed here.
    const insertData = {
      ...formData,
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

  async claimWorkOrder(id: string): Promise<ApiResponse<any>> {
    const { data, error } = await supabase
      .rpc('claim_work_order', { order_id: id });

    // If data is null and no error, it means it was already claimed
    if (!error && !data) {
      return this.handleResponse(null, { message: 'Already claimed by someone else' });
    }

    return this.handleResponse(data, error);
  }

  async deleteWorkOrder(id: string, reason?: string): Promise<ApiResponse<void>> {
    // Use soft delete RPC with business rules and audit logging
    const { error } = await supabase.rpc('soft_delete_work_order', { order_id: id, reason });
    return this.handleResponse(null, error || null);
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

  // Materials API - Site segregation handled by RLS + manual filtering
  async getMaterials(selectedSiteId?: string): Promise<ApiResponse<Material[]>> {
    let query = supabase
      .from('materials')
      .select(`
        *,
        site:sites(name)
      `)
      .order('name');

    // Apply site filtering if specified
    if (selectedSiteId) {
      query = query.eq('site_id', selectedSiteId);
    }

    const { data, error } = await query;
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

  // Customers API - Site segregation handled by RLS + manual filtering
  async getCustomers(selectedSiteId?: string): Promise<ApiResponse<any[]>> {
    let query = supabase
      .from('customers')
      .select(`
        *,
        site:sites(name)
      `)
      .order('name');

    // Apply site filtering if specified
    if (selectedSiteId) {
      query = query.eq('site_id', selectedSiteId);
    }

    const { data, error } = await query;
    return this.handleResponse(data || [], error);
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

  // Equipment API - Site segregation handled by RLS + manual filtering
  async getEquipment(selectedSiteId?: string): Promise<ApiResponse<any[]>> {
    let query = supabase
      .from('equipment')
      .select(`
        *,
        site:sites(name)
      `)
      .order('name');

    // Apply site filtering if specified
    if (selectedSiteId) {
      query = query.eq('site_id', selectedSiteId);
    }

    const { data, error } = await query;
    return this.handleResponse(data, error);
  }

  // Personnel API - Site segregation handled by RLS + manual filtering
  async getPersonnel(selectedSiteId?: string): Promise<ApiResponse<any[]>> {
    let query = supabase
      .from('personnel')
      .select(`
        *,
        site:sites(name)
      `)
      .order('name');

    // Apply site filtering if specified
    if (selectedSiteId) {
      query = query.eq('site_id', selectedSiteId);
    }

    const { data, error } = await query;
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
      .select(`
        *,
        organization:organizations(id, name),
        site:sites(id, name)
      `)
      .eq('user_id', authUser.user.id)
      .single();

    return this.handleResponse(data, error);
  }

  async updateProfile(profileData: { full_name?: string; phone?: string; avatar_url?: string }): Promise<ApiResponse<any>> {
    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser.user) {
      return this.handleResponse(null, { message: 'Not authenticated' });
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', authUser.user.id)
      .select(`
        *,
        organization:organizations(id, name),
        site:sites(id, name)
      `)
      .single();

    return this.handleResponse(data, error);
  }

  async uploadAvatar(file: File): Promise<ApiResponse<{ avatar_url: string }>> {
    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser.user) {
      return this.handleResponse(null, { message: 'Not authenticated' });
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${authUser.user.id}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Upload file to storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      return this.handleResponse(null, uploadError);
    }

    // Get public URL
    const { data: publicUrl } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Update profile with avatar URL
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        avatar_url: publicUrl.publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', authUser.user.id)
      .select()
      .single();

    if (error) {
      return this.handleResponse(null, error);
    }

    return this.handleResponse({ avatar_url: publicUrl.publicUrl }, null);
  }

  // Organization-level API for system admins
  async getOrgCustomers(): Promise<ApiResponse<any[]>> {
    const { data, error } = await supabase
      .from('customers')
      .select('*, sites(name)')
      .order('name');

    return this.handleResponse(data, error);
  }

  async getOrgMaterials(): Promise<ApiResponse<any[]>> {
    const { data, error } = await supabase
      .from('materials')
      .select('*, sites(name)')
      .order('name');

    return this.handleResponse(data, error);
  }

  async getOrgEquipment(): Promise<ApiResponse<any[]>> {
    const { data, error } = await supabase
      .from('equipment')
      .select('*, sites(name)')
      .order('name');

    return this.handleResponse(data, error);
  }

  async getOrgPersonnel(): Promise<ApiResponse<any[]>> {
    const { data, error } = await supabase
      .from('personnel')
      .select('*, sites(name)')
      .order('name');

    return this.handleResponse(data, error);
  }

  async getOrgWorkOrders(): Promise<ApiResponse<any[]>> {
    const { data, error } = await supabase
      .from('work_orders')
      .select('*, sites(name), customers(name)')
      .order('created_at', { ascending: false });

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
  updateProfile,
  uploadAvatar,
  getDashboardStats,
  getOrgCustomers,
  getOrgMaterials,
  getOrgEquipment,
  getOrgPersonnel,
  getOrgWorkOrders
} = api;