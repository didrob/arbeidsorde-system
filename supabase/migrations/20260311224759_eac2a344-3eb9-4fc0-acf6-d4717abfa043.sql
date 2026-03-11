
-- Fix security definer views by setting security_invoker
ALTER VIEW public.org_customers SET (security_invoker = on);
ALTER VIEW public.org_materials SET (security_invoker = on);
ALTER VIEW public.org_equipment SET (security_invoker = on);
ALTER VIEW public.org_personnel SET (security_invoker = on);
ALTER VIEW public.org_work_orders SET (security_invoker = on);
