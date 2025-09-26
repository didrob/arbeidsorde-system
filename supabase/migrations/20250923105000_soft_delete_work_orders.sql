-- Soft delete for work_orders + audit log + RPC

-- 1) Columns for soft delete
ALTER TABLE public.work_orders
ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES public.profiles(user_id);

-- 2) Audit log table
CREATE TABLE IF NOT EXISTS public.work_order_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  action text NOT NULL, -- 'soft_delete', 'restore', etc.
  details jsonb,
  performed_by uuid NOT NULL,
  performed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.work_order_audit_log ENABLE ROW LEVEL SECURITY;

-- Allow viewing audit logs to admins
DROP POLICY IF EXISTS "Admins can view work order audit" ON public.work_order_audit_log;
CREATE POLICY "Admins can view work order audit"
ON public.work_order_audit_log FOR SELECT
USING (public.is_admin());

-- 3) RPC: soft_delete_work_order
CREATE OR REPLACE FUNCTION public.soft_delete_work_order(order_id uuid, reason text DEFAULT NULL)
RETURNS public.work_orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  wo public.work_orders;
  has_time_entries boolean;
  actor uuid := auth.uid();
BEGIN
  -- Fetch the work order ignoring RLS
  SELECT * INTO wo FROM public.work_orders WHERE id = order_id;
  IF wo IS NULL THEN
    RAISE EXCEPTION 'Work order not found';
  END IF;

  -- Only owner or admin may delete
  IF NOT (public.is_admin() OR wo.user_id = actor) THEN
    RAISE EXCEPTION 'Not allowed to delete this work order';
  END IF;

  -- Business rule: only delete pending orders with no time entries
  SELECT EXISTS (
    SELECT 1 FROM public.work_order_time_entries tie WHERE tie.work_order_id = order_id
  ) INTO has_time_entries;

  IF wo.status <> 'pending' OR has_time_entries THEN
    RAISE EXCEPTION 'Cannot delete. Order is active or has time entries. Cancel instead.';
  END IF;

  -- Perform soft delete
  UPDATE public.work_orders
  SET is_deleted = true,
      deleted_at = now(),
      deleted_by = actor
  WHERE id = order_id AND is_deleted = false
  RETURNING * INTO wo;

  -- Log
  INSERT INTO public.work_order_audit_log (work_order_id, action, details, performed_by)
  VALUES (order_id, 'soft_delete', jsonb_build_object('reason', reason), actor);

  RETURN wo;
END;
$$;

REVOKE ALL ON FUNCTION public.soft_delete_work_order(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.soft_delete_work_order(uuid, text) TO authenticated;


