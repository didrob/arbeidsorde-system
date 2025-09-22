-- Update profiles table to support better role management
ALTER TABLE public.profiles 
ADD COLUMN phone TEXT,
ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Update work_orders table to support field worker assignment
ALTER TABLE public.work_orders 
ADD COLUMN assigned_to UUID REFERENCES public.profiles(user_id),
ADD COLUMN started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN gps_location POINT;

-- Create work_order_time_entries table for time tracking
CREATE TABLE public.work_order_time_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE,
  break_duration INTEGER DEFAULT 0, -- in minutes
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create work_order_materials table for tracking used materials
CREATE TABLE public.work_order_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES public.materials(id),
  quantity NUMERIC NOT NULL,
  unit_price NUMERIC,
  notes TEXT,
  added_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.work_order_time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_materials ENABLE ROW LEVEL SECURITY;

-- RLS policies for work_order_time_entries
CREATE POLICY "Users can view their own time entries"
ON public.work_order_time_entries
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own time entries"
ON public.work_order_time_entries
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own time entries"
ON public.work_order_time_entries
FOR UPDATE
USING (auth.uid() = user_id);

-- RLS policies for work_order_materials
CREATE POLICY "Users can view materials for their work orders"
ON public.work_order_materials
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM work_orders 
  WHERE work_orders.id = work_order_materials.work_order_id 
  AND (work_orders.user_id = auth.uid() OR work_orders.assigned_to = auth.uid())
));

CREATE POLICY "Users can add materials to their work orders"
ON public.work_order_materials
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM work_orders 
  WHERE work_orders.id = work_order_materials.work_order_id 
  AND (work_orders.user_id = auth.uid() OR work_orders.assigned_to = auth.uid())
) AND auth.uid() = added_by);

-- Update work_orders policies to include assigned field workers
DROP POLICY "Users can view their work orders" ON public.work_orders;
CREATE POLICY "Users can view their assigned work orders"
ON public.work_orders
FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = assigned_to);

DROP POLICY "Users can update their work orders" ON public.work_orders;
CREATE POLICY "Users can update their assigned work orders"
ON public.work_orders
FOR UPDATE
USING (auth.uid() = user_id OR auth.uid() = assigned_to);

-- Add triggers for timestamps
CREATE TRIGGER update_work_order_time_entries_updated_at
BEFORE UPDATE ON public.work_order_time_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update work order status when time entry is created/updated
CREATE OR REPLACE FUNCTION public.update_work_order_status_on_time_entry()
RETURNS TRIGGER AS $$
BEGIN
  -- Set work order status to 'in_progress' when first time entry is created
  IF TG_OP = 'INSERT' THEN
    UPDATE public.work_orders 
    SET status = 'in_progress', started_at = COALESCE(started_at, NEW.start_time)
    WHERE id = NEW.work_order_id AND status = 'pending';
  END IF;
  
  -- Set work order status to 'completed' when time entry is ended
  IF TG_OP = 'UPDATE' AND OLD.end_time IS NULL AND NEW.end_time IS NOT NULL THEN
    UPDATE public.work_orders 
    SET status = 'completed', completed_at = NEW.end_time
    WHERE id = NEW.work_order_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_work_order_status_on_time_entry
AFTER INSERT OR UPDATE ON public.work_order_time_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_work_order_status_on_time_entry();