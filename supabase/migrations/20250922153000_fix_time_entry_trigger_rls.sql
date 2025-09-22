-- Ensure work order status updates correctly from time entries and RLS allows assigned users

-- 1) Secure trigger function with SECURITY DEFINER and proper search_path
CREATE OR REPLACE FUNCTION public.update_work_order_status_on_time_entry()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When first time entry is created, mark order in_progress and set started_at
  IF TG_OP = 'INSERT' THEN
    UPDATE public.work_orders 
    SET status = 'in_progress', started_at = COALESCE(started_at, NEW.start_time)
    WHERE id = NEW.work_order_id AND status = 'pending';
  END IF;

  -- When time entry is ended, mark order completed and set completed_at
  IF TG_OP = 'UPDATE' AND OLD.end_time IS NULL AND NEW.end_time IS NOT NULL THEN
    UPDATE public.work_orders 
    SET status = 'completed', completed_at = NEW.end_time
    WHERE id = NEW.work_order_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 2) Recreate trigger to use the function above
DROP TRIGGER IF EXISTS trigger_update_work_order_status_on_time_entry ON public.work_order_time_entries;
CREATE TRIGGER trigger_update_work_order_status_on_time_entry
AFTER INSERT OR UPDATE ON public.work_order_time_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_work_order_status_on_time_entry();

-- 3) RLS: allow both owner and assigned field worker to view/update work orders
DROP POLICY IF EXISTS "Users can view their assigned work orders" ON public.work_orders;
CREATE POLICY "Users can view their assigned work orders"
ON public.work_orders FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = assigned_to);

DROP POLICY IF EXISTS "Users can update their assigned work orders" ON public.work_orders;
CREATE POLICY "Users can update their assigned work orders"
ON public.work_orders FOR UPDATE
USING (auth.uid() = user_id OR auth.uid() = assigned_to);


