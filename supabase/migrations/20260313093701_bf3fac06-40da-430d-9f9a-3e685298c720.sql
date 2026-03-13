
-- Add customer registration columns
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS org_number text,
  ADD COLUMN IF NOT EXISTS org_form text,
  ADD COLUMN IF NOT EXISTS industry_code text,
  ADD COLUMN IF NOT EXISTS invoice_email text,
  ADD COLUMN IF NOT EXISTS registration_status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS registered_by text,
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Unique partial index on org_number (only non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_org_number 
  ON public.customers (org_number) 
  WHERE org_number IS NOT NULL;

-- Allow anon users to INSERT customers with pending_approval status (self-registration)
CREATE POLICY "Anon can self-register customers"
  ON public.customers
  FOR INSERT
  TO anon
  WITH CHECK (registration_status = 'pending_approval');

-- Allow anon to read active sites for the registration dropdown
CREATE POLICY "Anon can view active sites for registration"
  ON public.sites
  FOR SELECT
  TO anon
  USING (is_active = true);
