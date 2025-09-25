-- Update RLS policies to allow users without organization/site to access basic functionality
-- This allows new users to see onboarding even if they don't have org/site assigned yet

-- Update profiles policy to allow users to view their own profile even without org/site
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to update their own profile for onboarding completion  
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- Update organizations policy to allow all authenticated users to view (for onboarding selection)
CREATE POLICY "All authenticated users can view organizations"
ON public.organizations
FOR SELECT
TO authenticated
USING (is_active = true);

-- Update sites policy to allow all authenticated users to view (for onboarding selection)  
CREATE POLICY "All authenticated users can view sites"
ON public.sites
FOR SELECT  
TO authenticated
USING (is_active = true);