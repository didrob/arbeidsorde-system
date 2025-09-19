-- Create storage policies for work-order-attachments bucket
-- Users can view attachments for work orders they have access to
CREATE POLICY "Users can view work order attachments" ON storage.objects
FOR SELECT USING (
  bucket_id = 'work-order-attachments' AND
  EXISTS (
    SELECT 1 FROM public.work_orders 
    WHERE work_orders.id::text = (storage.foldername(name))[1] 
    AND (
      work_orders.user_id = auth.uid() OR 
      work_orders.assigned_to = auth.uid() OR
      public.is_admin()
    )
  )
);

-- Users can upload attachments to work orders they have access to
CREATE POLICY "Users can upload work order attachments" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'work-order-attachments' AND
  EXISTS (
    SELECT 1 FROM public.work_orders 
    WHERE work_orders.id::text = (storage.foldername(name))[1] 
    AND (
      work_orders.user_id = auth.uid() OR 
      work_orders.assigned_to = auth.uid()
    )
  )
);

-- Users can delete their own uploaded attachments
CREATE POLICY "Users can delete work order attachments" ON storage.objects
FOR DELETE USING (
  bucket_id = 'work-order-attachments' AND
  EXISTS (
    SELECT 1 FROM public.work_orders 
    WHERE work_orders.id::text = (storage.foldername(name))[1] 
    AND (
      work_orders.user_id = auth.uid() OR 
      work_orders.assigned_to = auth.uid()
    )
  )
);