-- Add scheduling columns to work_orders table
ALTER TABLE public.work_orders 
ADD COLUMN IF NOT EXISTS scheduled_start timestamp with time zone,
ADD COLUMN IF NOT EXISTS scheduled_end timestamp with time zone;

-- Add index for better query performance on scheduled orders
CREATE INDEX IF NOT EXISTS idx_work_orders_scheduled_start 
ON public.work_orders(scheduled_start) 
WHERE scheduled_start IS NOT NULL;

-- Add RLS policy for admins to update scheduling fields
CREATE POLICY "Admins can schedule work orders"
ON public.work_orders
FOR UPDATE
USING (is_admin())
WITH CHECK (is_admin());