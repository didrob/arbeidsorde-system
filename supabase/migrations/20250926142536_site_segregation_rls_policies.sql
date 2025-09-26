-- Site Segregation RLS Policies
-- This migration implements proper site-based access control for all tables with site_id

-- First, create helper functions for site-based access control
CREATE OR REPLACE FUNCTION public.user_has_site_access(target_site_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- System admins can access all sites
  SELECT CASE 
    WHEN public.is_system_admin() THEN true
    -- Check if user's primary site matches
    WHEN EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = auth.uid() 
      AND p.site_id = target_site_id
    ) THEN true
    -- Check if user has cross-site access
    WHEN EXISTS (
      SELECT 1 FROM public.user_site_access usa 
      WHERE usa.user_id = auth.uid() 
      AND usa.site_id = target_site_id
    ) THEN true
    ELSE false
  END;
$$;

-- Create function to check if user can access organization data
CREATE OR REPLACE FUNCTION public.user_has_org_access(target_org_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- System admins can access all organizations
  SELECT CASE 
    WHEN public.is_system_admin() THEN true
    -- Check if user belongs to the organization
    WHEN EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = auth.uid() 
      AND p.organization_id = target_org_id
    ) THEN true
    ELSE false
  END;
$$;

-- Update customers table RLS policies
DROP POLICY IF EXISTS "Admins can view all customers" ON public.customers;
DROP POLICY IF EXISTS "Admins can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Admins can update customers" ON public.customers;
DROP POLICY IF EXISTS "Admins can delete customers" ON public.customers;

-- Site-based access for customers
CREATE POLICY "Users can view customers from their sites" 
ON public.customers FOR SELECT 
USING (public.user_has_site_access(site_id));

CREATE POLICY "Users can insert customers to their sites" 
ON public.customers FOR INSERT 
WITH CHECK (public.user_has_site_access(site_id));

CREATE POLICY "Users can update customers in their sites" 
ON public.customers FOR UPDATE 
USING (public.user_has_site_access(site_id));

CREATE POLICY "Users can delete customers from their sites" 
ON public.customers FOR DELETE 
USING (public.user_has_site_access(site_id));

-- Update materials table RLS policies
DROP POLICY IF EXISTS "Everyone can view materials" ON public.materials;
DROP POLICY IF EXISTS "Admins can insert materials" ON public.materials;
DROP POLICY IF EXISTS "Admins can update materials" ON public.materials;
DROP POLICY IF EXISTS "Admins can delete materials" ON public.materials;

-- Site-based access for materials
CREATE POLICY "Users can view materials from their sites" 
ON public.materials FOR SELECT 
USING (public.user_has_site_access(site_id));

CREATE POLICY "Users can insert materials to their sites" 
ON public.materials FOR INSERT 
WITH CHECK (public.user_has_site_access(site_id));

CREATE POLICY "Users can update materials in their sites" 
ON public.materials FOR UPDATE 
USING (public.user_has_site_access(site_id));

CREATE POLICY "Users can delete materials from their sites" 
ON public.materials FOR DELETE 
USING (public.user_has_site_access(site_id));

-- Update equipment table RLS policies
DROP POLICY IF EXISTS "Everyone can view equipment" ON public.equipment;
DROP POLICY IF EXISTS "Admins can insert equipment" ON public.equipment;
DROP POLICY IF EXISTS "Admins can update equipment" ON public.equipment;
DROP POLICY IF EXISTS "Admins can delete equipment" ON public.equipment;

-- Site-based access for equipment
CREATE POLICY "Users can view equipment from their sites" 
ON public.equipment FOR SELECT 
USING (public.user_has_site_access(site_id));

CREATE POLICY "Users can insert equipment to their sites" 
ON public.equipment FOR INSERT 
WITH CHECK (public.user_has_site_access(site_id));

CREATE POLICY "Users can update equipment in their sites" 
ON public.equipment FOR UPDATE 
USING (public.user_has_site_access(site_id));

CREATE POLICY "Users can delete equipment from their sites" 
ON public.equipment FOR DELETE 
USING (public.user_has_site_access(site_id));

-- Update personnel table RLS policies
DROP POLICY IF EXISTS "Everyone can view personnel" ON public.personnel;
DROP POLICY IF EXISTS "Admins can insert personnel" ON public.personnel;
DROP POLICY IF EXISTS "Admins can update personnel" ON public.personnel;
DROP POLICY IF EXISTS "Admins can delete personnel" ON public.personnel;

-- Site-based access for personnel
CREATE POLICY "Users can view personnel from their sites" 
ON public.personnel FOR SELECT 
USING (public.user_has_site_access(site_id));

CREATE POLICY "Users can insert personnel to their sites" 
ON public.personnel FOR INSERT 
WITH CHECK (public.user_has_site_access(site_id));

CREATE POLICY "Users can update personnel in their sites" 
ON public.personnel FOR UPDATE 
USING (public.user_has_site_access(site_id));

