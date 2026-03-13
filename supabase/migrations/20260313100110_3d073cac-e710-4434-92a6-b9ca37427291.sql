
-- is_customer() function
CREATE OR REPLACE FUNCTION public.is_customer()
  RETURNS boolean
  LANGUAGE sql
  STABLE SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT COALESCE(public.has_role(auth.uid(), 'customer'::app_role), false);
$$;

-- Update get_current_user_role with customer priority
CREATE OR REPLACE FUNCTION public.get_current_user_role()
  RETURNS text
  LANGUAGE sql
  STABLE SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role::text FROM public.user_roles WHERE user_id = auth.uid() ORDER BY 
      CASE role
        WHEN 'system_admin' THEN 1
        WHEN 'site_manager' THEN 2
        WHEN 'field_worker' THEN 3
        WHEN 'customer' THEN 4
      END
      LIMIT 1
    ),
    'field_worker'
  );
$$;

-- Helper: get customer_id for current user
CREATE OR REPLACE FUNCTION public.get_customer_id_for_user(user_uuid uuid DEFAULT auth.uid())
  RETURNS uuid
  LANGUAGE sql
  STABLE SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT customer_id FROM public.profiles WHERE user_id = user_uuid LIMIT 1;
$$;

-- RLS policies for customers
CREATE POLICY "Customers can view their own orders"
  ON public.work_orders FOR SELECT TO authenticated
  USING (public.is_customer() AND customer_id = public.get_customer_id_for_user());

CREATE POLICY "Customers can create orders"
  ON public.work_orders FOR INSERT TO authenticated
  WITH CHECK (public.is_customer() AND customer_id = public.get_customer_id_for_user() AND status = 'pending');

CREATE POLICY "Customers can view own customer record"
  ON public.customers FOR SELECT TO authenticated
  USING (public.is_customer() AND id = public.get_customer_id_for_user());

CREATE POLICY "Customers can view their order attachments"
  ON public.work_order_attachments FOR SELECT TO authenticated
  USING (public.is_customer() AND EXISTS (
    SELECT 1 FROM public.work_orders wo
    WHERE wo.id = work_order_attachments.work_order_id
    AND wo.customer_id = public.get_customer_id_for_user()
  ));

CREATE POLICY "Customers can add attachments to their orders"
  ON public.work_order_attachments FOR INSERT TO authenticated
  WITH CHECK (public.is_customer() AND EXISTS (
    SELECT 1 FROM public.work_orders wo
    WHERE wo.id = work_order_attachments.work_order_id
    AND wo.customer_id = public.get_customer_id_for_user()
  ));
