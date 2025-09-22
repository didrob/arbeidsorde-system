-- Create customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create materials table
CREATE TABLE public.materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2),
  unit TEXT NOT NULL DEFAULT 'stk',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create work orders table
CREATE TABLE public.work_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  pricing_type TEXT NOT NULL DEFAULT 'hourly' CHECK (pricing_type IN ('hourly', 'fixed', 'per_trip', 'per_ton', 'ad_hoc')),
  price_value DECIMAL(10,2),
  estimated_hours DECIMAL(4,2),
  actual_hours DECIMAL(4,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create work order attachments table
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

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'field_worker' CHECK (role IN ('admin', 'field_worker')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for customers
CREATE POLICY "Authenticated users can view customers" 
ON public.customers FOR SELECT 
TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert customers" 
ON public.customers FOR INSERT 
TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update customers" 
ON public.customers FOR UPDATE 
TO authenticated USING (true);

-- Create RLS policies for materials
CREATE POLICY "Authenticated users can view materials" 
ON public.materials FOR SELECT 
TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert materials" 
ON public.materials FOR INSERT 
TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update materials" 
ON public.materials FOR UPDATE 
TO authenticated USING (true);

-- Create RLS policies for work orders
CREATE POLICY "Users can view their work orders" 
ON public.work_orders FOR SELECT 
TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create work orders" 
ON public.work_orders FOR INSERT 
TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their work orders" 
ON public.work_orders FOR UPDATE 
TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their work orders" 
ON public.work_orders FOR DELETE 
TO authenticated USING (auth.uid() = user_id);

-- Create RLS policies for attachments
CREATE POLICY "Users can view attachments for their work orders" 
ON public.work_order_attachments FOR SELECT 
TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.work_orders 
    WHERE work_orders.id = work_order_attachments.work_order_id 
    AND work_orders.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert attachments for their work orders" 
ON public.work_order_attachments FOR INSERT 
TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.work_orders 
    WHERE work_orders.id = work_order_attachments.work_order_id 
    AND work_orders.user_id = auth.uid()
  )
);

-- Create RLS policies for profiles
CREATE POLICY "Users can view all profiles" 
ON public.profiles FOR SELECT 
TO authenticated USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
TO authenticated USING (auth.uid() = user_id);

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('work-order-attachments', 'work-order-attachments', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Create storage policies for work order attachments
CREATE POLICY "Users can view their work order attachments" 
ON storage.objects FOR SELECT 
TO authenticated USING (
  bucket_id = 'work-order-attachments' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their work order attachments" 
ON storage.objects FOR INSERT 
TO authenticated WITH CHECK (
  bucket_id = 'work-order-attachments' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects FOR INSERT 
TO authenticated WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_materials_updated_at
BEFORE UPDATE ON public.materials
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_work_orders_updated_at
BEFORE UPDATE ON public.work_orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    'field_worker'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();