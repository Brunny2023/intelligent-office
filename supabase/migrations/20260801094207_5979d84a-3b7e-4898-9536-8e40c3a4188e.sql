-- ============ Investor Portal ============

CREATE TABLE public.investor_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  firm text,
  title text,
  linkedin_url text,
  investment_focus text,
  ticket_size text,
  message text,
  status text NOT NULL DEFAULT 'pending',
  nda_accepted_at timestamptz,
  nda_signature text,
  approved_at timestamptz,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  access_expires_at timestamptz,
  last_seen_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT investor_status_valid CHECK (status IN ('pending','approved','declined','revoked'))
);

GRANT SELECT, INSERT, UPDATE ON public.investor_profiles TO authenticated;
GRANT INSERT ON public.investor_profiles TO anon;
GRANT ALL ON public.investor_profiles TO service_role;
ALTER TABLE public.investor_profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_approved_investor(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.investor_profiles
    WHERE user_id = _user_id
      AND status = 'approved'
      AND (access_expires_at IS NULL OR access_expires_at > now())
  )
$$;

CREATE OR REPLACE FUNCTION public.current_investor_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.investor_profiles WHERE user_id = auth.uid() LIMIT 1
$$;

CREATE POLICY "Anyone can request investor access"
  ON public.investor_profiles FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'pending');

CREATE POLICY "Investors read own record"
  ON public.investor_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_platform_admin(auth.uid()));

CREATE POLICY "Investors update own record"
  ON public.investor_profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "Platform admins manage investors"
  ON public.investor_profiles FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- ---------- documents ----------
CREATE TABLE public.data_room_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  title text NOT NULL,
  description text,
  storage_path text,
  external_url text,
  sensitivity text NOT NULL DEFAULT 'confidential',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dr_category_valid CHECK (category IN ('corporate','financial','product','commercial','legal','fundraising'))
);

GRANT SELECT ON public.data_room_documents TO authenticated;
GRANT ALL ON public.data_room_documents TO service_role;
ALTER TABLE public.data_room_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved investors read documents"
  ON public.data_room_documents FOR SELECT TO authenticated
  USING (is_active AND (public.is_approved_investor(auth.uid()) OR public.is_platform_admin(auth.uid())));

CREATE POLICY "Platform admins manage documents"
  ON public.data_room_documents FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- ---------- access log ----------
CREATE TABLE public.data_room_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id uuid NOT NULL REFERENCES public.investor_profiles(id) ON DELETE CASCADE,
  document_id uuid REFERENCES public.data_room_documents(id) ON DELETE SET NULL,
  action text NOT NULL DEFAULT 'view',
  duration_seconds integer,
  ip_hint text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.data_room_access_log TO authenticated;
GRANT ALL ON public.data_room_access_log TO service_role;
ALTER TABLE public.data_room_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Investors log own access"
  ON public.data_room_access_log FOR INSERT TO authenticated
  WITH CHECK (investor_id = public.current_investor_id() AND public.is_approved_investor(auth.uid()));

CREATE POLICY "Investors read own access log"
  ON public.data_room_access_log FOR SELECT TO authenticated
  USING (investor_id = public.current_investor_id() OR public.is_platform_admin(auth.uid()));

-- ---------- due diligence checklist ----------
CREATE TABLE public.investor_dd_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id uuid NOT NULL REFERENCES public.investor_profiles(id) ON DELETE CASCADE,
  step_key text NOT NULL,
  label text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  sort_order integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (investor_id, step_key),
  CONSTRAINT dd_status_valid CHECK (status IN ('pending','in_progress','complete'))
);

