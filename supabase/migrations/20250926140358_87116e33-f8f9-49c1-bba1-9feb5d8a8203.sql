-- Fix Security Definer Views by recreating them without SECURITY DEFINER

-- Drop the existing security definer views
DROP VIEW IF EXISTS public.site_productivity_stats CASCADE;
DROP VIEW IF EXISTS public.site_revenue_stats CASCADE;
DROP VIEW IF EXISTS public.site_work_order_stats CASCADE;

-- Recreate site_productivity_stats without SECURITY DEFINER
-- Views will inherit proper access control from underlying tables
CREATE VIEW public.site_productivity_stats AS
SELECT 
    s.id as site_id,
    s.name as site_name,
    o.name as organization_name,
    COUNT(DISTINCT p.user_id) as active_workers,
    COALESCE(SUM(
        CASE 
            WHEN wote.end_time IS NOT NULL THEN 
                EXTRACT(EPOCH FROM (wote.end_time - wote.start_time)) / 3600.0
            ELSE 0
        END
    ), 0) as total_hours_worked,
    CASE 
        WHEN COUNT(wo.id) > 0 THEN
            ROUND((COUNT(CASE WHEN wo.status = 'completed' THEN 1 END)::numeric / COUNT(wo.id)::numeric) * 100, 2)
        ELSE 0
    END as avg_efficiency_percentage
FROM public.sites s
LEFT JOIN public.organizations o ON s.organization_id = o.id
LEFT JOIN public.profiles p ON p.site_id = s.id
LEFT JOIN public.work_orders wo ON wo.site_id = s.id AND wo.is_deleted = false
LEFT JOIN public.work_order_time_entries wote ON wote.work_order_id = wo.id
WHERE s.is_active = true
GROUP BY s.id, s.name, o.name;

-- Recreate site_revenue_stats without SECURITY DEFINER
CREATE VIEW public.site_revenue_stats AS
SELECT 
    s.id as site_id,
    s.name as site_name,
    o.name as organization_name,
    COUNT(wo.id) as total_projects,
    COALESCE(SUM(CASE WHEN wo.status = 'completed' THEN COALESCE(wo.price_value, 0) ELSE 0 END), 0) as completed_revenue,
    COALESCE(SUM(COALESCE(wo.price_value, 0)), 0) as total_revenue,
    CASE 
        WHEN COUNT(wo.id) > 0 THEN
            COALESCE(AVG(COALESCE(wo.price_value, 0)), 0)
        ELSE 0
    END as avg_project_value
FROM public.sites s
LEFT JOIN public.organizations o ON s.organization_id = o.id
LEFT JOIN public.work_orders wo ON wo.site_id = s.id AND wo.is_deleted = false
WHERE s.is_active = true
GROUP BY s.id, s.name, o.name;

-- Recreate site_work_order_stats without SECURITY DEFINER
CREATE VIEW public.site_work_order_stats AS
SELECT 
    s.id as site_id,
    s.name as site_name,
    o.name as organization_name,
    COUNT(wo.id) as total_orders,
    COUNT(CASE WHEN wo.status = 'pending' THEN 1 END) as pending_orders,
    COUNT(CASE WHEN wo.status = 'in_progress' THEN 1 END) as in_progress_orders,
    COUNT(CASE WHEN wo.status = 'completed' THEN 1 END) as completed_orders,
    COUNT(CASE WHEN wo.status = 'cancelled' THEN 1 END) as cancelled_orders,
    COUNT(CASE WHEN wo.status = 'completed' AND DATE(wo.completed_at) = CURRENT_DATE THEN 1 END) as completed_today,
    AVG(wo.estimated_hours) as avg_estimated_hours,
    AVG(wo.actual_hours) as avg_actual_hours
FROM public.sites s
LEFT JOIN public.organizations o ON s.organization_id = o.id
LEFT JOIN public.work_orders wo ON wo.site_id = s.id AND wo.is_deleted = false
WHERE s.is_active = true
GROUP BY s.id, s.name, o.name;