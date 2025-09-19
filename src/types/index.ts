// Phase 2: Centralized Type System
export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type UserRole = 'admin' | 'field_worker';

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contact_person?: string;
  created_at: string;
  updated_at: string;
}

export interface Material {
  id: string;
  name: string;
  unit: string;
  price?: number;
  created_at: string;
  updated_at: string;
}

export type WorkOrderStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type PricingType = 'hourly' | 'fixed' | 'material_only';
export type PricingModel = 'fixed' | 'resource_based';
export type EquipmentPricingType = 'hourly' | 'daily' | 'fixed';
export type AgreementType = 'personnel' | 'equipment' | 'material' | 'general';
export type ResourceType = 'personnel' | 'equipment' | 'material';

export interface Personnel {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  standard_hourly_rate?: number;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Equipment {
  id: string;
  name: string;
  category: string;
  pricing_type: EquipmentPricingType;
  standard_rate?: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerPricingAgreement {
  id: string;
  customer_id: string;
  agreement_type: AgreementType;
  resource_id?: string;
  resource_type?: ResourceType;
  custom_rate: number;
  pricing_type: string;
  valid_from?: string;
  valid_until?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  customer?: Customer;
}

export interface WorkOrderPersonnel {
  id: string;
  work_order_id: string;
  personnel_id: string;
  hourly_rate: number;
  estimated_hours?: number;
  actual_hours?: number;
  notes?: string;
  created_at: string;
  
  // Relations
  personnel?: Personnel;
}

export interface WorkOrderEquipment {
  id: string;
  work_order_id: string;
  equipment_id: string;
  pricing_type: EquipmentPricingType;
  rate: number;
  estimated_quantity?: number;
  actual_quantity?: number;
  notes?: string;
  created_at: string;
  
  // Relations
  equipment?: Equipment;
}

export interface WorkOrder {
  id: string;
  title: string;
  description?: string;
  status: WorkOrderStatus;
  pricing_type: PricingType;
  pricing_model: PricingModel;
  price_value?: number;
  estimated_hours?: number;
  actual_hours?: number;
  customer_id: string;
  user_id: string;
  assigned_to?: string;
  notes?: string;
  gps_location?: { x: number; y: number };
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  
  // Relations (populated by joins)
  customer?: Customer;
  assigned_user?: User;
  creator?: User;
  materials?: WorkOrderMaterial[];
  personnel?: WorkOrderPersonnel[];
  equipment?: WorkOrderEquipment[];
  time_entries?: TimeEntry[];
  attachments?: WorkOrderAttachment[];
}

export interface WorkOrderMaterial {
  id: string;
  work_order_id: string;
  material_id: string;
  quantity: number;
  unit_price?: number;
  added_by: string;
  notes?: string;
  created_at: string;
  
  // Relations
  material?: Material;
  added_by_user?: User;
}

export interface TimeEntry {
  id: string;
  work_order_id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  break_duration?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  user?: User;
  work_order?: WorkOrder;
}

export interface WorkOrderAttachment {
  id: string;
  work_order_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size?: number;
  description?: string;
  created_at: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  data?: T;
  error?: ApiError;
  success: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// Form validation types
export interface CreateWorkOrderForm {
  title: string;
  description?: string;
  customer_id: string;
  assigned_to?: string;
  pricing_type: PricingType;
  pricing_model: PricingModel;
  price_value?: number;
  estimated_hours?: number;
  notes?: string;
  user_id?: string; // Will be set automatically in API layer
}

export interface UpdateWorkOrderForm extends Partial<CreateWorkOrderForm> {
  status?: WorkOrderStatus;
  actual_hours?: number;
  gps_location?: { x: number; y: number };
}

// UI State Types
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

// Filter Types
export interface WorkOrderFilters {
  status?: WorkOrderStatus[];
  assigned_to?: string;
  customer_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

// Dashboard Types
export interface DashboardStats {
  total_orders: number;
  pending_orders: number;
  in_progress_orders: number;
  completed_orders: number;
  total_hours_logged: number;
  active_field_workers: number;
}