-- Create work_order_breaks table for tracking individual pause periods
CREATE TABLE public.work_order_breaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  time_entry_id UUID NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE NULL,
  reason TEXT NOT NULL DEFAULT 'other',
  notes TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.work_order_breaks ENABLE ROW LEVEL SECURITY;

-- Create policies for work_order_breaks
CREATE POLICY "Users can view breaks for their time entries" 
ON public.work_order_breaks 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.work_order_time_entries wote
    WHERE wote.id = work_order_breaks.time_entry_id 
    AND wote.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create breaks for their time entries" 
ON public.work_order_breaks 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.work_order_time_entries wote
    WHERE wote.id = work_order_breaks.time_entry_id 
    AND wote.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update breaks for their time entries" 
ON public.work_order_breaks 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.work_order_time_entries wote
    WHERE wote.id = work_order_breaks.time_entry_id 
    AND wote.user_id = auth.uid()
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_work_order_breaks_updated_at
BEFORE UPDATE ON public.work_order_breaks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better performance
CREATE INDEX idx_work_order_breaks_time_entry_id ON public.work_order_breaks(time_entry_id);
CREATE INDEX idx_work_order_breaks_start_time ON public.work_order_breaks(start_time);

-- Enable realtime for work_order_breaks
ALTER TABLE public.work_order_breaks REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.work_order_breaks;