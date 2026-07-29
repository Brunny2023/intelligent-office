-- investor_meetings
CREATE TABLE public.investor_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_name text NOT NULL UNIQUE,
  access_token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  investor_name text NOT NULL,
  investor_email text NOT NULL,
  investor_org text,
  scheduled_at timestamptz,
  host_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'scheduled',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.investor_meetings TO anon, authenticated;
GRANT ALL ON public.investor_meetings TO service_role;
ALTER TABLE public.investor_meetings ENABLE ROW LEVEL SECURITY;

-- Anyone can create a booking request
CREATE POLICY im_insert_public ON public.investor_meetings
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Platform admins see everything
CREATE POLICY im_admin_all ON public.investor_meetings
  FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- Guest read helper: exposed via edge function only. No public select policy
-- to avoid leaking the whole table; edge functions use service_role.

-- investor_analytics
CREATE TABLE public.investor_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid REFERENCES public.investor_meetings(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  visitor_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.investor_analytics TO anon, authenticated;
GRANT SELECT ON public.investor_analytics TO authenticated;
GRANT ALL ON public.investor_analytics TO service_role;
ALTER TABLE public.investor_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY ia_insert_public ON public.investor_analytics
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY ia_select_admin ON public.investor_analytics
  FOR SELECT TO authenticated USING (public.is_platform_admin(auth.uid()));

-- investor_meeting_qa
CREATE TABLE public.investor_meeting_qa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid REFERENCES public.investor_meetings(id) ON DELETE CASCADE,
  room_name text NOT NULL,
  utterance text NOT NULL,
  answer jsonb NOT NULL,
  latency_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.investor_meeting_qa TO authenticated;
GRANT ALL ON public.investor_meeting_qa TO service_role;
ALTER TABLE public.investor_meeting_qa ENABLE ROW LEVEL SECURITY;

CREATE POLICY imq_admin_all ON public.investor_meeting_qa
  FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- updated_at trigger
CREATE TRIGGER trg_im_updated_at
  BEFORE UPDATE ON public.investor_meetings
  FOR EACH ROW EXECUTE FUNCTION public.graph_touch_updated_at();