CREATE POLICY "Users can delete personnel from their sites" 
ON public.personnel FOR DELETE 
USING (public.user_has_site_access(site_id));

-- Update work_orders table to ensure site-based access
-- (work_orders already has some site filtering, but let's make it consistent)
DROP POLICY IF EXISTS "Field workers can view assigned work orders basic info" ON public.work_orders;

CREATE POLICY "Users can view work orders from their sites" 
ON public.work_orders FOR SELECT 
USING (
  public.user_has_site_access(site_id) AND (
    -- Field workers can see assigned work orders
    (auth.uid() = assigned_to AND public.is_field_worker()) OR
    -- Admins can see all work orders in their sites
    public.is_admin() OR
    public.is_system_admin()
  )
);

-- Update work_order_personnel and work_order_equipment to respect site access
DROP POLICY IF EXISTS "Users can view personnel for their work orders" ON public.work_order_personnel;
DROP POLICY IF EXISTS "Users can add personnel to their work orders" ON public.work_order_personnel;
DROP POLICY IF EXISTS "Users can update personnel for their work orders" ON public.work_order_personnel;

CREATE POLICY "Users can manage personnel for work orders in their sites" 
ON public.work_order_personnel FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.work_orders wo 
    WHERE wo.id = work_order_personnel.work_order_id 
    AND public.user_has_site_access(wo.site_id)
  )
);

-- Similar for work_order_equipment
DROP POLICY IF EXISTS "Users can view equipment for their work orders" ON public.work_order_equipment;
DROP POLICY IF EXISTS "Users can add equipment to their work orders" ON public.work_order_equipment;
DROP POLICY IF EXISTS "Users can update equipment for their work orders" ON public.work_order_equipment;

CREATE POLICY "Users can manage equipment for work orders in their sites" 
ON public.work_order_equipment FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.work_orders wo 
    WHERE wo.id = work_order_equipment.work_order_id 
    AND public.user_has_site_access(wo.site_id)
  )
);

-- Update customer_pricing_agreements to respect site access
DROP POLICY IF EXISTS "Admins can view all customer agreements" ON public.customer_pricing_agreements;
DROP POLICY IF EXISTS "Admins can insert customer agreements" ON public.customer_pricing_agreements;
DROP POLICY IF EXISTS "Admins can update customer agreements" ON public.customer_pricing_agreements;
DROP POLICY IF EXISTS "Admins can delete customer agreements" ON public.customer_pricing_agreements;

CREATE POLICY "Users can manage customer agreements for their sites" 
ON public.customer_pricing_agreements FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.customers c 
    WHERE c.id = customer_pricing_agreements.customer_id 
    AND public.user_has_site_access(c.site_id)
  )
);

-- Create organization-level views for system admins
CREATE OR REPLACE VIEW public.org_customers AS
SELECT 
  c.*,
  s.name as site_name,
  o.name as organization_name
FROM public.customers c
JOIN public.sites s ON c.site_id = s.id
JOIN public.organizations o ON s.organization_id = o.id
WHERE public.user_has_org_access(o.id);

CREATE OR REPLACE VIEW public.org_materials AS
SELECT 
  m.*,
  s.name as site_name,
  o.name as organization_name
FROM public.materials m
JOIN public.sites s ON m.site_id = s.id
JOIN public.organizations o ON s.organization_id = o.id
WHERE public.user_has_org_access(o.id);

CREATE OR REPLACE VIEW public.org_equipment AS
SELECT 
  e.*,
  s.name as site_name,
  o.name as organization_name
FROM public.equipment e
JOIN public.sites s ON e.site_id = s.id
JOIN public.organizations o ON s.organization_id = o.id
WHERE public.user_has_org_access(o.id);

CREATE OR REPLACE VIEW public.org_personnel AS
SELECT 
  p.*,
  s.name as site_name,
  o.name as organization_name
FROM public.personnel p
JOIN public.sites s ON p.site_id = s.id
JOIN public.organizations o ON s.organization_id = o.id
WHERE public.user_has_org_access(o.id);

-- Create organization-level work orders view
CREATE OR REPLACE VIEW public.org_work_orders AS
SELECT 
  wo.*,
  c.name as customer_name,
  s.name as site_name,
  o.name as organization_name
FROM public.work_orders wo
JOIN public.customers c ON wo.customer_id = c.id
JOIN public.sites s ON wo.site_id = s.id
JOIN public.organizations o ON s.organization_id = o.id
WHERE public.user_has_org_access(o.id);

-- Grant permissions on the new views
GRANT SELECT ON public.org_customers TO authenticated;
GRANT SELECT ON public.org_materials TO authenticated;
GRANT SELECT ON public.org_equipment TO authenticated;
GRANT SELECT ON public.org_personnel TO authenticated;
GRANT SELECT ON public.org_work_orders TO authenticated;
