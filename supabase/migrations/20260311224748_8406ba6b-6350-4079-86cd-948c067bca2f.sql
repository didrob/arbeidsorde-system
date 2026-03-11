
-- ============================================================================
-- CONSOLIDATED DATABASE SCHEMA - Workorder System
-- ============================================================================

-- 1. ENUMS
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('system_admin', 'site_manager', 'field_worker');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. UTILITY FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 3. CORE TABLES
-- ============================================================================

-- Organizations
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Sites
CREATE TABLE public.sites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'field_worker' CHECK (role IN ('admin', 'field_worker', 'site_manager', 'system_admin')),
  organization_id UUID REFERENCES public.organizations(id),
  site_id UUID REFERENCES public.sites(id),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User Roles (separate table for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- User Site Access
CREATE TABLE public.user_site_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  granted_by UUID NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, site_id)
);

-- Customers
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  site_id UUID REFERENCES public.sites(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT customers_email_format CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Materials
CREATE TABLE public.materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2),
  unit TEXT NOT NULL DEFAULT 'stk',
  site_id UUID REFERENCES public.sites(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT materials_price_positive CHECK (price IS NULL OR price >= 0)
);

-- Personnel
CREATE TABLE public.personnel (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  standard_hourly_rate NUMERIC,
  role TEXT DEFAULT 'worker',
  is_active BOOLEAN DEFAULT true,
  site_id UUID REFERENCES public.sites(id),
  daily_capacity_hours DECIMAL(5,2) DEFAULT 7.5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT personnel_email_format CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT personnel_standard_hourly_rate_positive CHECK (standard_hourly_rate IS NULL OR standard_hourly_rate >= 0)
);

-- Equipment
CREATE TABLE public.equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  pricing_type TEXT NOT NULL DEFAULT 'hourly',
  standard_rate NUMERIC,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  site_id UUID REFERENCES public.sites(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT equipment_standard_rate_positive CHECK (standard_rate IS NULL OR standard_rate >= 0)
);

-- Work Orders
CREATE TABLE public.work_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  pricing_type TEXT NOT NULL DEFAULT 'hourly' CHECK (pricing_type IN ('hourly', 'fixed', 'per_trip', 'per_ton', 'ad_hoc')),
  pricing_model TEXT DEFAULT 'fixed',
  price_value DECIMAL(10,2),
  estimated_hours DECIMAL(4,2),
  actual_hours DECIMAL(4,2),
  notes TEXT,
  assigned_to UUID REFERENCES public.profiles(user_id),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  scheduled_start TIMESTAMP WITH TIME ZONE,
  scheduled_end TIMESTAMP WITH TIME ZONE,
  gps_location POINT,
  site_id UUID REFERENCES public.sites(id),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES public.profiles(user_id),
  requires_time_tracking BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT work_orders_price_value_positive CHECK (price_value IS NULL OR price_value >= 0),
  CONSTRAINT work_orders_estimated_hours_positive CHECK (estimated_hours IS NULL OR estimated_hours >= 0),
  CONSTRAINT work_orders_actual_hours_positive CHECK (actual_hours IS NULL OR actual_hours >= 0)
);

-- Work Order Attachments
CREATE TABLE public.work_order_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Work Order Time Entries
CREATE TABLE public.work_order_time_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE,
  break_duration INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT time_entries_end_after_start CHECK (end_time IS NULL OR end_time >= start_time),
  CONSTRAINT time_entries_break_duration_valid CHECK (break_duration IS NULL OR break_duration >= 0)
);

-- Work Order Breaks
CREATE TABLE public.work_order_breaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  time_entry_id UUID NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE NULL,
  reason TEXT NOT NULL DEFAULT 'other',
  notes TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT breaks_end_after_start CHECK (end_time IS NULL OR end_time >= start_time)
);

-- Work Order Materials
CREATE TABLE public.work_order_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES public.materials(id),
  quantity NUMERIC NOT NULL,
  unit_price NUMERIC,
  notes TEXT,
  added_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT work_order_materials_quantity_positive CHECK (quantity > 0),
  CONSTRAINT work_order_materials_unit_price_positive CHECK (unit_price IS NULL OR unit_price >= 0)
);

