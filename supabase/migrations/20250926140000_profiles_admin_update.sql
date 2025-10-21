-- Allow admins to update any user profile (primary site, org, role, status)
-- RLS currently only allows users to update their own profile, which blocks admin edits

CREATE POLICY IF NOT EXISTS "Admins can update any profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Optional: make the UPDATE path observable by returning rows in clients that call select()
-- No schema change needed.

