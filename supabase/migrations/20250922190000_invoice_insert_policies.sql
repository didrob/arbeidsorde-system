-- RLS INSERT policies for invoices and invoice_line_items to allow non-admins to create invoices

-- Invoices: allow insert when user is creator and has access to the customer's work orders
DROP POLICY IF EXISTS "Users can create invoices for accessible customers" ON public.invoices;
CREATE POLICY "Users can create invoices for accessible customers"
ON public.invoices
FOR INSERT
WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.work_orders wo
    WHERE wo.customer_id = invoices.customer_id
      AND (wo.user_id = auth.uid() OR wo.assigned_to = auth.uid())
  )
);

-- Optional: allow updater if creator
DROP POLICY IF EXISTS "Users can update their invoices" ON public.invoices;
CREATE POLICY "Users can update their invoices"
ON public.invoices
FOR UPDATE
USING (created_by = auth.uid() OR is_admin());

-- Invoice line items: allow insert when invoice is accessible via same customer relation
DROP POLICY IF EXISTS "Users can insert line items for accessible invoices" ON public.invoice_line_items;
CREATE POLICY "Users can insert line items for accessible invoices"
ON public.invoice_line_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.invoices i
    WHERE i.id = invoice_line_items.invoice_id
      AND (
        is_admin() OR EXISTS (
          SELECT 1 FROM public.work_orders wo
          WHERE wo.customer_id = i.customer_id
            AND (wo.user_id = auth.uid() OR wo.assigned_to = auth.uid())
        )
      )
  )
);

-- Add foreign keys for consistency (safe if not existing)
DO $$ BEGIN
  ALTER TABLE public.invoice_line_items
    ADD CONSTRAINT fk_invoice_line_items_invoice
      FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.invoice_line_items
    ADD CONSTRAINT fk_invoice_line_items_work_order
      FOREIGN KEY (work_order_id) REFERENCES public.work_orders(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


