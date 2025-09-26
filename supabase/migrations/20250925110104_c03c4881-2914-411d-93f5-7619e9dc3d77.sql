-- Fix is_admin function to include system_admin role
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'system_admin'),
    false
  );
$function$