-- Work Order Personnel
CREATE TABLE public.work_order_personnel (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  personnel_id UUID NOT NULL REFERENCES public.personnel(id) ON DELETE CASCADE,
  hourly_rate NUMERIC NOT NULL,
  estimated_hours NUMERIC,
  actual_hours NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(work_order_id, personnel_id),
  CONSTRAINT work_order_personnel_hourly_rate_positive CHECK (hourly_rate >= 0),
  CONSTRAINT work_order_personnel_estimated_hours_positive CHECK (estimated_hours IS NULL OR estimated_hours >= 0)
);

-- Work Order Equipment
CREATE TABLE public.work_order_equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  pricing_type TEXT NOT NULL DEFAULT 'hourly',
  rate NUMERIC NOT NULL,
  estimated_quantity NUMERIC,
  actual_quantity NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(work_order_id, equipment_id),
  CONSTRAINT work_order_equipment_rate_positive CHECK (rate >= 0)
);

-- Work Order Time Adjustments
CREATE TABLE public.work_order_time_adjustments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_order_id UUID NOT NULL,
  user_id UUID NOT NULL,
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('extra_time', 'deviation')),
  reason TEXT NOT NULL,
  extra_minutes INTEGER DEFAULT 0,
  extra_cost NUMERIC DEFAULT 0,
  hourly_rate NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adjustment Attachments
CREATE TABLE public.adjustment_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  adjustment_id UUID NOT NULL REFERENCES public.work_order_time_adjustments(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Customer Pricing Agreements
CREATE TABLE public.customer_pricing_agreements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  agreement_type TEXT NOT NULL,
  resource_id UUID,
  resource_type TEXT,
  custom_rate NUMERIC NOT NULL,
  pricing_type TEXT NOT NULL DEFAULT 'hourly',
  valid_from DATE DEFAULT CURRENT_DATE,
  valid_until DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Invoices
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  internal_notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT invoices_subtotal_nonnegative CHECK (subtotal >= 0),
  CONSTRAINT invoices_tax_amount_nonnegative CHECK (tax_amount >= 0),
  CONSTRAINT invoices_total_amount_nonnegative CHECK (total_amount >= 0),
  CONSTRAINT invoices_due_date_after_issue CHECK (due_date >= issue_date)
);

-- Invoice Line Items
CREATE TABLE public.invoice_line_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  work_order_id UUID REFERENCES public.work_orders(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  line_total NUMERIC NOT NULL,
  item_type TEXT NOT NULL DEFAULT 'service' CHECK (item_type IN ('service', 'material', 'equipment', 'extra_time', 'adjustment')),
  reference_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Audit Logs
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Work Order Audit Log
CREATE TABLE public.work_order_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  performed_by UUID NOT NULL,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Invitations
CREATE TABLE public.user_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  organization_id UUID REFERENCES public.organizations(id),
  site_id UUID REFERENCES public.sites(id),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  invitation_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- 4. ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_site_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_breaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_time_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adjustment_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_pricing_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- 5. SECURITY FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role::text FROM public.user_roles WHERE user_id = auth.uid() ORDER BY 
      CASE role
        WHEN 'system_admin' THEN 1
        WHEN 'site_manager' THEN 2
        WHEN 'field_worker' THEN 3
      END
      LIMIT 1
    ),
    'field_worker'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    public.has_role(auth.uid(), 'system_admin'::app_role) OR
    public.has_role(auth.uid(), 'site_manager'::app_role),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.is_system_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.has_role(auth.uid(), 'system_admin'::app_role), false);
$$;

CREATE OR REPLACE FUNCTION public.is_site_manager()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.has_role(auth.uid(), 'site_manager'::app_role), false);
$$;

CREATE OR REPLACE FUNCTION public.is_field_worker()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.has_role(auth.uid(), 'field_worker'::app_role), false);
$$;

-- Site access functions
CREATE OR REPLACE FUNCTION public.user_has_site_access(target_site_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN public.is_system_admin() THEN true
    WHEN EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = auth.uid() AND p.site_id = target_site_id
    ) THEN true
    WHEN EXISTS (
      SELECT 1 FROM public.user_site_access usa 
      WHERE usa.user_id = auth.uid() AND usa.site_id = target_site_id
    ) THEN true
    ELSE false
  END;
$$;

CREATE OR REPLACE FUNCTION public.user_has_site_access(user_uuid uuid, target_site_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = user_uuid AND p.site_id = target_site_id
  ) OR EXISTS (
    SELECT 1 FROM public.user_site_access usa 
    WHERE usa.user_id = user_uuid AND usa.site_id = target_site_id
  ) OR public.get_current_user_role() = 'system_admin';
