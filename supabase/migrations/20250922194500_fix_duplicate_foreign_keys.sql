-- Fix duplicate foreign keys between invoice_line_items and invoices
-- This is causing the "more than one relationship" error

-- First, drop all existing foreign key constraints between invoice_line_items and invoices
ALTER TABLE public.invoice_line_items 
DROP CONSTRAINT IF EXISTS fk_invoice_line_items_invoice_id;

ALTER TABLE public.invoice_line_items 
DROP CONSTRAINT IF EXISTS fk_invoice_line_items_invoice;

ALTER TABLE public.invoice_line_items 
DROP CONSTRAINT IF EXISTS fk_line_items_invoice;

-- Also drop work order constraint if it exists
ALTER TABLE public.invoice_line_items 
DROP CONSTRAINT IF EXISTS fk_line_items_work_order;

-- Now create ONE clean foreign key constraint
ALTER TABLE public.invoice_line_items 
ADD CONSTRAINT fk_invoice_line_items_invoice_id 
FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;

-- And one for work orders
ALTER TABLE public.invoice_line_items 
ADD CONSTRAINT fk_invoice_line_items_work_order_id 
FOREIGN KEY (work_order_id) REFERENCES public.work_orders(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice_id 
ON public.invoice_line_items(invoice_id);

CREATE INDEX IF NOT EXISTS idx_invoice_line_items_work_order_id 
ON public.invoice_line_items(work_order_id);
