-- Fix the get_current_user_role function to work properly with auth context
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()),
    'field_worker'
  );
$$;

-- Update get_user_accessible_sites to properly handle system_admin users
CREATE OR REPLACE FUNCTION public.get_user_accessible_sites(user_uuid uuid DEFAULT auth.uid())
RETURNS TABLE(site_id uuid, site_name text, organization_name text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT DISTINCT 
    s.id as site_id,
    s.name as site_name,
    o.name as organization_name
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
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = user_uuid
      AND p.role = 'system_admin'
      AND p.organization_id = o.id
    )
  )
  ORDER BY s.name;
$$;