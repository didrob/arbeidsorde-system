-- Simply assign existing work orders to sites to populate the dashboard charts
-- This will distribute work orders between the two active sites

-- Update first half of work orders to Hovedsite
UPDATE work_orders 
SET site_id = '1505703f-1d66-45a0-975a-f9e61f98c792'::uuid
WHERE site_id IS NULL 
AND id IN (
  SELECT id FROM work_orders 
  WHERE site_id IS NULL 
  ORDER BY created_at 
  LIMIT (SELECT COUNT(*)/2 FROM work_orders WHERE site_id IS NULL)
);

-- Update remaining work orders to ASCO Mosjøen
UPDATE work_orders 
SET site_id = 'd9bb212e-50c2-4ec8-a5f6-4a71865719cf'::uuid
WHERE site_id IS NULL;