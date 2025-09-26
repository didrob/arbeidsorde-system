-- Add RLS policies for organizations
CREATE POLICY "System admins can manage organizations" 
ON public.organizations FOR ALL 
USING (public.get_current_user_role() = 'system_admin');

CREATE POLICY "Users can view their organization" 
ON public.organizations FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles p 
  WHERE p.user_id = auth.uid() 
  AND p.organization_id = organizations.id
));

-- Add RLS policies for sites
CREATE POLICY "System admins can manage sites" 
ON public.sites FOR ALL 
USING (public.get_current_user_role() = 'system_admin');

CREATE POLICY "Site managers can manage their sites" 
ON public.sites FOR ALL 
USING (
  public.get_current_user_role() = 'site_manager' 
  AND EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.site_id = sites.id
  )
);

CREATE POLICY "Users can view accessible sites" 
ON public.sites FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND (
      p.site_id = sites.id 
      OR EXISTS (
        SELECT 1 FROM public.user_site_access usa 
        WHERE usa.user_id = auth.uid() 
        AND usa.site_id = sites.id
      )
    )
  )
);

-- Add RLS policies for user_site_access
CREATE POLICY "System admins can manage site access" 
ON public.user_site_access FOR ALL 
USING (public.get_current_user_role() = 'system_admin');

CREATE POLICY "Site managers can manage access to their sites" 
ON public.user_site_access FOR ALL 
USING (
  public.get_current_user_role() = 'site_manager' 
  AND EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.site_id = user_site_access.site_id
  )
);

-- Create helper functions for new roles
CREATE OR REPLACE FUNCTION public.is_system_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_current_user_role() = 'system_admin';
$$;

CREATE OR REPLACE FUNCTION public.is_site_manager()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_current_user_role() = 'site_manager';
$$;

-- Create function to get user's accessible sites
CREATE OR REPLACE FUNCTION public.get_user_accessible_sites(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE(site_id UUID, site_name TEXT, organization_name TEXT)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
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
    -- System admin sees all sites
    OR public.get_current_user_role() = 'system_admin'
  );
$$;