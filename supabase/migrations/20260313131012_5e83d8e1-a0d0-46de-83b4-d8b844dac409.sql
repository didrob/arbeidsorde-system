
-- customer_notes
CREATE TABLE public.customer_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage notes for customers on their sites"
  ON public.customer_notes FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.customers c
    WHERE c.id = customer_notes.customer_id
    AND user_has_site_access(c.site_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.customers c
    WHERE c.id = customer_notes.customer_id
    AND user_has_site_access(c.site_id)
  ));

-- customer_attachments
CREATE TABLE public.customer_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id),
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  file_size bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.customer_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage attachments for customers on their sites"
  ON public.customer_attachments FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.customers c
    WHERE c.id = customer_attachments.customer_id
    AND user_has_site_access(c.site_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.customers c
    WHERE c.id = customer_attachments.customer_id
    AND user_has_site_access(c.site_id)
  ));

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('customer-attachments', 'customer-attachments', false);

CREATE POLICY "Authenticated users can upload customer attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'customer-attachments');

CREATE POLICY "Authenticated users can view customer attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'customer-attachments');

CREATE POLICY "Authenticated users can delete customer attachments"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'customer-attachments');
