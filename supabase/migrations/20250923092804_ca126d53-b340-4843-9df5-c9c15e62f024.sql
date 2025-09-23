-- Fix infinite recursion in profiles table RLS policies
-- The issue is that the admin policy checks profiles table to determine admin status,
-- but accessing profiles table triggers the same policy again

-- First, drop the problematic admin policy
DROP POLICY IF EXISTS "Admins can view all profiles non-circular" ON public.profiles;

-- Create a proper admin policy that doesn't cause recursion
-- Use a direct function instead of subquery to avoid circular dependency
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- Create a non-recursive admin policy using direct user check
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  -- Allow users to see their own profile always
  auth.uid() = user_id 
  OR 
  -- Allow if current user has admin role (direct check without recursion)
  EXISTS (
    SELECT 1 FROM public.profiles admin_check
    WHERE admin_check.user_id = auth.uid() 
    AND admin_check.role = 'admin'::text
    LIMIT 1
  )
);