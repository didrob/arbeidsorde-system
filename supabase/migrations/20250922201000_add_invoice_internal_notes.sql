-- Add internal_notes field to invoices table for internal revision notes
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS internal_notes TEXT;

-- Add comment to clarify the difference between notes and internal_notes
COMMENT ON COLUMN public.invoices.notes IS 'Customer-visible notes that appear on invoice';
COMMENT ON COLUMN public.invoices.internal_notes IS 'Internal notes for staff revision and tracking, not visible to customers';
