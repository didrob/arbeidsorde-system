-- Create personnel table
CREATE TABLE public.personnel (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  standard_hourly_rate NUMERIC,
  role TEXT DEFAULT 'worker',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create equipment table
CREATE TABLE public.equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'vehicle', 'tool', 'machinery', etc.
  pricing_type TEXT NOT NULL DEFAULT 'hourly', -- 'hourly', 'daily', 'fixed'
  standard_rate NUMERIC,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create customer pricing agreements table
CREATE TABLE public.customer_pricing_agreements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  agreement_type TEXT NOT NULL, -- 'personnel', 'equipment', 'material', 'general'
  resource_id UUID, -- Can reference personnel, equipment, or material
  resource_type TEXT, -- 'personnel', 'equipment', 'material'
  custom_rate NUMERIC NOT NULL,
  pricing_type TEXT NOT NULL DEFAULT 'hourly', -- 'hourly', 'daily', 'fixed', 'per_unit'
  valid_from DATE DEFAULT CURRENT_DATE,
  valid_until DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create work order personnel table (many-to-many)
CREATE TABLE public.work_order_personnel (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  personnel_id UUID NOT NULL REFERENCES public.personnel(id) ON DELETE CASCADE,
  hourly_rate NUMERIC NOT NULL,
  estimated_hours NUMERIC,
  actual_hours NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(work_order_id, personnel_id)
);

-- Create work order equipment table (many-to-many)
CREATE TABLE public.work_order_equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  pricing_type TEXT NOT NULL DEFAULT 'hourly', -- 'hourly', 'daily', 'fixed'
  rate NUMERIC NOT NULL,
  estimated_quantity NUMERIC, -- hours, days, or units
  actual_quantity NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(work_order_id, equipment_id)
);

-- Update work_orders table to support new pricing model
ALTER TABLE public.work_orders 
ADD COLUMN IF NOT EXISTS pricing_model TEXT DEFAULT 'fixed'; -- 'fixed' or 'resource_based'

-- Enable RLS on new tables
ALTER TABLE public.personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_pricing_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_equipment ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for personnel
CREATE POLICY "Everyone can view personnel" ON public.personnel
FOR SELECT USING (true);

CREATE POLICY "Admins can insert personnel" ON public.personnel
FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update personnel" ON public.personnel
FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete personnel" ON public.personnel
FOR DELETE USING (is_admin());

-- Create RLS policies for equipment
CREATE POLICY "Everyone can view equipment" ON public.equipment
FOR SELECT USING (true);

CREATE POLICY "Admins can insert equipment" ON public.equipment
FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update equipment" ON public.equipment
FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete equipment" ON public.equipment
FOR DELETE USING (is_admin());

-- Create RLS policies for customer pricing agreements
CREATE POLICY "Admins can view all customer agreements" ON public.customer_pricing_agreements
FOR SELECT USING (is_admin());

CREATE POLICY "Admins can insert customer agreements" ON public.customer_pricing_agreements
FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update customer agreements" ON public.customer_pricing_agreements
FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete customer agreements" ON public.customer_pricing_agreements
FOR DELETE USING (is_admin());

-- Create RLS policies for work order personnel
CREATE POLICY "Users can view personnel for their work orders" ON public.work_order_personnel
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM work_orders 
    WHERE work_orders.id = work_order_personnel.work_order_id 
    AND (work_orders.user_id = auth.uid() OR work_orders.assigned_to = auth.uid())
  )
);

CREATE POLICY "Users can add personnel to their work orders" ON public.work_order_personnel
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM work_orders 
    WHERE work_orders.id = work_order_personnel.work_order_id 
    AND (work_orders.user_id = auth.uid() OR work_orders.assigned_to = auth.uid())
  )
);

CREATE POLICY "Users can update personnel for their work orders" ON public.work_order_personnel
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM work_orders 
    WHERE work_orders.id = work_order_personnel.work_order_id 
    AND (work_orders.user_id = auth.uid() OR work_orders.assigned_to = auth.uid())
  )
);

-- Create RLS policies for work order equipment
CREATE POLICY "Users can view equipment for their work orders" ON public.work_order_equipment
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM work_orders 
    WHERE work_orders.id = work_order_equipment.work_order_id 
    AND (work_orders.user_id = auth.uid() OR work_orders.assigned_to = auth.uid())
  )
);

CREATE POLICY "Users can add equipment to their work orders" ON public.work_order_equipment
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM work_orders 
    WHERE work_orders.id = work_order_equipment.work_order_id 
    AND (work_orders.user_id = auth.uid() OR work_orders.assigned_to = auth.uid())
  )
);

CREATE POLICY "Users can update equipment for their work orders" ON public.work_order_equipment
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM work_orders 
    WHERE work_orders.id = work_order_equipment.work_order_id 
    AND (work_orders.user_id = auth.uid() OR work_orders.assigned_to = auth.uid())
  )
);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_personnel_updated_at
BEFORE UPDATE ON public.personnel
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_equipment_updated_at
BEFORE UPDATE ON public.equipment
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_pricing_agreements_updated_at
BEFORE UPDATE ON public.customer_pricing_agreements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();