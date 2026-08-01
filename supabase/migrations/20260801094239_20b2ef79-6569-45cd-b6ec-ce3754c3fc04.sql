CREATE POLICY "Approved investors read data room files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'data-room' AND (public.is_approved_investor(auth.uid()) OR public.is_platform_admin(auth.uid())));

CREATE POLICY "Platform admins write data room files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'data-room' AND public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins update data room files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'data-room' AND public.is_platform_admin(auth.uid()))
  WITH CHECK (bucket_id = 'data-room' AND public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins delete data room files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'data-room' AND public.is_platform_admin(auth.uid()));