-- Create security definer functions for site-based access control
CREATE OR REPLACE FUNCTION public.user_has_site_access(user_uuid uuid, target_site_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = user_uuid 
    AND p.site_id = target_site_id
  ) OR EXISTS (
    SELECT 1 FROM public.user_site_access usa 
    WHERE usa.user_id = user_uuid 
    AND usa.site_id = target_site_id
  ) OR public.get_current_user_role() = 'system_admin';
$$;

CREATE OR REPLACE FUNCTION public.get_user_accessible_site_ids(user_uuid uuid DEFAULT auth.uid())
RETURNS uuid[]
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT ARRAY(
    SELECT DISTINCT s.id
    FROM public.sites s
    JOIN public.organizations o ON s.organization_id = o.id
    WHERE s.is_active = true
    AND o.is_active = true
    AND (
      -- User's primary site
      EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.user_id = user_uuid 
        AND p.site_id = s.id
      )
      -- User has cross-site access
      OR EXISTS (
        SELECT 1 FROM public.user_site_access usa 
        WHERE usa.user_id = user_uuid 
        AND usa.site_id = s.id
      )
      -- System admin sees all sites in their organization
      OR (
        public.get_current_user_role() = 'system_admin'
        AND EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.user_id = user_uuid
          AND p.organization_id = o.id
        )
      )
    )
  );
$$;

-- Update RLS policies for materials table
DROP POLICY IF EXISTS "Everyone can view materials" ON public.materials;

CREATE POLICY "Users can view materials from accessible sites" 
ON public.materials 
FOR SELECT 
USING (
  site_id = ANY(public.get_user_accessible_site_ids()) 
  OR site_id IS NULL
);

-- Update RLS policies for equipment table  
DROP POLICY IF EXISTS "Everyone can view equipment" ON public.equipment;

CREATE POLICY "Users can view equipment from accessible sites"
ON public.equipment
FOR SELECT
USING (
  site_id = ANY(public.get_user_accessible_site_ids())
  OR site_id IS NULL
);

-- Update RLS policies for customers table
DROP POLICY IF EXISTS "Admins can view all customers" ON public.customers;
DROP POLICY IF EXISTS "Field workers can view customers" ON public.customers;

CREATE POLICY "Users can view customers from accessible sites"
ON public.customers
FOR SELECT
USING (
  is_admin() OR 
  site_id = ANY(public.get_user_accessible_site_ids()) OR 
  site_id IS NULL
);

-- Update RLS policies for personnel table
DROP POLICY IF EXISTS "Field workers can view basic personnel info" ON public.personnel;

CREATE POLICY "Users can view personnel from accessible sites"
ON public.personnel
FOR SELECT
USING (
  is_admin() OR 
  site_id = ANY(public.get_user_accessible_site_ids()) OR 
  site_id IS NULL
);