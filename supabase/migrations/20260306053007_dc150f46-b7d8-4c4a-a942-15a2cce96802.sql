
-- Phase 10: Announcements system
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  title text NOT NULL,
  content text NOT NULL,
  priority text NOT NULL DEFAULT 'normal',
  department_id uuid REFERENCES public.departments(id),
  created_by uuid NOT NULL,
  published_at timestamptz,
  is_mandatory boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.announcement_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  read_at timestamptz NOT NULL DEFAULT now(),
  acknowledged boolean NOT NULL DEFAULT false,
  acknowledged_at timestamptz,
  UNIQUE(announcement_id, user_id)
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;

-- Announcements policies
CREATE POLICY "View org announcements" ON public.announcements
  FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "Create announcements" ON public.announcements
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = get_user_org_id(auth.uid())
    AND created_by = auth.uid()
    AND (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'executive') OR has_role(auth.uid(), 'manager'))
  );

CREATE POLICY "Update own announcements" ON public.announcements
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR has_role(auth.uid(), 'owner'));

-- Announcement reads policies
CREATE POLICY "Read own reads" ON public.announcement_reads
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM announcements a WHERE a.id = announcement_reads.announcement_id
    AND a.organization_id = get_user_org_id(auth.uid())
    AND (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'executive') OR has_role(auth.uid(), 'manager'))
  ));

CREATE POLICY "Mark as read" ON public.announcement_reads
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Acknowledge" ON public.announcement_reads
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Phase 11: AI insights cache
CREATE TABLE public.ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  insight_type text NOT NULL DEFAULT 'daily_summary',
  title text NOT NULL,
  content text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  metadata jsonb DEFAULT '{}',
  generated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_by uuid,
  is_read boolean NOT NULL DEFAULT false
);

ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View org insights" ON public.ai_insights
  FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "Create insights" ON public.ai_insights
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "Update insights" ON public.ai_insights
  FOR UPDATE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

-- Storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

CREATE POLICY "Org members can upload documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Org members can view documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documents');

-- Enable realtime for announcements
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
