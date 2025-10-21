-- Fix remaining work orders with NULL site_id
-- Assign them to a default site or the user's primary site

-- First, let's see what sites we have available
-- This will help us assign NULL site_id work orders to appropriate sites

-- Update work orders with NULL site_id to the user's primary site
-- If user has no primary site, assign to the first available site
UPDATE work_orders 
SET site_id = (
  SELECT p.site_id 
  FROM profiles p 
  WHERE p.user_id = work_orders.user_id 
  AND p.site_id IS NOT NULL
  LIMIT 1
)
WHERE site_id IS NULL;

-- For any remaining work orders with NULL site_id (users without primary site),
-- assign them to the first active site
UPDATE work_orders 
SET site_id = (
  SELECT id 
  FROM sites 
  WHERE is_active = true 
  ORDER BY created_at 
  LIMIT 1
)
WHERE site_id IS NULL;

-- Verify the fix
SELECT 
  COUNT(*) as total_work_orders,
  COUNT(site_id) as work_orders_with_site,
  COUNT(*) - COUNT(site_id) as work_orders_without_site
FROM work_orders 
WHERE is_deleted = false;
