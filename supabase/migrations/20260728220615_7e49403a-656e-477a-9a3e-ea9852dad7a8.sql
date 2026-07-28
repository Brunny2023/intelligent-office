
CREATE TABLE public.meeting_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  room_name TEXT NOT NULL,
  title TEXT,
  host_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.meeting_rooms TO authenticated;
GRANT ALL ON public.meeting_rooms TO service_role;
ALTER TABLE public.meeting_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mr_select_org" ON public.meeting_rooms FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()));
CREATE POLICY "mr_insert_org" ON public.meeting_rooms FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id(auth.uid()) AND host_id = auth.uid());
CREATE POLICY "mr_update_org" ON public.meeting_rooms FOR UPDATE TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid())
    AND (host_id = auth.uid() OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'executive') OR public.has_role(auth.uid(),'manager')));

CREATE TABLE public.meeting_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  room_id UUID REFERENCES public.meeting_rooms(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL,
  storage_path TEXT NOT NULL,
  file_size BIGINT,
  duration_seconds NUMERIC,
  mime_type TEXT,
  status TEXT NOT NULL DEFAULT 'uploaded',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.meeting_recordings TO authenticated;
GRANT ALL ON public.meeting_recordings TO service_role;
ALTER TABLE public.meeting_recordings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mrec_select" ON public.meeting_recordings FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()));
CREATE POLICY "mrec_insert" ON public.meeting_recordings FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id(auth.uid()) AND uploaded_by = auth.uid());
CREATE POLICY "mrec_update" ON public.meeting_recordings FOR UPDATE TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()));

CREATE TABLE public.meeting_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  recording_id UUID NOT NULL REFERENCES public.meeting_recordings(id) ON DELETE CASCADE,
  language TEXT,
  full_text TEXT NOT NULL,
  segments JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.meeting_transcripts TO authenticated;
GRANT ALL ON public.meeting_transcripts TO service_role;
ALTER TABLE public.meeting_transcripts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mt_select" ON public.meeting_transcripts FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()));

CREATE TABLE public.meeting_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  recording_id UUID NOT NULL REFERENCES public.meeting_recordings(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  key_decisions JSONB NOT NULL DEFAULT '[]'::jsonb,
  action_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  sentiment TEXT,
  translated_summary JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.meeting_summaries TO authenticated;
GRANT ALL ON public.meeting_summaries TO service_role;
ALTER TABLE public.meeting_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ms_select" ON public.meeting_summaries FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()));

CREATE TABLE public.meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.meeting_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at TIMESTAMPTZ,
  UNIQUE (room_id, user_id)
);
GRANT SELECT, INSERT, UPDATE ON public.meeting_participants TO authenticated;
GRANT ALL ON public.meeting_participants TO service_role;
ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mp_select" ON public.meeting_participants FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()));
CREATE POLICY "mp_upsert" ON public.meeting_participants FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id(auth.uid()) AND user_id = auth.uid());
CREATE POLICY "mp_update" ON public.meeting_participants FOR UPDATE TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()) AND user_id = auth.uid());

-- Storage RLS: scope recordings by org folder
CREATE POLICY "recordings_read_own_org" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'recordings' AND (storage.foldername(name))[1] = public.get_user_org_id(auth.uid())::text);
CREATE POLICY "recordings_upload_own_org" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'recordings' AND (storage.foldername(name))[1] = public.get_user_org_id(auth.uid())::text);
