-- Add foreign key constraint between invoices and customers
ALTER TABLE public.invoices 
ADD CONSTRAINT fk_invoices_customer_id 
FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;