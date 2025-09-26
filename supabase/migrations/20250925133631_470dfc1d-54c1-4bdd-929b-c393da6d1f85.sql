-- Drop existing views first, then recreate them properly
DROP VIEW IF EXISTS site_work_order_stats CASCADE;
DROP VIEW IF EXISTS site_revenue_stats CASCADE;
DROP VIEW IF EXISTS site_productivity_stats CASCADE;

-- Site work order statistics view
CREATE VIEW site_work_order_stats AS
SELECT 
  s.id as site_id,
  s.name as site_name,
  o.name as organization_name,
  COALESCE(COUNT(wo.id), 0) as total_orders,
  COALESCE(COUNT(CASE WHEN wo.status = 'pending' THEN 1 END), 0) as pending_orders,
  COALESCE(COUNT(CASE WHEN wo.status = 'in_progress' THEN 1 END), 0) as in_progress_orders,
  COALESCE(COUNT(CASE WHEN wo.status = 'completed' THEN 1 END), 0) as completed_orders,
  COALESCE(COUNT(CASE WHEN wo.status = 'cancelled' THEN 1 END), 0) as cancelled_orders,
  COALESCE(COUNT(CASE WHEN wo.status = 'completed' AND wo.completed_at::date = CURRENT_DATE THEN 1 END), 0) as completed_today,
  AVG(wo.estimated_hours) as avg_estimated_hours,
  AVG(wo.actual_hours) as avg_actual_hours
FROM sites s
LEFT JOIN organizations o ON s.organization_id = o.id
LEFT JOIN work_orders wo ON wo.site_id = s.id AND wo.is_deleted = false
WHERE s.is_active = true
GROUP BY s.id, s.name, o.name;

-- Site revenue statistics view
CREATE VIEW site_revenue_stats AS
SELECT 
  s.id as site_id,
  s.name as site_name,
  o.name as organization_name,
  COALESCE(COUNT(wo.id), 0) as total_projects,
  COALESCE(SUM(wo.price_value), 0) as total_revenue,
  COALESCE(SUM(CASE WHEN wo.status = 'completed' THEN wo.price_value ELSE 0 END), 0) as completed_revenue,
  COALESCE(AVG(wo.price_value), 0) as avg_project_value
FROM sites s
LEFT JOIN organizations o ON s.organization_id = o.id
LEFT JOIN work_orders wo ON wo.site_id = s.id AND wo.is_deleted = false
WHERE s.is_active = true
GROUP BY s.id, s.name, o.name;

-- Site productivity statistics view
CREATE VIEW site_productivity_stats AS
SELECT 
  s.id as site_id,
  s.name as site_name,
  o.name as organization_name,
  COALESCE(SUM(
    CASE 
      WHEN wo.actual_hours IS NOT NULL AND wo.actual_hours > 0 THEN wo.actual_hours
      WHEN wo.estimated_hours IS NOT NULL THEN wo.estimated_hours
      ELSE 0 
    END
  ), 0) as total_hours_worked,
  COALESCE(
    AVG(
      CASE 
        WHEN wo.estimated_hours IS NOT NULL AND wo.estimated_hours > 0 AND wo.actual_hours IS NOT NULL 
        THEN (wo.estimated_hours / wo.actual_hours) * 100
        ELSE NULL
      END
    ), 100
  ) as avg_efficiency_percentage,
  COALESCE(COUNT(DISTINCT wo.assigned_to), 0) as active_workers
FROM sites s
LEFT JOIN organizations o ON s.organization_id = o.id
LEFT JOIN work_orders wo ON wo.site_id = s.id AND wo.is_deleted = false
WHERE s.is_active = true
GROUP BY s.id, s.name, o.name;