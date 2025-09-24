-- Allow field workers to view pool orders (unassigned work orders)
CREATE POLICY "Field workers can view pool orders"
  ON public.work_orders
  FOR SELECT
  USING (
    (assigned_to IS NULL AND status = 'pending' AND is_deleted = false)
    OR (auth.uid() = user_id) 
    OR (auth.uid() = assigned_to) 
    OR is_admin()
  );