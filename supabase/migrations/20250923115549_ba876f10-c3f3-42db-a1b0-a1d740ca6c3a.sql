-- Fix RLS policies on profiles table to prevent infinite recursion
-- Drop all existing policies first
DROP POLICY IF EXISTS "Admin users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create clean, correct policies using security definer functions
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (public.is_admin());

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Ensure RPC functions exist and are properly defined
CREATE OR REPLACE FUNCTION public.claim_work_order(order_id uuid)
RETURNS public.work_orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.soft_delete_work_order(order_id uuid, reason text DEFAULT NULL::text)
RETURNS public.work_orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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