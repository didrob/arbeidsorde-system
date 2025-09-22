-- Create a sequence for invoice numbering
CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq;

-- Fix invoice number generation using a simple sequence approach
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
BEGIN
  year_suffix := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  -- Get next value from sequence
  next_number := nextval('public.invoice_number_seq');
  
  -- Format as 4-digit number with year
  new_invoice_number := LPAD(next_number::TEXT, 4, '0') || '-' || year_suffix;
  
  RETURN new_invoice_number;
END;
$function$;
