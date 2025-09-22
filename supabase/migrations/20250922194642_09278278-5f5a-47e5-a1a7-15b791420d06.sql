-- Fix generate_invoice_number function to handle NULL values properly
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  next_number INTEGER;
  year_suffix TEXT;
BEGIN
  year_suffix := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  -- Handle NULL values properly by checking for IS NOT NULL
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '^(\d+)') AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.invoices
  WHERE invoice_number IS NOT NULL 
    AND invoice_number ~ ('^\\d+-' || year_suffix || '$');
  
  RETURN LPAD(next_number::TEXT, 4, '0') || '-' || year_suffix;
END;
$function$