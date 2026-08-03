ALTER TABLE public.data_room_documents ADD COLUMN IF NOT EXISTS admin_only boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "Approved investors read documents" ON public.data_room_documents;
CREATE POLICY "Approved investors read documents"
ON public.data_room_documents FOR SELECT
USING (
  is_active AND (
    is_platform_admin(auth.uid())
    OR (NOT admin_only AND is_approved_investor(auth.uid()))
  )
);

DROP POLICY IF EXISTS "Approved investors read data room files" ON storage.objects;
CREATE POLICY "Approved investors read data room files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'data-room' AND (
    is_platform_admin(auth.uid())
    OR ((storage.foldername(name))[1] <> 'admin' AND is_approved_investor(auth.uid()))
  )
);