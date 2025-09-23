-- Fix the trigger to only complete when no active time entries remain
CREATE OR REPLACE FUNCTION public.update_work_order_status_on_time_entry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- When first time entry is created, mark order in_progress and set started_at
  IF TG_OP = 'INSERT' THEN
    UPDATE public.work_orders 
    SET status = 'in_progress', started_at = COALESCE(started_at, NEW.start_time)
    WHERE id = NEW.work_order_id AND status = 'pending';
  END IF;

  -- When time entry is ended, only mark order completed if no other active entries exist
  IF TG_OP = 'UPDATE' AND OLD.end_time IS NULL AND NEW.end_time IS NOT NULL THEN
    -- Check if there are any other active time entries for this work order
    IF NOT EXISTS (
      SELECT 1 
      FROM public.work_order_time_entries 
      WHERE work_order_id = NEW.work_order_id 
      AND end_time IS NULL 
      AND id != NEW.id
    ) THEN
      -- No other active time entries, so we can mark as completed
      UPDATE public.work_orders 
      SET status = 'completed', completed_at = NEW.end_time
      WHERE id = NEW.work_order_id AND status = 'in_progress';
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Add optional time tracking field for fixed price jobs
ALTER TABLE public.work_orders 
ADD COLUMN IF NOT EXISTS requires_time_tracking boolean DEFAULT false;

-- Add comment to explain the field
COMMENT ON COLUMN public.work_orders.requires_time_tracking IS 'Whether time tracking is required for this work order (useful for fixed price jobs)';

-- Create trigger for work_order_time_entries if it doesn't exist
DROP TRIGGER IF EXISTS update_work_order_status_on_time_entry ON public.work_order_time_entries;

CREATE TRIGGER update_work_order_status_on_time_entry
  AFTER INSERT OR UPDATE ON public.work_order_time_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_work_order_status_on_time_entry();