-- Simplify invoice creation by using simple incremental numbers
-- First, let's clean up any problematic constraints and sequences

-- Drop the sequence if it exists
DROP SEQUENCE IF EXISTS public.invoice_number_seq CASCADE;

-- Create a much simpler function that just uses a timestamp-based approach
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  timestamp_part TEXT;
  random_part TEXT;
BEGIN
  -- Use timestamp + random for uniqueness
  timestamp_part := TO_CHAR(NOW(), 'YYYYMMDDHH24MISS');
  random_part := LPAD(FLOOR(RANDOM() * 999)::TEXT, 3, '0');
  
  RETURN 'INV-' || timestamp_part || '-' || random_part;
END;
$function$;

-- Also ensure the unique index exists
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_invoice_number_unique 
ON public.invoices(invoice_number);
