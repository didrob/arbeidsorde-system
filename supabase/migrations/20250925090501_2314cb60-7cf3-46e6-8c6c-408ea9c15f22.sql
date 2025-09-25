-- Step 1: Drop the old check constraint on role
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Step 2: Add new check constraint that includes all enum values
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'field_worker', 'site_manager', 'system_admin'));

-- Step 3: Update existing admin users to system_admin role
UPDATE public.profiles 
SET role = 'system_admin'
WHERE role = 'admin';

-- Step 4: Create initial organization
INSERT INTO public.organizations (id, name, description, is_active, created_at, updated_at) 
VALUES (
  gen_random_uuid(),
  'Hovedorganisasjon',
  'Standard organisasjon for systemet',
  true,
  now(),
  now()
) ON CONFLICT DO NOTHING;

-- Step 5: Create initial site linked to the organization
WITH org AS (
  SELECT id FROM public.organizations WHERE name = 'Hovedorganisasjon' LIMIT 1
)
INSERT INTO public.sites (id, organization_id, name, location, address, is_active, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  org.id,
  'Hovedsite',
  'Norge',
  'Hovedkontor adresse',
  true,
  now(),
  now()
FROM org
WHERE NOT EXISTS (SELECT 1 FROM public.sites WHERE name = 'Hovedsite');

-- Step 6: Link existing user profiles to the organization and site
WITH org AS (
  SELECT id FROM public.organizations WHERE name = 'Hovedorganisasjon' LIMIT 1
),
site AS (
  SELECT id FROM public.sites WHERE name = 'Hovedsite' LIMIT 1
)
UPDATE public.profiles 
SET 
  organization_id = org.id,
  site_id = site.id
FROM org, site
WHERE organization_id IS NULL OR site_id IS NULL;