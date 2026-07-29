
-- 1. AI Executives
CREATE TABLE public.ai_executives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role text NOT NULL,
  title text NOT NULL,
  mandate text,
  tone text,
  focus_kpis text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, role)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_executives TO authenticated;
GRANT ALL ON public.ai_executives TO service_role;
ALTER TABLE public.ai_executives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_executives_org_read" ON public.ai_executives FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()));
CREATE POLICY "ai_executives_org_write" ON public.ai_executives FOR ALL TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()) AND (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'executive')))
  WITH CHECK (organization_id = public.get_user_org_id(auth.uid()) AND (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'executive')));

-- 2. AI Consultants
CREATE TABLE public.ai_consultants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  domain text NOT NULL,
  title text NOT NULL,
  expertise text,
  playbook text,
  reporting_executive_id uuid REFERENCES public.ai_executives(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, domain)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_consultants TO authenticated;
GRANT ALL ON public.ai_consultants TO service_role;
ALTER TABLE public.ai_consultants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_consultants_org_read" ON public.ai_consultants FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()));
CREATE POLICY "ai_consultants_org_write" ON public.ai_consultants FOR ALL TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()) AND (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'executive') OR public.has_role(auth.uid(),'manager')))
  WITH CHECK (organization_id = public.get_user_org_id(auth.uid()) AND (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'executive') OR public.has_role(auth.uid(),'manager')));

-- 3. AI Departments
CREATE TABLE public.ai_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  charter text,
  consultant_id uuid REFERENCES public.ai_consultants(id) ON DELETE SET NULL,
  staffing jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_departments TO authenticated;
GRANT ALL ON public.ai_departments TO service_role;
ALTER TABLE public.ai_departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_departments_org_read" ON public.ai_departments FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()));
CREATE POLICY "ai_departments_org_write" ON public.ai_departments FOR ALL TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()) AND (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'executive') OR public.has_role(auth.uid(),'manager')))
  WITH CHECK (organization_id = public.get_user_org_id(auth.uid()) AND (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'executive') OR public.has_role(auth.uid(),'manager')));

-- 4. Cognition Requests
CREATE TABLE public.cognition_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request text NOT NULL,
  target_department_id uuid REFERENCES public.ai_departments(id) ON DELETE SET NULL,
  intent text,
  status text NOT NULL DEFAULT 'pending',
  outcome jsonb,
  latency_ms integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cognition_requests TO authenticated;
GRANT ALL ON public.cognition_requests TO service_role;
ALTER TABLE public.cognition_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cognition_requests_org_read" ON public.cognition_requests FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()));
CREATE POLICY "cognition_requests_own_insert" ON public.cognition_requests FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id(auth.uid()) AND requested_by = auth.uid());

-- 5. Cognition Steps
CREATE TABLE public.cognition_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.cognition_requests(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  stage text NOT NULL,
  actor_type text,
  actor_label text,
  reasoning text,
  output jsonb,
  step_order integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.cognition_steps TO authenticated;
GRANT ALL ON public.cognition_steps TO service_role;
ALTER TABLE public.cognition_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cognition_steps_org_read" ON public.cognition_steps FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()));

-- 6. Organizational Memory
CREATE TABLE public.organizational_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  memory_type text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  source_request_id uuid REFERENCES public.cognition_requests(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizational_memory TO authenticated;
GRANT ALL ON public.organizational_memory TO service_role;
ALTER TABLE public.organizational_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_memory_org_read" ON public.organizational_memory FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()));
CREATE POLICY "org_memory_org_write" ON public.organizational_memory FOR ALL TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()))
  WITH CHECK (organization_id = public.get_user_org_id(auth.uid()));

-- Touch triggers for updated_at
CREATE TRIGGER trg_ai_executives_touch BEFORE UPDATE ON public.ai_executives
  FOR EACH ROW EXECUTE FUNCTION public.graph_touch_updated_at();
CREATE TRIGGER trg_ai_consultants_touch BEFORE UPDATE ON public.ai_consultants
  FOR EACH ROW EXECUTE FUNCTION public.graph_touch_updated_at();