$$;

CREATE OR REPLACE FUNCTION public.user_has_org_access(target_org_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN public.is_system_admin() THEN true
    WHEN EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = auth.uid() AND p.organization_id = target_org_id
    ) THEN true
    ELSE false
  END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_accessible_sites(user_uuid uuid DEFAULT auth.uid())
RETURNS TABLE(site_id uuid, site_name text, organization_name text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT 
    s.id as site_id, s.name as site_name, o.name as organization_name
  FROM public.sites s
  JOIN public.organizations o ON s.organization_id = o.id
  WHERE s.is_active = true AND o.is_active = true
  AND (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = user_uuid AND p.site_id = s.id)
    OR EXISTS (SELECT 1 FROM public.user_site_access usa WHERE usa.user_id = user_uuid AND usa.site_id = s.id)
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = user_uuid AND p.role = 'system_admin' AND p.organization_id = o.id
    )
  )
  ORDER BY s.name;
$$;

CREATE OR REPLACE FUNCTION public.get_user_accessible_site_ids(user_uuid uuid DEFAULT auth.uid())
RETURNS uuid[]
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY(
    SELECT DISTINCT s.id
    FROM public.sites s
    JOIN public.organizations o ON s.organization_id = o.id
    WHERE s.is_active = true AND o.is_active = true
    AND (
      EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = user_uuid AND p.site_id = s.id)
      OR EXISTS (SELECT 1 FROM public.user_site_access usa WHERE usa.user_id = user_uuid AND usa.site_id = s.id)
      OR (
        public.get_current_user_role() = 'system_admin'
        AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = user_uuid AND p.organization_id = o.id)
      )
    )
  );
$$;

-- 6. BUSINESS LOGIC FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email), 'field_worker');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'field_worker'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_work_order_status_on_time_entry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.work_orders 
    SET status = 'in_progress', started_at = COALESCE(started_at, NEW.start_time)
    WHERE id = NEW.work_order_id AND status = 'pending';
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.end_time IS NULL AND NEW.end_time IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.work_order_time_entries 
      WHERE work_order_id = NEW.work_order_id AND end_time IS NULL AND id != NEW.id
    ) THEN
      UPDATE public.work_orders 
      SET status = 'completed', completed_at = NEW.end_time
      WHERE id = NEW.work_order_id AND status = 'in_progress';
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  timestamp_part TEXT;
  random_part TEXT;
BEGIN
  timestamp_part := TO_CHAR(NOW(), 'YYYYMMDDHH24MISS');
  random_part := LPAD(FLOOR(RANDOM() * 999)::TEXT, 3, '0');
  RETURN 'INV-' || timestamp_part || '-' || random_part;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_work_order(order_id uuid)
