-- Fix invoice number generation to handle race conditions
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  next_number INTEGER;
  year_suffix TEXT;
  new_invoice_number TEXT;
  max_attempts INTEGER := 5;
  attempt INTEGER := 0;
BEGIN
  year_suffix := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  WHILE attempt < max_attempts LOOP
    -- Get the next number with row-level locking
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '^(\d+)') AS INTEGER)), 0) + 1
    INTO next_number
    FROM public.invoices
    WHERE invoice_number IS NOT NULL 
      AND invoice_number ~ ('^\\d+-' || year_suffix || '$')
    FOR UPDATE;
    
    new_invoice_number := LPAD(next_number::TEXT, 4, '0') || '-' || year_suffix;
    
    -- Check if this number already exists
    IF NOT EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE invoice_number = new_invoice_number
    ) THEN
      RETURN new_invoice_number;
    END IF;
    
    attempt := attempt + 1;
  END LOOP;
  
  -- If we get here, something went wrong
  RAISE EXCEPTION 'Could not generate unique invoice number after % attempts', max_attempts;
END;
$function$;

-- Also create a unique index to ensure invoice numbers are unique
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_invoice_number_unique 
ON public.invoices(invoice_number);
