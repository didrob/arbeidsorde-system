-- Update user role to admin (assuming this is for the current user)
-- This will make any existing user with role 'field_worker' become an admin
UPDATE public.profiles 
SET role = 'admin' 
WHERE role = 'field_worker';

-- Also ensure we have an admin role option
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'manager', 'field_worker'));