
-- Sales order number generator
CREATE OR REPLACE FUNCTION public.generate_sales_order_number()
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $$
DECLARE
  year_part TEXT;
  next_seq INT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(
    NULLIF(SPLIT_PART(sales_order_number, '-', 3), '')::INT
  ), 0) + 1
  INTO next_seq
  FROM public.sales_orders
  WHERE sales_order_number LIKE 'SO-' || year_part || '-%';
  RETURN 'SO-' || year_part || '-' || LPAD(next_seq::TEXT, 4, '0');
END;
$$;

-- Sales orders table
CREATE TABLE public.sales_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_number text UNIQUE NOT NULL DEFAULT generate_sales_order_number(),
  customer_id uuid NOT NULL REFERENCES public.customers(id),
  site_id uuid NOT NULL REFERENCES public.sites(id),
  status text NOT NULL DEFAULT 'draft',
  period_from date,
  period_to date,
  subtotal numeric NOT NULL DEFAULT 0,
  tax_amount numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  notes text,
  approved_by uuid,
  approved_at timestamptz,
  exported_at timestamptz,
  exported_by uuid,
  paid_at timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Sales order lines table
CREATE TABLE public.sales_order_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id uuid NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
  work_order_id uuid NOT NULL REFERENCES public.work_orders(id),
  description text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  line_total numeric NOT NULL DEFAULT 0,
  vat_rate numeric NOT NULL DEFAULT 25,
  vat_amount numeric NOT NULL DEFAULT 0,
  item_type text,
  sort_order integer NOT NULL DEFAULT 0
);

-- Add sales_order_id to work_orders
ALTER TABLE public.work_orders ADD COLUMN sales_order_id uuid REFERENCES public.sales_orders(id);

-- Dynamics prep columns on customers
ALTER TABLE public.customers ADD COLUMN dynamics_customer_number text;
ALTER TABLE public.customers ADD COLUMN dynamics_account text;

-- Updated_at trigger for sales_orders
CREATE TRIGGER update_sales_orders_updated_at
  BEFORE UPDATE ON public.sales_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS for sales_orders
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sales orders for accessible sites"
  ON public.sales_orders FOR SELECT TO authenticated
  USING (public.user_has_site_access(site_id));

CREATE POLICY "Admins can insert sales orders"
  ON public.sales_orders FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() AND public.user_has_site_access(site_id));

CREATE POLICY "Admins can update sales orders"
  ON public.sales_orders FOR UPDATE TO authenticated
  USING (public.is_admin() AND public.user_has_site_access(site_id));

CREATE POLICY "Admins can delete draft sales orders"
  ON public.sales_orders FOR DELETE TO authenticated
  USING (public.is_admin() AND status = 'draft' AND public.user_has_site_access(site_id));

-- RLS for sales_order_lines
ALTER TABLE public.sales_order_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sales order lines"
  ON public.sales_order_lines FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.sales_orders so
    WHERE so.id = sales_order_lines.sales_order_id
    AND public.user_has_site_access(so.site_id)
  ));

CREATE POLICY "Admins can insert sales order lines"
  ON public.sales_order_lines FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.sales_orders so
    WHERE so.id = sales_order_lines.sales_order_id
    AND public.is_admin() AND public.user_has_site_access(so.site_id)
  ));

CREATE POLICY "Admins can delete sales order lines"
  ON public.sales_order_lines FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.sales_orders so
    WHERE so.id = sales_order_lines.sales_order_id
    AND public.is_admin() AND so.status = 'draft'
    AND public.user_has_site_access(so.site_id)
  ));
