-- Fix security issues with the views by adding RLS policies

-- Enable RLS on the views (they need to be tables first to have RLS)
-- We'll create these as regular views without SECURITY DEFINER and add RLS policies to the underlying tables

-- First, drop and recreate the views without SECURITY DEFINER
DROP VIEW IF EXISTS site_work_order_stats;
DROP VIEW IF EXISTS site_revenue_stats;
DROP VIEW IF EXISTS site_productivity_stats;

-- Recreate site work order statistics view
CREATE VIEW site_work_order_stats AS
SELECT 
  wo.site_id,
  s.name AS site_name,
  o.name AS organization_name,
  COUNT(wo.id) AS total_orders,
  COUNT(CASE WHEN wo.status = 'pending' THEN 1 END) AS pending_orders,
  COUNT(CASE WHEN wo.status = 'in_progress' THEN 1 END) AS in_progress_orders,
  COUNT(CASE WHEN wo.status = 'completed' THEN 1 END) AS completed_orders,
  COUNT(CASE WHEN wo.status = 'cancelled' THEN 1 END) AS cancelled_orders,
  COUNT(CASE WHEN wo.status = 'completed' AND DATE(wo.completed_at) = CURRENT_DATE THEN 1 END) AS completed_today,
  AVG(wo.estimated_hours) AS avg_estimated_hours,
  AVG(wo.actual_hours) AS avg_actual_hours
FROM work_orders wo
LEFT JOIN sites s ON wo.site_id = s.id
LEFT JOIN organizations o ON s.organization_id = o.id
WHERE wo.is_deleted = false
  -- Apply same security constraints as work_orders table
  AND (
    wo.assigned_to IS NULL AND wo.status = 'pending' AND wo.is_deleted = false
    OR auth.uid() = wo.user_id 
    OR auth.uid() = wo.assigned_to 
    OR is_admin()
  )
GROUP BY wo.site_id, s.name, o.name;

-- Recreate site revenue statistics view
CREATE VIEW site_revenue_stats AS
SELECT 
  wo.site_id,
  s.name AS site_name,
  o.name AS organization_name,
  SUM(wo.price_value) AS total_revenue,
  SUM(CASE WHEN wo.status = 'completed' THEN wo.price_value ELSE 0 END) AS completed_revenue,
  COUNT(wo.id) AS total_projects,
  AVG(wo.price_value) AS avg_project_value
FROM work_orders wo
LEFT JOIN sites s ON wo.site_id = s.id
LEFT JOIN organizations o ON s.organization_id = o.id
WHERE wo.is_deleted = false
  -- Apply same security constraints as work_orders table
  AND (
    wo.assigned_to IS NULL AND wo.status = 'pending' AND wo.is_deleted = false
    OR auth.uid() = wo.user_id 
    OR auth.uid() = wo.assigned_to 
    OR is_admin()
  )
GROUP BY wo.site_id, s.name, o.name;

-- Recreate site productivity statistics view
CREATE VIEW site_productivity_stats AS
SELECT 
  wo.site_id,
  s.name AS site_name,
  o.name AS organization_name,
  COUNT(DISTINCT wote.user_id) AS active_workers,
  SUM(
    CASE 
      WHEN wote.end_time IS NOT NULL THEN 
        EXTRACT(EPOCH FROM (wote.end_time - wote.start_time)) / 3600
      ELSE 0 
    END
  ) AS total_hours_worked,
  AVG(
    CASE 
      WHEN wo.estimated_hours > 0 AND wo.actual_hours > 0 THEN 
        (wo.estimated_hours / wo.actual_hours) * 100
      ELSE NULL 
    END
  ) AS avg_efficiency_percentage
FROM work_orders wo
LEFT JOIN sites s ON wo.site_id = s.id
LEFT JOIN organizations o ON s.organization_id = o.id
LEFT JOIN work_order_time_entries wote ON wo.id = wote.work_order_id
WHERE wo.is_deleted = false
  -- Apply same security constraints as work_orders table
  AND (
    wo.assigned_to IS NULL AND wo.status = 'pending' AND wo.is_deleted = false
    OR auth.uid() = wo.user_id 
    OR auth.uid() = wo.assigned_to 
    OR is_admin()
  )
  -- And time entries security
  AND (wote.user_id IS NULL OR wote.user_id = auth.uid() OR is_admin())
GROUP BY wo.site_id, s.name, o.name;