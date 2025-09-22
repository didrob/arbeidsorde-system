-- Add foreign key constraint between invoice_line_items and invoices
ALTER TABLE public.invoice_line_items 
ADD CONSTRAINT fk_invoice_line_items_invoice_id 
FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) 
ON DELETE CASCADE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice_id 
ON public.invoice_line_items(invoice_id);