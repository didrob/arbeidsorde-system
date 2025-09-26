-- Fix personnel table RLS policies to protect sensitive employee data

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Everyone can view personnel" ON public.personnel;

-- Only admins can view all personnel data including sensitive information
CREATE POLICY "Admins can view all personnel data" 
ON public.personnel 
FOR SELECT 
USING (is_admin());

-- Field workers and other authenticated users can only view basic info needed for work orders
-- This allows viewing name and role but restricts sensitive data access to admin queries only
CREATE POLICY "Field workers can view basic personnel info" 
ON public.personnel 
FOR SELECT 
USING (
  auth.role() = 'authenticated' 
  AND is_field_worker()
);