-- Fix the search path for the generate_invoice_number function
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  year_suffix TEXT;
BEGIN
  year_suffix := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '^(\d+)') AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.invoices
  WHERE invoice_number ~ '^\d+-' || year_suffix || '$';
  
  RETURN LPAD(next_number::TEXT, 4, '0') || '-' || year_suffix;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;