RETURNS public.work_orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claimed public.work_orders;
BEGIN
  UPDATE public.work_orders wo
  SET assigned_to = auth.uid()
  WHERE wo.id = claim_work_order.order_id AND wo.assigned_to IS NULL
  RETURNING wo.* INTO claimed;
  RETURN claimed;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_work_order(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_work_order(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.soft_delete_work_order(order_id uuid, reason text DEFAULT NULL)
RETURNS public.work_orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  wo public.work_orders;
  has_time_entries boolean;
  actor uuid := auth.uid();
BEGIN
  SELECT * INTO wo FROM public.work_orders WHERE id = order_id;
  IF wo IS NULL THEN RAISE EXCEPTION 'Work order not found'; END IF;
  IF NOT (public.is_admin() OR wo.user_id = actor) THEN RAISE EXCEPTION 'Not allowed to delete this work order'; END IF;
  SELECT EXISTS (SELECT 1 FROM public.work_order_time_entries tie WHERE tie.work_order_id = order_id) INTO has_time_entries;
  IF wo.status <> 'pending' OR has_time_entries THEN RAISE EXCEPTION 'Cannot delete. Order is active or has time entries. Cancel instead.'; END IF;
  UPDATE public.work_orders SET is_deleted = true, deleted_at = now(), deleted_by = actor WHERE id = order_id AND is_deleted = false RETURNING * INTO wo;
  INSERT INTO public.work_order_audit_log (work_order_id, action, details, performed_by) VALUES (order_id, 'soft_delete', jsonb_build_object('reason', reason), actor);
  RETURN wo;
END;
$$;

REVOKE ALL ON FUNCTION public.soft_delete_work_order(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.soft_delete_work_order(uuid, text) TO authenticated;

-- 7. TRIGGERS
-- ============================================================================

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON public.sites FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON public.materials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_personnel_updated_at BEFORE UPDATE ON public.personnel FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON public.equipment FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON public.work_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_work_order_time_entries_updated_at BEFORE UPDATE ON public.work_order_time_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_work_order_breaks_updated_at BEFORE UPDATE ON public.work_order_breaks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_work_order_time_adjustments_updated_at BEFORE UPDATE ON public.work_order_time_adjustments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_customer_pricing_agreements_updated_at BEFORE UPDATE ON public.customer_pricing_agreements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_invitations_updated_at BEFORE UPDATE ON public.user_invitations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_work_order_status_on_time_entry
AFTER INSERT OR UPDATE ON public.work_order_time_entries
FOR EACH ROW EXECUTE FUNCTION public.update_work_order_status_on_time_entry();

-- 8. INDEXES
-- ============================================================================

CREATE INDEX idx_work_orders_assigned_to_status ON public.work_orders (assigned_to, status);
CREATE INDEX idx_work_orders_scheduled_start ON public.work_orders(scheduled_start) WHERE scheduled_start IS NOT NULL;
CREATE INDEX idx_work_order_time_adjustments_work_order_id ON public.work_order_time_adjustments(work_order_id);
CREATE INDEX idx_work_order_time_adjustments_user_id ON public.work_order_time_adjustments(user_id);
CREATE INDEX idx_adjustment_attachments_adjustment_id ON public.adjustment_attachments(adjustment_id);
CREATE INDEX idx_work_order_breaks_time_entry_id ON public.work_order_breaks(time_entry_id);
CREATE INDEX idx_work_order_breaks_start_time ON public.work_order_breaks(start_time);
CREATE INDEX idx_invoice_line_items_invoice_id ON public.invoice_line_items(invoice_id);
CREATE INDEX idx_invoice_line_items_work_order_id ON public.invoice_line_items(work_order_id);
CREATE UNIQUE INDEX idx_invoices_invoice_number_unique ON public.invoices(invoice_number);
CREATE UNIQUE INDEX idx_user_invitations_email_pending ON public.user_invitations (email) WHERE status = 'pending';
CREATE INDEX idx_user_invitations_status ON public.user_invitations (status);
CREATE INDEX idx_user_invitations_expires_at ON public.user_invitations (expires_at);
CREATE INDEX idx_user_invitations_token ON public.user_invitations (invitation_token);

-- 9. RLS POLICIES
-- ============================================================================

-- Profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Roles
CREATE POLICY "System admins can manage roles" ON public.user_roles FOR ALL
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'system_admin'));
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (user_id = auth.uid());

-- Organizations
CREATE POLICY "System admins can manage organizations" ON public.organizations FOR ALL USING (public.get_current_user_role() = 'system_admin');
CREATE POLICY "Users can view their organization" ON public.organizations FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.organization_id = organizations.id));
CREATE POLICY "All authenticated users can view organizations" ON public.organizations FOR SELECT TO authenticated USING (is_active = true);

-- Sites
CREATE POLICY "System admins can manage sites" ON public.sites FOR ALL USING (public.get_current_user_role() = 'system_admin');
CREATE POLICY "Site managers can manage their sites" ON public.sites FOR ALL USING (public.get_current_user_role() = 'site_manager' AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.site_id = sites.id));
CREATE POLICY "Users can view accessible sites" ON public.sites FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND (p.site_id = sites.id OR EXISTS (SELECT 1 FROM public.user_site_access usa WHERE usa.user_id = auth.uid() AND usa.site_id = sites.id))));
CREATE POLICY "All authenticated users can view sites" ON public.sites FOR SELECT TO authenticated USING (is_active = true);

-- User Site Access
CREATE POLICY "System admins can manage site access" ON public.user_site_access FOR ALL USING (public.get_current_user_role() = 'system_admin');
CREATE POLICY "Site managers can manage access to their sites" ON public.user_site_access FOR ALL USING (public.get_current_user_role() = 'site_manager' AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.site_id = user_site_access.site_id));

