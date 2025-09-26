-- Fix unnecessary SECURITY DEFINER functions
-- Keep SECURITY DEFINER only for functions that truly need elevated privileges

-- Functions that SHOULD keep SECURITY DEFINER (for role checking and user management):
-- - get_current_user_role: needs to bypass RLS to check user roles
-- - is_admin, is_field_worker, is_site_manager, is_system_admin: role checking functions
-- - handle_new_user: needs elevated privileges to create profiles
-- - get_user_accessible_sites: needs to check site access across tables
-- - update_work_order_status_on_time_entry: trigger function needs elevated privileges

-- Remove SECURITY DEFINER from functions that don't need it:

-- generate_invoice_number: doesn't need elevated privileges, just generates a unique number
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  timestamp_part TEXT;
  random_part TEXT;
BEGIN
  -- Use timestamp + random for uniqueness
  timestamp_part := TO_CHAR(NOW(), 'YYYYMMDDHH24MISS');
  random_part := LPAD(FLOOR(RANDOM() * 999)::TEXT, 3, '0');
  
  RETURN 'INV-' || timestamp_part || '-' || random_part;
END;
$$;

-- claim_work_order: can work without SECURITY DEFINER if RLS policies are correct
CREATE OR REPLACE FUNCTION public.claim_work_order(order_id uuid)
RETURNS work_orders
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  claimed public.work_orders;
BEGIN
  UPDATE public.work_orders wo
  SET assigned_to = auth.uid()
  WHERE wo.id = claim_work_order.order_id
    AND wo.assigned_to IS NULL
  RETURNING wo.* INTO claimed;

  RETURN claimed;
END;
$$;

-- soft_delete_work_order: can work without SECURITY DEFINER if RLS policies are correct
CREATE OR REPLACE FUNCTION public.soft_delete_work_order(order_id uuid, reason text DEFAULT NULL::text)
RETURNS work_orders
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  wo public.work_orders;
  has_time_entries boolean;
  actor uuid := auth.uid();
BEGIN
  SELECT * INTO wo FROM public.work_orders WHERE id = order_id;
  IF wo IS NULL THEN
    RAISE EXCEPTION 'Work order not found';
  END IF;

  IF NOT (public.is_admin() OR wo.user_id = actor) THEN
    RAISE EXCEPTION 'Not allowed to delete this work order';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.work_order_time_entries tie WHERE tie.work_order_id = order_id
  ) INTO has_time_entries;

  IF wo.status <> 'pending' OR has_time_entries THEN
    RAISE EXCEPTION 'Cannot delete. Order is active or has time entries. Cancel instead.';
  END IF;

  UPDATE public.work_orders
  SET is_deleted = true,
      deleted_at = now(),
      deleted_by = actor
  WHERE id = order_id AND is_deleted = false
  RETURNING * INTO wo;

  INSERT INTO public.work_order_audit_log (work_order_id, action, details, performed_by)
  VALUES (order_id, 'soft_delete', jsonb_build_object('reason', reason), actor);

  RETURN wo;
END;
$$;