GRANT SELECT ON public.investor_dd_steps TO authenticated;
GRANT ALL ON public.investor_dd_steps TO service_role;
ALTER TABLE public.investor_dd_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Investors read own checklist"
  ON public.investor_dd_steps FOR SELECT TO authenticated
  USING (investor_id = public.current_investor_id() OR public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins manage checklist"
  ON public.investor_dd_steps FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- ---------- secure messages ----------
CREATE TABLE public.investor_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id uuid NOT NULL REFERENCES public.investor_profiles(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  from_company boolean NOT NULL DEFAULT false,
  kind text NOT NULL DEFAULT 'message',
  body text NOT NULL,
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT im_kind_valid CHECK (kind IN ('message','document_request','question'))
);

GRANT SELECT, INSERT ON public.investor_messages TO authenticated;
GRANT ALL ON public.investor_messages TO service_role;
ALTER TABLE public.investor_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Investors read own thread"
  ON public.investor_messages FOR SELECT TO authenticated
  USING (investor_id = public.current_investor_id() OR public.is_platform_admin(auth.uid()));

CREATE POLICY "Investors write own thread"
  ON public.investor_messages FOR INSERT TO authenticated
  WITH CHECK (
    (investor_id = public.current_investor_id() AND from_company = false AND sender_id = auth.uid())
    OR public.is_platform_admin(auth.uid())
  );

CREATE POLICY "Platform admins manage thread"
  ON public.investor_messages FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- ---------- timestamps ----------
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_investor_profiles_touch BEFORE UPDATE ON public.investor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_data_room_documents_touch BEFORE UPDATE ON public.data_room_documents
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_investor_dd_steps_touch BEFORE UPDATE ON public.investor_dd_steps
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---------- seed default DD checklist on approval ----------
CREATE OR REPLACE FUNCTION public.seed_investor_dd_steps()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _steps jsonb := '[
    {"k":"nda","l":"NDA signed"},
    {"k":"deck","l":"Pitch deck viewed"},
    {"k":"demo","l":"Product demo completed"},
    {"k":"team","l":"Team meeting held"},
    {"k":"model","l":"Financial model reviewed"},
    {"k":"dataroom","l":"Data room accessed"},
    {"k":"questions","l":"Follow-up questions answered"},
    {"k":"ic","l":"Investment committee review"},
    {"k":"termsheet","l":"Term sheet discussion"}
  ]'::jsonb;
  _s jsonb; _i int := 0;
BEGIN
  IF NEW.status = 'approved' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'approved') THEN
    FOR _s IN SELECT * FROM jsonb_array_elements(_steps) LOOP
      INSERT INTO public.investor_dd_steps (investor_id, step_key, label, sort_order, status, completed_at)
      VALUES (NEW.id, _s->>'k', _s->>'l', _i,
        CASE WHEN _s->>'k' = 'nda' AND NEW.nda_accepted_at IS NOT NULL THEN 'complete' ELSE 'pending' END,
        CASE WHEN _s->>'k' = 'nda' THEN NEW.nda_accepted_at ELSE NULL END)
      ON CONFLICT (investor_id, step_key) DO NOTHING;
      _i := _i + 1;
    END LOOP;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_seed_investor_dd AFTER INSERT OR UPDATE OF status ON public.investor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.seed_investor_dd_steps();

-- ---------- public verified metrics ----------
CREATE OR REPLACE FUNCTION public.get_investor_metrics()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'organizations', (SELECT count(*) FROM public.organizations),
    'users', (SELECT count(*) FROM public.profiles),
    'active_users_30d', (SELECT count(DISTINCT user_id) FROM public.activity_logs WHERE created_at > now() - interval '30 days'),
    'ai_agents', (SELECT count(*) FROM public.ai_executives) + (SELECT count(*) FROM public.ai_consultants),
    'documents', (SELECT count(*) FROM public.documents),
    'tasks_completed', (SELECT count(*) FROM public.tasks WHERE status = 'completed'),
    'tasks_total', (SELECT count(*) FROM public.tasks),
    'deliberations', (SELECT count(*) FROM public.cognition_requests),
    'workflow_runs', (SELECT count(*) FROM public.workflow_instances),
    'memory_entries', (SELECT count(*) FROM public.organizational_memory),
    'meetings', (SELECT count(*) FROM public.meeting_rooms),
    'security_incidents', (SELECT count(*) FROM public.status_incidents WHERE created_at > now() - interval '365 days'),
    'countries_served', 1,
    'generated_at', now()
  )
$$;

GRANT EXECUTE ON FUNCTION public.get_investor_metrics() TO anon, authenticated;