-- Customers
CREATE POLICY "Users can view customers from accessible sites" ON public.customers FOR SELECT USING (is_admin() OR (site_id = ANY(get_user_accessible_site_ids()) AND site_id IS NOT NULL));
CREATE POLICY "Users can insert customers to their sites" ON public.customers FOR INSERT WITH CHECK (public.user_has_site_access(site_id));
CREATE POLICY "Users can update customers in their sites" ON public.customers FOR UPDATE USING (public.user_has_site_access(site_id));
CREATE POLICY "Users can delete customers from their sites" ON public.customers FOR DELETE USING (public.user_has_site_access(site_id));

-- Materials
CREATE POLICY "Users can view materials from their sites" ON public.materials FOR SELECT USING (public.user_has_site_access(site_id) OR site_id IS NULL);
CREATE POLICY "Users can insert materials to their sites" ON public.materials FOR INSERT WITH CHECK (public.user_has_site_access(site_id));
CREATE POLICY "Users can update materials in their sites" ON public.materials FOR UPDATE USING (public.user_has_site_access(site_id));
CREATE POLICY "Users can delete materials from their sites" ON public.materials FOR DELETE USING (public.user_has_site_access(site_id));

-- Personnel
CREATE POLICY "Only managers can view personnel" ON public.personnel FOR SELECT USING (is_admin() OR is_site_manager());
CREATE POLICY "Admins can insert personnel" ON public.personnel FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update personnel" ON public.personnel FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete personnel" ON public.personnel FOR DELETE USING (is_admin());

-- Equipment
CREATE POLICY "Users can view equipment from their sites" ON public.equipment FOR SELECT USING (public.user_has_site_access(site_id) OR site_id IS NULL);
CREATE POLICY "Users can insert equipment to their sites" ON public.equipment FOR INSERT WITH CHECK (public.user_has_site_access(site_id));
CREATE POLICY "Users can update equipment in their sites" ON public.equipment FOR UPDATE USING (public.user_has_site_access(site_id));
CREATE POLICY "Users can delete equipment from their sites" ON public.equipment FOR DELETE USING (public.user_has_site_access(site_id));

-- Work Orders
CREATE POLICY "Users can view work orders" ON public.work_orders FOR SELECT USING (
  (assigned_to IS NULL AND status = 'pending' AND is_deleted = false) OR (auth.uid() = user_id) OR (auth.uid() = assigned_to) OR is_admin()
);
CREATE POLICY "Users can create work orders" ON public.work_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their assigned work orders" ON public.work_orders FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = assigned_to);
CREATE POLICY "Admins can schedule work orders" ON public.work_orders FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Users can delete their work orders" ON public.work_orders FOR DELETE USING (auth.uid() = user_id);

-- Work Order Attachments
CREATE POLICY "Users can view attachments for their work orders" ON public.work_order_attachments FOR SELECT USING (EXISTS (SELECT 1 FROM public.work_orders WHERE work_orders.id = work_order_attachments.work_order_id AND (work_orders.user_id = auth.uid() OR work_orders.assigned_to = auth.uid())));
CREATE POLICY "Users can insert attachments for their work orders" ON public.work_order_attachments FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.work_orders WHERE work_orders.id = work_order_attachments.work_order_id AND (work_orders.user_id = auth.uid() OR work_orders.assigned_to = auth.uid())));

-- Work Order Time Entries
CREATE POLICY "Users can view their own time entries" ON public.work_order_time_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own time entries" ON public.work_order_time_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own time entries" ON public.work_order_time_entries FOR UPDATE USING (auth.uid() = user_id);

-- Work Order Breaks
CREATE POLICY "Users can view breaks for their time entries" ON public.work_order_breaks FOR SELECT USING (EXISTS (SELECT 1 FROM public.work_order_time_entries wote WHERE wote.id = work_order_breaks.time_entry_id AND wote.user_id = auth.uid()));
CREATE POLICY "Users can create breaks for their time entries" ON public.work_order_breaks FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.work_order_time_entries wote WHERE wote.id = work_order_breaks.time_entry_id AND wote.user_id = auth.uid()));
CREATE POLICY "Users can update breaks for their time entries" ON public.work_order_breaks FOR UPDATE USING (EXISTS (SELECT 1 FROM public.work_order_time_entries wote WHERE wote.id = work_order_breaks.time_entry_id AND wote.user_id = auth.uid()));

