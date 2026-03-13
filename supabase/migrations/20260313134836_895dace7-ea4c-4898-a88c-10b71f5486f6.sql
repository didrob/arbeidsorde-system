
-- Add internal order columns to work_orders
ALTER TABLE public.work_orders
  ADD COLUMN is_internal boolean NOT NULL DEFAULT false,
  ADD COLUMN cost_center text,
  ADD COLUMN linked_order_id uuid REFERENCES public.work_orders(id);

-- Seed ASCO Intern customer per active site
INSERT INTO public.customers (name, site_id, registered_by, registration_status, org_number)
SELECT 'ASCO Intern', s.id, 'system', 'approved', NULL
FROM public.sites s
WHERE s.is_active = true
AND NOT EXISTS (
  SELECT 1 FROM public.customers c
  WHERE c.site_id = s.id AND c.registered_by = 'system' AND c.name = 'ASCO Intern'
);
