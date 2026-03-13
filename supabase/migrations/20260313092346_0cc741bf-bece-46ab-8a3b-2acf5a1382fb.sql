
-- Fix infinite recursion on user_roles: replace self-referencing policy with security definer function
DROP POLICY IF EXISTS "System admins can manage roles" ON public.user_roles;

CREATE POLICY "System admins can manage roles" ON public.user_roles
  FOR ALL
  TO public
  USING (public.has_role(auth.uid(), 'system_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'system_admin'::app_role));