-- Work Order Materials
CREATE POLICY "Users can view materials for their work orders" ON public.work_order_materials FOR SELECT USING (EXISTS (SELECT 1 FROM work_orders WHERE work_orders.id = work_order_materials.work_order_id AND (work_orders.user_id = auth.uid() OR work_orders.assigned_to = auth.uid())));
CREATE POLICY "Users can add materials to their work orders" ON public.work_order_materials FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM work_orders WHERE work_orders.id = work_order_materials.work_order_id AND (work_orders.user_id = auth.uid() OR work_orders.assigned_to = auth.uid())) AND auth.uid() = added_by);
CREATE POLICY "Users can delete materials from their work orders" ON public.work_order_materials FOR DELETE USING (EXISTS (SELECT 1 FROM work_orders WHERE work_orders.id = work_order_materials.work_order_id AND (work_orders.user_id = auth.uid() OR work_orders.assigned_to = auth.uid())));

-- Work Order Personnel
CREATE POLICY "Users can manage personnel for work orders in their sites" ON public.work_order_personnel FOR ALL USING (EXISTS (SELECT 1 FROM public.work_orders wo WHERE wo.id = work_order_personnel.work_order_id AND public.user_has_site_access(wo.site_id)));

-- Work Order Equipment
CREATE POLICY "Users can manage equipment for work orders in their sites" ON public.work_order_equipment FOR ALL USING (EXISTS (SELECT 1 FROM public.work_orders wo WHERE wo.id = work_order_equipment.work_order_id AND public.user_has_site_access(wo.site_id)));

-- Work Order Time Adjustments
CREATE POLICY "Users can view adjustments for their work orders" ON public.work_order_time_adjustments FOR SELECT USING (EXISTS (SELECT 1 FROM work_orders WHERE work_orders.id = work_order_time_adjustments.work_order_id AND (work_orders.user_id = auth.uid() OR work_orders.assigned_to = auth.uid())));
CREATE POLICY "Users can create adjustments for their work orders" ON public.work_order_time_adjustments FOR INSERT WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM work_orders WHERE work_orders.id = work_order_time_adjustments.work_order_id AND (work_orders.user_id = auth.uid() OR work_orders.assigned_to = auth.uid())));
CREATE POLICY "Users can update their own adjustments" ON public.work_order_time_adjustments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own adjustments" ON public.work_order_time_adjustments FOR DELETE USING (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.work_orders wo WHERE wo.id = work_order_time_adjustments.work_order_id AND (wo.user_id = auth.uid() OR wo.assigned_to = auth.uid())));
CREATE POLICY "Admins can delete adjustments" ON public.work_order_time_adjustments FOR DELETE USING (is_admin());

-- Adjustment Attachments
CREATE POLICY "Users can view attachments for their adjustments" ON public.adjustment_attachments FOR SELECT USING (EXISTS (SELECT 1 FROM work_order_time_adjustments wota JOIN work_orders wo ON wo.id = wota.work_order_id WHERE wota.id = adjustment_attachments.adjustment_id AND (wo.user_id = auth.uid() OR wo.assigned_to = auth.uid())));
CREATE POLICY "Users can create attachments for their adjustments" ON public.adjustment_attachments FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM work_order_time_adjustments wota JOIN work_orders wo ON wo.id = wota.work_order_id WHERE wota.id = adjustment_attachments.adjustment_id AND (wo.user_id = auth.uid() OR wo.assigned_to = auth.uid())));
CREATE POLICY "Users can delete attachments they can access" ON public.adjustment_attachments FOR DELETE USING (EXISTS (SELECT 1 FROM work_order_time_adjustments a JOIN work_orders wo ON wo.id = a.work_order_id WHERE a.id = adjustment_attachments.adjustment_id AND (wo.user_id = auth.uid() OR wo.assigned_to = auth.uid() OR is_admin())));

-- Customer Pricing Agreements
CREATE POLICY "Users can manage customer agreements for their sites" ON public.customer_pricing_agreements FOR ALL USING (EXISTS (SELECT 1 FROM public.customers c WHERE c.id = customer_pricing_agreements.customer_id AND public.user_has_site_access(c.site_id)));

