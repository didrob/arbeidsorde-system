-- Add database constraints for input validation
-- This prevents malformed data at the database level

-- 1. Add CHECK constraints for numeric fields
ALTER TABLE public.work_orders
ADD CONSTRAINT work_orders_price_value_positive 
CHECK (price_value IS NULL OR price_value >= 0);

ALTER TABLE public.work_orders
ADD CONSTRAINT work_orders_estimated_hours_positive 
CHECK (estimated_hours IS NULL OR estimated_hours >= 0);

ALTER TABLE public.work_orders
ADD CONSTRAINT work_orders_actual_hours_positive 
CHECK (actual_hours IS NULL OR actual_hours >= 0);

-- 2. Add constraints for materials
ALTER TABLE public.materials
ADD CONSTRAINT materials_price_positive 
CHECK (price IS NULL OR price >= 0);

ALTER TABLE public.work_order_materials
ADD CONSTRAINT work_order_materials_quantity_positive 
CHECK (quantity > 0);

ALTER TABLE public.work_order_materials
ADD CONSTRAINT work_order_materials_unit_price_positive 
CHECK (unit_price IS NULL OR unit_price >= 0);

-- 3. Add constraints for equipment
ALTER TABLE public.equipment
ADD CONSTRAINT equipment_standard_rate_positive 
CHECK (standard_rate IS NULL OR standard_rate >= 0);

ALTER TABLE public.work_order_equipment
ADD CONSTRAINT work_order_equipment_rate_positive 
CHECK (rate >= 0);

-- 4. Add constraints for personnel
ALTER TABLE public.personnel
ADD CONSTRAINT personnel_standard_hourly_rate_positive 
CHECK (standard_hourly_rate IS NULL OR standard_hourly_rate >= 0);

ALTER TABLE public.work_order_personnel
ADD CONSTRAINT work_order_personnel_hourly_rate_positive 
CHECK (hourly_rate >= 0);

ALTER TABLE public.work_order_personnel
ADD CONSTRAINT work_order_personnel_estimated_hours_positive 
CHECK (estimated_hours IS NULL OR estimated_hours >= 0);

-- 5. Add constraints for invoices
ALTER TABLE public.invoices
ADD CONSTRAINT invoices_subtotal_nonnegative 
CHECK (subtotal >= 0);

ALTER TABLE public.invoices
ADD CONSTRAINT invoices_tax_amount_nonnegative 
CHECK (tax_amount >= 0);

ALTER TABLE public.invoices
ADD CONSTRAINT invoices_total_amount_nonnegative 
CHECK (total_amount >= 0);

ALTER TABLE public.invoices
ADD CONSTRAINT invoices_due_date_after_issue 
CHECK (due_date >= issue_date);

-- 6. Add email format validation for customers
ALTER TABLE public.customers
ADD CONSTRAINT customers_email_format 
CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- 7. Add email format validation for personnel
ALTER TABLE public.personnel
ADD CONSTRAINT personnel_email_format 
CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- 8. Prevent time entry manipulation
ALTER TABLE public.work_order_time_entries
ADD CONSTRAINT time_entries_end_after_start 
CHECK (end_time IS NULL OR end_time >= start_time);

ALTER TABLE public.work_order_time_entries
ADD CONSTRAINT time_entries_break_duration_valid 
CHECK (break_duration IS NULL OR break_duration >= 0);

-- 9. Prevent break manipulation
ALTER TABLE public.work_order_breaks
ADD CONSTRAINT breaks_end_after_start 
CHECK (end_time IS NULL OR end_time >= start_time);