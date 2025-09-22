-- Allow field workers to view customers (needed for dropdown selection)
CREATE POLICY "Field workers can view customers" ON public.customers
FOR SELECT USING (is_field_worker() OR is_admin());

-- Allow users to view all work orders (not just admin-only)
DROP POLICY IF EXISTS "Field workers can view assigned work orders basic info" ON public.work_orders;

CREATE POLICY "Users can view work orders" ON public.work_orders
FOR SELECT USING (
  (auth.uid() = user_id) OR 
  (auth.uid() = assigned_to) OR 
  is_admin()
);