-- Invoices
CREATE POLICY "Admins can manage all invoices" ON public.invoices FOR ALL USING (is_admin());
CREATE POLICY "Users can view invoices for their work orders" ON public.invoices FOR SELECT USING (EXISTS (SELECT 1 FROM work_orders wo WHERE wo.customer_id = invoices.customer_id AND (wo.user_id = auth.uid() OR wo.assigned_to = auth.uid())));
CREATE POLICY "Users can create invoices for accessible customers" ON public.invoices FOR INSERT WITH CHECK (created_by = auth.uid() AND EXISTS (SELECT 1 FROM public.work_orders wo WHERE wo.customer_id = invoices.customer_id AND (wo.user_id = auth.uid() OR wo.assigned_to = auth.uid())));
CREATE POLICY "Users can update their invoices" ON public.invoices FOR UPDATE USING (created_by = auth.uid() OR is_admin());

-- Invoice Line Items
CREATE POLICY "Admins can manage all invoice line items" ON public.invoice_line_items FOR ALL USING (is_admin());
CREATE POLICY "Users can view line items for accessible invoices" ON public.invoice_line_items FOR SELECT USING (EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_line_items.invoice_id AND (is_admin() OR EXISTS (SELECT 1 FROM work_orders wo WHERE wo.customer_id = i.customer_id AND (wo.user_id = auth.uid() OR wo.assigned_to = auth.uid())))));
CREATE POLICY "Users can insert line items for accessible invoices" ON public.invoice_line_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_line_items.invoice_id AND (is_admin() OR EXISTS (SELECT 1 FROM public.work_orders wo WHERE wo.customer_id = i.customer_id AND (wo.user_id = auth.uid() OR wo.assigned_to = auth.uid())))));

-- Audit Logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can view work order audit" ON public.work_order_audit_log FOR SELECT USING (public.is_admin());

-- User Invitations
CREATE POLICY "System admins can manage all invitations" ON public.user_invitations FOR ALL USING (get_current_user_role() = 'system_admin');
CREATE POLICY "Site managers can manage invitations for their sites" ON public.user_invitations FOR ALL USING (get_current_user_role() = 'site_manager' AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.site_id = user_invitations.site_id));

-- 10. STORAGE BUCKETS
-- ============================================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('work-order-attachments', 'work-order-attachments', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;

-- Storage Policies
CREATE POLICY "Users can view work order attachments" ON storage.objects FOR SELECT USING (
  bucket_id = 'work-order-attachments' AND EXISTS (
    SELECT 1 FROM public.work_orders WHERE work_orders.id::text = (storage.foldername(name))[1] AND (work_orders.user_id = auth.uid() OR work_orders.assigned_to = auth.uid() OR public.is_admin())
  )
);
CREATE POLICY "Users can upload work order attachments" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'work-order-attachments' AND EXISTS (
    SELECT 1 FROM public.work_orders WHERE work_orders.id::text = (storage.foldername(name))[1] AND (work_orders.user_id = auth.uid() OR work_orders.assigned_to = auth.uid())
  )
);
CREATE POLICY "Users can delete work order attachments" ON storage.objects FOR DELETE USING (
  bucket_id = 'work-order-attachments' AND EXISTS (
    SELECT 1 FROM public.work_orders WHERE work_orders.id::text = (storage.foldername(name))[1] AND (work_orders.user_id = auth.uid() OR work_orders.assigned_to = auth.uid())
  )
);
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 11. VIEWS
-- ============================================================================

CREATE VIEW public.site_work_order_stats AS
SELECT 
  s.id as site_id, s.name as site_name, o.name as organization_name,
  COUNT(wo.id) as total_orders,
  COUNT(CASE WHEN wo.status = 'pending' THEN 1 END) as pending_orders,
  COUNT(CASE WHEN wo.status = 'in_progress' THEN 1 END) as in_progress_orders,
  COUNT(CASE WHEN wo.status = 'completed' THEN 1 END) as completed_orders,
  COUNT(CASE WHEN wo.status = 'cancelled' THEN 1 END) as cancelled_orders,
  COUNT(CASE WHEN wo.status = 'completed' AND DATE(wo.completed_at) = CURRENT_DATE THEN 1 END) as completed_today,
  AVG(wo.estimated_hours) as avg_estimated_hours,
  AVG(wo.actual_hours) as avg_actual_hours
FROM public.sites s
LEFT JOIN public.organizations o ON s.organization_id = o.id
LEFT JOIN public.work_orders wo ON wo.site_id = s.id AND wo.is_deleted = false
WHERE s.is_active = true
GROUP BY s.id, s.name, o.name;

