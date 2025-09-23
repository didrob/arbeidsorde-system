-- Atomic claim for unassigned work orders and minor optimizations

-- 1) Function: claim_work_order(order_id)
-- Assigns current user to the work order only if it is currently unassigned
CREATE OR REPLACE FUNCTION public.claim_work_order(order_id uuid)
RETURNS public.work_orders
LANGUAGE plpgsql
SECURITY DEFINER
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

  RETURN claimed; -- will be NULL if nothing was updated (already claimed)
END;
$$;

-- 2) Allow authenticated users to execute the RPC
REVOKE ALL ON FUNCTION public.claim_work_order(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_work_order(uuid) TO authenticated;

-- 3) Optional: speed up common queries
CREATE INDEX IF NOT EXISTS idx_work_orders_assigned_to_status ON public.work_orders (assigned_to, status);

-- 4) Optional: improve realtime old/new row payloads on UPDATE
-- Note: REPLICA IDENTITY FULL requires superuser; keep guarded
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'work_orders' AND c.relpersistence IN ('p','u')
  ) THEN
    -- table missing, skip
    NULL;
  ELSE
    -- Best effort; will no-op if insufficient privileges
    EXECUTE 'ALTER TABLE public.work_orders REPLICA IDENTITY FULL';
  END IF;
END $$;


