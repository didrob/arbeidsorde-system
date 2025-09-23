-- Clear all test data from database
-- Delete in order to avoid foreign key constraint issues

-- Step 1: Delete invoice line items first
DELETE FROM public.invoice_line_items;

-- Step 2: Delete invoices
DELETE FROM public.invoices;

-- Step 3: Delete adjustment attachments (references work_order_time_adjustments)
DELETE FROM public.adjustment_attachments;

-- Step 4: Delete work order time adjustments
DELETE FROM public.work_order_time_adjustments;

-- Step 5: Delete work order time entries
DELETE FROM public.work_order_time_entries;

-- Step 6: Delete work order materials
DELETE FROM public.work_order_materials;

-- Step 7: Delete work order equipment
DELETE FROM public.work_order_equipment;

-- Step 8: Delete work order personnel
DELETE FROM public.work_order_personnel;

-- Step 9: Delete work order attachments
DELETE FROM public.work_order_attachments;

-- Step 10: Delete work orders (main table)
DELETE FROM public.work_orders;

-- Verification: Show counts of remaining records
SELECT 
  'work_orders' as table_name, COUNT(*) as remaining_count FROM public.work_orders
UNION ALL
SELECT 
  'invoices' as table_name, COUNT(*) as remaining_count FROM public.invoices
UNION ALL
SELECT 
  'invoice_line_items' as table_name, COUNT(*) as remaining_count FROM public.invoice_line_items
UNION ALL
SELECT 
  'work_order_time_entries' as table_name, COUNT(*) as remaining_count FROM public.work_order_time_entries
UNION ALL
SELECT 
  'work_order_materials' as table_name, COUNT(*) as remaining_count FROM public.work_order_materials
UNION ALL
SELECT 
  'work_order_equipment' as table_name, COUNT(*) as remaining_count FROM public.work_order_equipment
UNION ALL
SELECT 
  'work_order_personnel' as table_name, COUNT(*) as remaining_count FROM public.work_order_personnel
UNION ALL
SELECT 
  'work_order_attachments' as table_name, COUNT(*) as remaining_count FROM public.work_order_attachments
UNION ALL
SELECT 
  'work_order_time_adjustments' as table_name, COUNT(*) as remaining_count FROM public.work_order_time_adjustments
UNION ALL
SELECT 
  'adjustment_attachments' as table_name, COUNT(*) as remaining_count FROM public.adjustment_attachments
ORDER BY table_name;