CREATE TRIGGER trg_ai_departments_touch BEFORE UPDATE ON public.ai_departments
  FOR EACH ROW EXECUTE FUNCTION public.graph_touch_updated_at();

-- 7. Seed function for an organization
CREATE OR REPLACE FUNCTION public.seed_cognition_defaults(_org uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _exec_map jsonb := '[
    {"role":"ceo","title":"AI Chief Executive Officer","mandate":"Set vision, align strategy, and hold the organization to its highest priorities.","tone":"decisive, principled"},
    {"role":"coo","title":"AI Chief Operating Officer","mandate":"Turn strategy into flawless execution across every function.","tone":"pragmatic, systematic"},
    {"role":"cfo","title":"AI Chief Financial Officer","mandate":"Protect capital, allocate resources, and ensure financial resilience.","tone":"measured, evidence-driven"},
    {"role":"cto","title":"AI Chief Technology Officer","mandate":"Architect scalable, secure technology that compounds our advantage.","tone":"rigorous, forward-looking"},
    {"role":"cio","title":"AI Chief Information Officer","mandate":"Deliver reliable, secure information systems across the enterprise.","tone":"stable, service-minded"},
    {"role":"cdo","title":"AI Chief Data Officer","mandate":"Turn data into governed, decision-ready intelligence.","tone":"analytical, precise"},
    {"role":"cmo","title":"AI Chief Marketing Officer","mandate":"Grow demand, own the narrative, and deepen customer trust.","tone":"bold, customer-obsessed"},
    {"role":"chro","title":"AI Chief Human Resources Officer","mandate":"Build the team, culture, and capability the strategy requires.","tone":"empathetic, standards-driven"},
    {"role":"clo","title":"AI Chief Legal Officer","mandate":"Protect the enterprise legally while enabling velocity.","tone":"careful, plainspoken"},
    {"role":"cro","title":"AI Chief Risk Officer","mandate":"Anticipate, quantify, and mitigate enterprise risk.","tone":"vigilant, calm"},
    {"role":"cso","title":"AI Chief Strategy Officer","mandate":"Identify where to play and how to win, over multi-year horizons.","tone":"long-horizon, contrarian"}
  ]'::jsonb;
  _cons_map jsonb := '[
    {"domain":"data_ai","title":"Data & AI Consultant","expertise":"Data platforms, ML systems, AI product design, governance."},
    {"domain":"software_engineering","title":"Software Engineering Consultant","expertise":"Architecture, delivery, quality, developer productivity."},
    {"domain":"finance","title":"Finance Consultant","expertise":"FP&A, treasury, unit economics, capital planning."},
    {"domain":"human_resources","title":"Human Resources Consultant","expertise":"Talent, org design, comp, performance systems."},
    {"domain":"marketing","title":"Marketing Consultant","expertise":"Positioning, demand gen, brand, lifecycle."},
    {"domain":"legal","title":"Legal Consultant","expertise":"Commercial, IP, privacy, employment, disputes."},
    {"domain":"operations","title":"Operations Consultant","expertise":"Process design, SLAs, capacity, continuous improvement."},
    {"domain":"product_management","title":"Product Management Consultant","expertise":"Discovery, roadmap, PMF, outcome-based delivery."},
    {"domain":"research","title":"Research Consultant","expertise":"Market, user, competitive, and applied research."},
    {"domain":"customer_success","title":"Customer Success Consultant","expertise":"Onboarding, retention, expansion, advocacy."}
  ]'::jsonb;
  _dept_map jsonb := '[
    {"name":"Data & AI Department","domain":"data_ai","charter":"Own data platforms, models, and AI product delivery."},
    {"name":"Software Engineering Department","domain":"software_engineering","charter":"Build and operate our software."},
    {"name":"Finance Department","domain":"finance","charter":"Steward capital and financial operations."},
    {"name":"Marketing Department","domain":"marketing","charter":"Grow pipeline and brand equity."},
    {"name":"HR Department","domain":"human_resources","charter":"Build and support the team."},
    {"name":"Legal Department","domain":"legal","charter":"Protect and enable the enterprise."},
    {"name":"Operations Department","domain":"operations","charter":"Run the business day-to-day."},
    {"name":"Customer Success Department","domain":"customer_success","charter":"Deliver customer outcomes."},
    {"name":"Procurement Department","domain":"operations","charter":"Source vendors and negotiate supply."},
    {"name":"Research Department","domain":"research","charter":"Generate insight that guides strategy."}
  ]'::jsonb;
  _item jsonb;
  _exec_id uuid;
  _cons_id uuid;
