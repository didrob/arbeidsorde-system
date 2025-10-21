-- ============================================================================
-- CRITICAL SECURITY FIX: Address all error-level security vulnerabilities
-- ============================================================================

-- 1. CREATE USER ROLES TABLE (fixes privilege escalation vulnerability)
-- ============================================================================

-- Check and create enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('system_admin', 'site_manager', 'field_worker');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create user_roles table if not exists
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "System admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Only admins can manage roles
CREATE POLICY "System admins can manage roles"
ON public.user_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'system_admin'
  )
);

-- Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

-- 2. CREATE SECURITY DEFINER FUNCTION (prevents RLS recursion)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 3. MIGRATE EXISTING ROLES FROM PROFILES TO USER_ROLES
-- ============================================================================

-- Migrate existing roles
INSERT INTO public.user_roles (user_id, role)
SELECT 
  user_id,
  CASE 
    WHEN role = 'system_admin' THEN 'system_admin'::app_role
    WHEN role = 'site_manager' THEN 'site_manager'::app_role
    WHEN role = 'field_worker' THEN 'field_worker'::app_role
    ELSE 'field_worker'::app_role
  END
FROM public.profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 4. UPDATE ALL SECURITY DEFINER FUNCTIONS TO USE has_role()
-- ============================================================================

-- Update is_admin to check user_roles
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    public.has_role(auth.uid(), 'system_admin'::app_role) OR
    public.has_role(auth.uid(), 'site_manager'::app_role),
    false
  );
$$;

-- Update is_system_admin
CREATE OR REPLACE FUNCTION public.is_system_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    public.has_role(auth.uid(), 'system_admin'::app_role),
    false
  );
$$;

-- Update is_site_manager
CREATE OR REPLACE FUNCTION public.is_site_manager()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    public.has_role(auth.uid(), 'site_manager'::app_role),
    false
  );
$$;

-- Update is_field_worker
CREATE OR REPLACE FUNCTION public.is_field_worker()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    public.has_role(auth.uid(), 'field_worker'::app_role),
    false
  );
$$;

-- Update get_current_user_role to use user_roles
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role::text FROM public.user_roles WHERE user_id = auth.uid() ORDER BY 
      CASE role
        WHEN 'system_admin' THEN 1
        WHEN 'site_manager' THEN 2
        WHEN 'field_worker' THEN 3
      END
      LIMIT 1
    ),
    'field_worker'
  );
$$;

-- 5. FIX CUSTOMERS RLS POLICY (prevent NULL site_id exposure)
-- ============================================================================

-- Drop old permissive policies
DROP POLICY IF EXISTS "Users can view customers from accessible sites" ON public.customers;
DROP POLICY IF EXISTS "Field workers can view customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can view customers" ON public.customers;

-- Create strict policy - only admins or users with explicit site access
CREATE POLICY "Users can view customers from accessible sites"
ON public.customers
FOR SELECT
USING (
  is_admin() OR 
  (site_id = ANY(get_user_accessible_site_ids()) AND site_id IS NOT NULL)
);

-- Drop and recreate other customer policies
DROP POLICY IF EXISTS "Admins can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Admins can update customers" ON public.customers;
DROP POLICY IF EXISTS "Admins can delete customers" ON public.customers;

CREATE POLICY "Admins can insert customers"
ON public.customers
FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Admins can update customers"
ON public.customers
FOR UPDATE
USING (is_admin());

CREATE POLICY "Admins can delete customers"
ON public.customers
FOR DELETE
USING (is_admin());

-- 6. FIX PERSONNEL RLS POLICY (restrict to admins/managers only)
-- ============================================================================

-- Drop old permissive policies
DROP POLICY IF EXISTS "Users can view personnel from accessible sites" ON public.personnel;
DROP POLICY IF EXISTS "Field workers can view basic personnel info" ON public.personnel;
DROP POLICY IF EXISTS "Everyone can view personnel" ON public.personnel;
DROP POLICY IF EXISTS "Admins can view all personnel data" ON public.personnel;
DROP POLICY IF EXISTS "Only managers can view personnel" ON public.personnel;

-- Only admins and site managers can view personnel (protects salaries)
CREATE POLICY "Only managers can view personnel"
ON public.personnel
FOR SELECT
USING (
  is_admin() OR is_site_manager()
);

-- Drop and recreate other personnel policies
DROP POLICY IF EXISTS "Admins can insert personnel" ON public.personnel;
DROP POLICY IF EXISTS "Admins can update personnel" ON public.personnel;
DROP POLICY IF EXISTS "Admins can delete personnel" ON public.personnel;

CREATE POLICY "Admins can insert personnel"
ON public.personnel
FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Admins can update personnel"
ON public.personnel
FOR UPDATE
USING (is_admin());

CREATE POLICY "Admins can delete personnel"
ON public.personnel
FOR DELETE
USING (is_admin());

-- 7. TRIGGER TO AUTO-UPDATE TIMESTAMPS
-- ============================================================================

DROP TRIGGER IF EXISTS update_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 8. TRIGGER TO SYNC NEW USERS WITH DEFAULT ROLE
-- ============================================================================

-- Update handle_new_user to use user_roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    'field_worker'
  );
  
  -- Create default role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'field_worker'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- 9. MIGRATE NULL SITE_IDs TO PROPER SITES (data fix)
-- ============================================================================

-- Assign customers with NULL site_id to the first available site
UPDATE public.customers
SET site_id = (SELECT id FROM public.sites WHERE is_active = true ORDER BY created_at LIMIT 1)
WHERE site_id IS NULL
  AND EXISTS (SELECT 1 FROM public.sites WHERE is_active = true);

-- Assign personnel with NULL site_id to the first available site
UPDATE public.personnel
SET site_id = (SELECT id FROM public.sites WHERE is_active = true ORDER BY created_at LIMIT 1)
WHERE site_id IS NULL
  AND EXISTS (SELECT 1 FROM public.sites WHERE is_active = true);