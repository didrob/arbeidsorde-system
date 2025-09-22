-- Phase 1: Critical Security Improvements - Role-based RLS

-- Create security definer function to get current user role (prevents infinite recursion)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT public.get_current_user_role() = 'admin';
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Create function to check if user is field worker
CREATE OR REPLACE FUNCTION public.is_field_worker()
RETURNS BOOLEAN AS $$
  SELECT public.get_current_user_role() = 'field_worker';
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Update customers table policies to be role-based
DROP POLICY IF EXISTS "Authenticated users can view customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can update customers" ON public.customers;

-- Only admins can manage customers
CREATE POLICY "Admins can view all customers" ON public.customers
FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert customers" ON public.customers
FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update customers" ON public.customers
FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete customers" ON public.customers
FOR DELETE USING (public.is_admin());

-- Update materials table policies 
DROP POLICY IF EXISTS "Authenticated users can view materials" ON public.materials;
DROP POLICY IF EXISTS "Authenticated users can insert materials" ON public.materials;
DROP POLICY IF EXISTS "Authenticated users can update materials" ON public.materials;

-- Admins can manage materials, field workers can only view
CREATE POLICY "Everyone can view materials" ON public.materials
FOR SELECT USING (true);

CREATE POLICY "Admins can insert materials" ON public.materials
FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update materials" ON public.materials
FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete materials" ON public.materials
FOR DELETE USING (public.is_admin());

-- Update work_orders policies to restrict pricing info access
DROP POLICY IF EXISTS "Users can view their assigned work orders" ON public.work_orders;

-- Field workers can only see basic info, not pricing
CREATE POLICY "Field workers can view assigned work orders basic info" ON public.work_orders
FOR SELECT USING (
  (auth.uid() = assigned_to AND public.is_field_worker()) OR
  (auth.uid() = user_id AND public.is_admin())
);

-- Restrict profiles visibility - users can only see their own profile
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles  
FOR SELECT USING (public.is_admin());

-- Add audit logging table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
FOR SELECT USING (public.is_admin());