
-- Step 1: Add customer to enum and add customer_id column
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'customer';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id);
