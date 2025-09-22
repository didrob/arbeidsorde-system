-- Fix the function search path security issue
CREATE OR REPLACE FUNCTION public.update_work_order_status_on_time_entry()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Set work order status to 'in_progress' when first time entry is created
  IF TG_OP = 'INSERT' THEN
    UPDATE public.work_orders 
    SET status = 'in_progress', started_at = COALESCE(started_at, NEW.start_time)
    WHERE id = NEW.work_order_id AND status = 'pending';
  END IF;
  
  -- Set work order status to 'completed' when time entry is ended
  IF TG_OP = 'UPDATE' AND OLD.end_time IS NULL AND NEW.end_time IS NOT NULL THEN
    UPDATE public.work_orders 
    SET status = 'completed', completed_at = NEW.end_time
    WHERE id = NEW.work_order_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;