
-- Create email_log table
CREATE TABLE public.email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid REFERENCES public.work_orders(id) ON DELETE SET NULL,
  email_type text NOT NULL,
  recipient_email text NOT NULL,
  recipient_name text,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  error_message text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);

-- RLS
ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all email logs"
  ON public.email_log FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Users can view email logs for their orders"
  ON public.email_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.work_orders wo
      WHERE wo.id = email_log.work_order_id
      AND (wo.user_id = auth.uid() OR wo.assigned_to = auth.uid())
    )
  );

-- Service role inserts (no INSERT policy needed for regular users)

-- Index for duplicate checking
CREATE INDEX idx_email_log_dedup ON public.email_log (work_order_id, email_type, created_at);

-- Storage bucket for email assets
INSERT INTO storage.buckets (id, name, public) VALUES ('email-assets', 'email-assets', true);

-- Public read access for email assets
CREATE POLICY "Public read access for email assets"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'email-assets');

-- Admin upload for email assets
CREATE POLICY "Admins can upload email assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'email-assets' AND public.is_admin());