BEGIN
  FOR _item IN SELECT * FROM jsonb_array_elements(_exec_map) LOOP
    INSERT INTO public.ai_executives(organization_id, role, title, mandate, tone)
    VALUES (_org, _item->>'role', _item->>'title', _item->>'mandate', _item->>'tone')
    ON CONFLICT (organization_id, role) DO NOTHING;
  END LOOP;

  FOR _item IN SELECT * FROM jsonb_array_elements(_cons_map) LOOP
    SELECT id INTO _exec_id FROM public.ai_executives
      WHERE organization_id = _org
        AND role = CASE _item->>'domain'
          WHEN 'data_ai' THEN 'cdo'
          WHEN 'software_engineering' THEN 'cto'
          WHEN 'finance' THEN 'cfo'
          WHEN 'human_resources' THEN 'chro'
          WHEN 'marketing' THEN 'cmo'
          WHEN 'legal' THEN 'clo'
          WHEN 'operations' THEN 'coo'
          WHEN 'product_management' THEN 'cso'
          WHEN 'research' THEN 'cso'
          WHEN 'customer_success' THEN 'coo'
        END
      LIMIT 1;
    INSERT INTO public.ai_consultants(organization_id, domain, title, expertise, reporting_executive_id)
    VALUES (_org, _item->>'domain', _item->>'title', _item->>'expertise', _exec_id)
    ON CONFLICT (organization_id, domain) DO NOTHING;
  END LOOP;

  FOR _item IN SELECT * FROM jsonb_array_elements(_dept_map) LOOP
    SELECT id INTO _cons_id FROM public.ai_consultants
      WHERE organization_id = _org AND domain = _item->>'domain' LIMIT 1;
    INSERT INTO public.ai_departments(organization_id, name, charter, consultant_id)
    VALUES (_org, _item->>'name', _item->>'charter', _cons_id)
    ON CONFLICT (organization_id, name) DO NOTHING;
  END LOOP;
END;
$$;

-- Backfill for every existing org
DO $$
DECLARE _o record;
BEGIN
  FOR _o IN SELECT id FROM public.organizations LOOP
    PERFORM public.seed_cognition_defaults(_o.id);
  END LOOP;
END $$;

-- Extend complete_onboarding to seed cognition too
CREATE OR REPLACE FUNCTION public.complete_onboarding(_name text, _slug text, _mission text DEFAULT NULL::text, _brand_tagline text DEFAULT NULL::text, _core_values text[] DEFAULT '{}'::text[], _logo_url text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _user_id uuid;
  _org_id uuid;
  _existing_org uuid;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  SELECT organization_id INTO _existing_org FROM public.profiles WHERE id = _user_id;
  IF _existing_org IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'User already belongs to an organization');
  END IF;

  IF EXISTS (SELECT 1 FROM public.organizations WHERE slug = _slug) THEN
    RETURN jsonb_build_object('error', 'This slug is already taken');
  END IF;

  INSERT INTO public.organizations (name, slug, mission, brand_tagline, core_values, logo_url)
  VALUES (_name, _slug, _mission, _brand_tagline, _core_values, _logo_url)
  RETURNING id INTO _org_id;

  UPDATE public.profiles SET organization_id = _org_id WHERE id = _user_id;

  INSERT INTO public.user_roles (user_id, organization_id, role)
  VALUES (_user_id, _org_id, 'owner');

  PERFORM public.seed_cognition_defaults(_org_id);

  RETURN jsonb_build_object('success', true, 'organization_id', _org_id);
END;
$function$;
