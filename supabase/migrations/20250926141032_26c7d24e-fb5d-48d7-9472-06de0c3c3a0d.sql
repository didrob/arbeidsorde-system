-- Set views to SECURITY INVOKER to resolve linter finding
-- This ensures views run with the privileges of the querying user
ALTER VIEW public.site_productivity_stats SET (security_invoker = on);
ALTER VIEW public.site_revenue_stats SET (security_invoker = on);
ALTER VIEW public.site_work_order_stats SET (security_invoker = on);
