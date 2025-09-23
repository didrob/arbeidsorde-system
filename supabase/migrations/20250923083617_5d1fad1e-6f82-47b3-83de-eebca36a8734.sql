-- Fix circular RLS dependency - More careful approach to avoid conflicts
-- The issue: is_admin() -> get_current_user_role() -> profiles table -> RLS policy calls is_admin() = circular dependency

-- Step 1: Drop ALL existing RLS policies on profiles table to start fresh
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin users can view all profiles" ON public.profiles;

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

-- Step 4: Create new non-circular RLS policies on profiles table
-- Users can view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can update their own profile  
CREATE POLICY "Users can update own profile"
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Admin policy that doesn't use is_admin() function to avoid circular dependency
CREATE POLICY "Admins can view all profiles non-circular"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin'
  )
);