CREATE VIEW public.site_revenue_stats AS
SELECT 
  s.id as site_id, s.name as site_name, o.name as organization_name,
  COUNT(wo.id) as total_projects,
  COALESCE(SUM(CASE WHEN wo.status = 'completed' THEN COALESCE(wo.price_value, 0) ELSE 0 END), 0) as completed_revenue,
  COALESCE(SUM(COALESCE(wo.price_value, 0)), 0) as total_revenue,
  CASE WHEN COUNT(wo.id) > 0 THEN COALESCE(AVG(COALESCE(wo.price_value, 0)), 0) ELSE 0 END as avg_project_value
FROM public.sites s
LEFT JOIN public.organizations o ON s.organization_id = o.id
LEFT JOIN public.work_orders wo ON wo.site_id = s.id AND wo.is_deleted = false
WHERE s.is_active = true
GROUP BY s.id, s.name, o.name;

CREATE VIEW public.site_productivity_stats AS
SELECT 
  s.id as site_id, s.name as site_name, o.name as organization_name,
  COUNT(DISTINCT p.user_id) as active_workers,
  COALESCE(SUM(CASE WHEN wote.end_time IS NOT NULL THEN EXTRACT(EPOCH FROM (wote.end_time - wote.start_time)) / 3600.0 ELSE 0 END), 0) as total_hours_worked,
  CASE WHEN COUNT(wo.id) > 0 THEN ROUND((COUNT(CASE WHEN wo.status = 'completed' THEN 1 END)::numeric / COUNT(wo.id)::numeric) * 100, 2) ELSE 0 END as avg_efficiency_percentage
FROM public.sites s
LEFT JOIN public.organizations o ON s.organization_id = o.id
LEFT JOIN public.profiles p ON p.site_id = s.id
LEFT JOIN public.work_orders wo ON wo.site_id = s.id AND wo.is_deleted = false
LEFT JOIN public.work_order_time_entries wote ON wote.work_order_id = wo.id
WHERE s.is_active = true
GROUP BY s.id, s.name, o.name;

ALTER VIEW public.site_productivity_stats SET (security_invoker = on);
ALTER VIEW public.site_revenue_stats SET (security_invoker = on);
ALTER VIEW public.site_work_order_stats SET (security_invoker = on);

-- Org views
CREATE VIEW public.org_customers AS
SELECT c.*, s.name as site_name, o.name as organization_name
FROM public.customers c
JOIN public.sites s ON c.site_id = s.id
JOIN public.organizations o ON s.organization_id = o.id
WHERE public.user_has_org_access(o.id);

CREATE VIEW public.org_materials AS
SELECT m.*, s.name as site_name, o.name as organization_name
FROM public.materials m
JOIN public.sites s ON m.site_id = s.id
JOIN public.organizations o ON s.organization_id = o.id
WHERE public.user_has_org_access(o.id);

CREATE VIEW public.org_equipment AS
SELECT e.*, s.name as site_name, o.name as organization_name
FROM public.equipment e
JOIN public.sites s ON e.site_id = s.id
JOIN public.organizations o ON s.organization_id = o.id
WHERE public.user_has_org_access(o.id);

CREATE VIEW public.org_personnel AS
SELECT p.*, s.name as site_name, o.name as organization_name
FROM public.personnel p
JOIN public.sites s ON p.site_id = s.id
JOIN public.organizations o ON s.organization_id = o.id
WHERE public.user_has_org_access(o.id);

CREATE VIEW public.org_work_orders AS
SELECT wo.*, c.name as customer_name, s.name as site_name, o.name as organization_name
FROM public.work_orders wo
JOIN public.customers c ON wo.customer_id = c.id
JOIN public.sites s ON wo.site_id = s.id
JOIN public.organizations o ON s.organization_id = o.id
WHERE public.user_has_org_access(o.id);

GRANT SELECT ON public.org_customers TO authenticated;
GRANT SELECT ON public.org_materials TO authenticated;
GRANT SELECT ON public.org_equipment TO authenticated;
GRANT SELECT ON public.org_personnel TO authenticated;
GRANT SELECT ON public.org_work_orders TO authenticated;

-- 12. REALTIME
-- ============================================================================

ALTER TABLE public.work_orders REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.work_orders;

ALTER TABLE public.work_order_breaks REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.work_order_breaks;
