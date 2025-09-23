-- Fix circular RLS dependency that prevents field workers from accessing work orders
-- The issue: is_admin() -> get_current_user_role() -> profiles table -> RLS policy calls is_admin() = circular dependency

-- Step 1: Drop the problematic RLS policy on profiles table that creates circular dependency
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Step 2: Update get_current_user_role function to use SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Step 3: Update is_admin and is_field_worker functions to ensure they work correctly
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT public.get_current_user_role() = 'admin';
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_field_worker()
RETURNS boolean AS $$
  SELECT public.get_current_user_role() = 'field_worker';
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public;

-- Step 4: Create new RLS policies on profiles table that don't create circular dependencies
-- Users can view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can update their own profile  
CREATE POLICY "Users can update their own profile"
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create a separate policy for admins that uses a different approach
-- This policy allows users with admin role to view all profiles
-- We use a direct query instead of the is_admin() function to avoid circular dependency
CREATE POLICY "Admin users can view all profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin'
  )
);

-- Test the functions work correctly by creating a simple test
-- This should return the role of the current user without circular dependency
SELECT 'Testing role functions:' as test_info;
SELECT public.get_current_user_role() as current_user_role;
SELECT public.is_admin() as is_admin_result;
SELECT public.is_field_worker() as is_field_worker_result;