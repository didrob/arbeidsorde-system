-- Fix the remaining recursion issue in profiles policy
-- Drop the problematic policy that still queries profiles table directly
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create correct policy using the security definer function
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  -- Allow users to see their own profile always
  auth.uid() = user_id 
  OR 
  -- Use security definer function to avoid recursion
  public.is_admin()
);