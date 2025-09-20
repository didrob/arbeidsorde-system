-- Create table for work order time adjustments (extra time and deviations)
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

-- Create table for adjustment attachments
CREATE TABLE public.adjustment_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  adjustment_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.work_order_time_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adjustment_attachments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for work_order_time_adjustments
CREATE POLICY "Users can view adjustments for their work orders" 
ON public.work_order_time_adjustments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM work_orders 
    WHERE work_orders.id = work_order_time_adjustments.work_order_id 
    AND (work_orders.user_id = auth.uid() OR work_orders.assigned_to = auth.uid())
  )
);

CREATE POLICY "Users can create adjustments for their work orders" 
ON public.work_order_time_adjustments 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM work_orders 
    WHERE work_orders.id = work_order_time_adjustments.work_order_id 
    AND (work_orders.user_id = auth.uid() OR work_orders.assigned_to = auth.uid())
  )
);

CREATE POLICY "Users can update their own adjustments" 
ON public.work_order_time_adjustments 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for adjustment_attachments
CREATE POLICY "Users can view attachments for their adjustments" 
ON public.adjustment_attachments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM work_order_time_adjustments wota
    JOIN work_orders wo ON wo.id = wota.work_order_id
    WHERE wota.id = adjustment_attachments.adjustment_id 
    AND (wo.user_id = auth.uid() OR wo.assigned_to = auth.uid())
  )
);

CREATE POLICY "Users can create attachments for their adjustments" 
ON public.adjustment_attachments 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM work_order_time_adjustments wota
    JOIN work_orders wo ON wo.id = wota.work_order_id
    WHERE wota.id = adjustment_attachments.adjustment_id 
    AND (wo.user_id = auth.uid() OR wo.assigned_to = auth.uid())
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_work_order_time_adjustments_updated_at
  BEFORE UPDATE ON public.work_order_time_adjustments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_work_order_time_adjustments_work_order_id ON public.work_order_time_adjustments(work_order_id);
CREATE INDEX idx_work_order_time_adjustments_user_id ON public.work_order_time_adjustments(user_id);
CREATE INDEX idx_adjustment_attachments_adjustment_id ON public.adjustment_attachments(adjustment_id);