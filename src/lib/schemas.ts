// Phase 2: Zod Schemas for Runtime Validation
import { z } from 'zod';

// Base schemas
export const userRoleSchema = z.enum(['admin', 'field_worker']);
export const workOrderStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'cancelled']);
export const pricingTypeSchema = z.enum(['hourly', 'fixed', 'material_only']);

// User schemas
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string().optional(),
  role: userRoleSchema,
  phone: z.string().optional(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

// Customer schemas
export const customerSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Customer name is required'),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  contact_person: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  contact_person: z.string().optional(),
});

// Material schemas
export const materialSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Material name is required'),
  unit: z.string().min(1, 'Unit is required'),
  price: z.number().positive().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const createMaterialSchema = z.object({
  name: z.string().min(1, 'Material name is required'),
  unit: z.string().min(1, 'Unit is required'),
  price: z.number().positive().optional(),
});

// Work Order schemas
export const gpsLocationSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const workOrderSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: workOrderStatusSchema,
  pricing_type: pricingTypeSchema,
  price_value: z.number().positive().optional(),
  estimated_hours: z.number().positive().optional(),
  actual_hours: z.number().positive().optional(),
  customer_id: z.string().uuid(),
  user_id: z.string().uuid(),
  assigned_to: z.string().uuid().optional(),
  notes: z.string().optional(),
  gps_location: gpsLocationSchema.optional(),
  started_at: z.string().optional(),
  completed_at: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const createWorkOrderSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  customer_id: z.string().uuid('Please select a customer'),
  assigned_to: z.string().uuid().optional(),
  pricing_model: z.enum(['fixed', 'resource_based']),
  pricing_type: pricingTypeSchema,
  price_value: z.number().positive().optional(),
  estimated_hours: z.number().positive().optional(),
  notes: z.string().optional(),
}).refine((data) => {
  // If pricing type is fixed, price_value is required
  if (data.pricing_type === 'fixed' && !data.price_value) {
    return false;
  }
  // If pricing type is hourly, estimated_hours is recommended
  return true;
}, {
  message: "Price value is required for fixed pricing",
  path: ["price_value"]
});

export const updateWorkOrderSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  customer_id: z.string().uuid().optional(),
  assigned_to: z.string().uuid().optional(),
  pricing_type: pricingTypeSchema.optional(),
  price_value: z.number().positive().optional(),
  estimated_hours: z.number().positive().optional(),
  notes: z.string().optional(),
  status: workOrderStatusSchema.optional(),
  actual_hours: z.number().positive().optional(),
  gps_location: gpsLocationSchema.optional(),
});

// Time Entry schemas
export const timeEntrySchema = z.object({
  id: z.string().uuid(),
  work_order_id: z.string().uuid(),
  user_id: z.string().uuid(),
  start_time: z.string(),
  end_time: z.string().optional(),
  break_duration: z.number().int().min(0).optional(),
  notes: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const createTimeEntrySchema = z.object({
  work_order_id: z.string().uuid(),
  notes: z.string().optional(),
});

export const updateTimeEntrySchema = z.object({
  end_time: z.string().optional(),
  break_duration: z.number().int().min(0).optional(),
  notes: z.string().optional(),
});

// Work Order Material schemas
export const workOrderMaterialSchema = z.object({
  id: z.string().uuid(),
  work_order_id: z.string().uuid(),
  material_id: z.string().uuid(),
  quantity: z.number().positive(),
  unit_price: z.number().positive().optional(),
  added_by: z.string().uuid(),
  notes: z.string().optional(),
  created_at: z.string(),
});

export const addMaterialToWorkOrderSchema = z.object({
  material_id: z.string().uuid('Please select a material'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  notes: z.string().optional(),
});

// Filter schemas
export const workOrderFiltersSchema = z.object({
  status: z.array(workOrderStatusSchema).optional(),
  assigned_to: z.string().uuid().optional(),
  customer_id: z.string().uuid().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  search: z.string().optional(),
});

// Form validation helpers
export const validateForm = <T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
} => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: 'Validation failed' } };
  }
};

// Export commonly used schemas
export type CreateWorkOrderForm = z.infer<typeof createWorkOrderSchema>;
export type UpdateWorkOrderForm = z.infer<typeof updateWorkOrderSchema>;
export type CreateCustomerForm = z.infer<typeof createCustomerSchema>;
export type CreateMaterialForm = z.infer<typeof createMaterialSchema>;
export type AddMaterialToWorkOrderForm = z.infer<typeof addMaterialToWorkOrderSchema>;
export type WorkOrderFilters = z.infer<typeof workOrderFiltersSchema>;