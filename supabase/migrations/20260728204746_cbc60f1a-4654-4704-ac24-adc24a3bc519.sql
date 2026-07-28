
-- ============================================================
-- WAVE 1 · KNOWLEDGE GRAPH FOUNDATION
-- ============================================================

-- ---------- graph_entities ----------
CREATE TABLE public.graph_entities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,        -- person | project | task | document | meeting | kpi | customer | channel | message
  source_table TEXT NOT NULL,
  source_id UUID NOT NULL,
  label TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, entity_type, source_id)
);

CREATE INDEX idx_graph_entities_org_type ON public.graph_entities(organization_id, entity_type);
CREATE INDEX idx_graph_entities_source ON public.graph_entities(source_table, source_id);

GRANT SELECT ON public.graph_entities TO authenticated;
GRANT ALL ON public.graph_entities TO service_role;

ALTER TABLE public.graph_entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members view entities"
  ON public.graph_entities FOR SELECT
  TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()));

-- ---------- graph_edges ----------
CREATE TABLE public.graph_edges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  from_entity_id UUID NOT NULL REFERENCES public.graph_entities(id) ON DELETE CASCADE,
  to_entity_id UUID NOT NULL REFERENCES public.graph_entities(id) ON DELETE CASCADE,
  edge_type TEXT NOT NULL,          -- owns | assigned_to | blocks | depends_on | mentions | participates_in | reports_to | belongs_to | references
  weight NUMERIC NOT NULL DEFAULT 1,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, from_entity_id, to_entity_id, edge_type)
);

CREATE INDEX idx_graph_edges_org ON public.graph_edges(organization_id);
CREATE INDEX idx_graph_edges_from ON public.graph_edges(from_entity_id, edge_type);
CREATE INDEX idx_graph_edges_to ON public.graph_edges(to_entity_id, edge_type);

GRANT SELECT ON public.graph_edges TO authenticated;
GRANT ALL ON public.graph_edges TO service_role;

ALTER TABLE public.graph_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members view edges"
  ON public.graph_edges FOR SELECT
  TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()));

-- ---------- graph_events ----------
CREATE TABLE public.graph_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_id UUID REFERENCES public.graph_entities(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,         -- created | updated | status_changed | completed | blocked | joined | left | mentioned | assigned
  actor_id UUID,                    -- auth.users.id, nullable for system events
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_graph_events_org_time ON public.graph_events(organization_id, occurred_at DESC);
CREATE INDEX idx_graph_events_entity ON public.graph_events(entity_id, occurred_at DESC);
CREATE INDEX idx_graph_events_type ON public.graph_events(organization_id, event_type, occurred_at DESC);

GRANT SELECT ON public.graph_events TO authenticated;
GRANT ALL ON public.graph_events TO service_role;

ALTER TABLE public.graph_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members view events"
  ON public.graph_events FOR SELECT
  TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()));

-- ---------- updated_at trigger ----------
CREATE OR REPLACE FUNCTION public.graph_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_graph_entities_updated
  BEFORE UPDATE ON public.graph_entities
  FOR EACH ROW EXECUTE FUNCTION public.graph_touch_updated_at();

-- ============================================================
-- INGESTION HELPERS
-- ============================================================

-- Upsert an entity and return its id
CREATE OR REPLACE FUNCTION public.graph_upsert_entity(
  _org UUID, _type TEXT, _source_table TEXT, _source_id UUID, _label TEXT, _metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id UUID;
BEGIN
  INSERT INTO public.graph_entities(organization_id, entity_type, source_table, source_id, label, metadata)
  VALUES (_org, _type, _source_table, _source_id, _label, COALESCE(_metadata,'{}'::jsonb))
  ON CONFLICT (organization_id, entity_type, source_id)
  DO UPDATE SET label = EXCLUDED.label, metadata = EXCLUDED.metadata, updated_at = now()
  RETURNING id INTO _id;
  RETURN _id;
END;$$;

-- Upsert an edge (idempotent)
CREATE OR REPLACE FUNCTION public.graph_upsert_edge(
  _org UUID, _from UUID, _to UUID, _type TEXT, _weight NUMERIC DEFAULT 1, _metadata JSONB DEFAULT '{}'::jsonb
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _from IS NULL OR _to IS NULL THEN RETURN; END IF;
  INSERT INTO public.graph_edges(organization_id, from_entity_id, to_entity_id, edge_type, weight, metadata)
  VALUES (_org, _from, _to, _type, _weight, COALESCE(_metadata,'{}'::jsonb))
  ON CONFLICT (organization_id, from_entity_id, to_entity_id, edge_type)
  DO UPDATE SET weight = EXCLUDED.weight, metadata = EXCLUDED.metadata;
END;$$;

-- ============================================================
-- TRIGGERS: TASKS
-- ============================================================
CREATE OR REPLACE FUNCTION public.graph_sync_task()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _task_ent UUID;
  _proj_ent UUID;
  _assignee_ent UUID;
  _creator_ent UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.graph_entities WHERE organization_id = OLD.organization_id AND entity_type='task' AND source_id = OLD.id;
    RETURN OLD;
  END IF;

  _task_ent := public.graph_upsert_entity(NEW.organization_id, 'task', 'tasks', NEW.id, NEW.title,
    jsonb_build_object('status', NEW.status, 'priority', NEW.priority, 'due_date', NEW.due_date));

  IF NEW.project_id IS NOT NULL THEN
    _proj_ent := public.graph_upsert_entity(NEW.organization_id, 'project', 'projects', NEW.project_id, NULL, '{}'::jsonb);
    PERFORM public.graph_upsert_edge(NEW.organization_id, _task_ent, _proj_ent, 'belongs_to');
  END IF;

  IF NEW.assigned_to IS NOT NULL THEN
    _assignee_ent := public.graph_upsert_entity(NEW.organization_id, 'person', 'profiles', NEW.assigned_to, NULL, '{}'::jsonb);
    PERFORM public.graph_upsert_edge(NEW.organization_id, _assignee_ent, _task_ent, 'assigned_to');
  END IF;

  IF NEW.created_by IS NOT NULL THEN
    _creator_ent := public.graph_upsert_entity(NEW.organization_id, 'person', 'profiles', NEW.created_by, NULL, '{}'::jsonb);
    PERFORM public.graph_upsert_edge(NEW.organization_id, _creator_ent, _task_ent, 'owns');
  END IF;

  IF NEW.parent_task_id IS NOT NULL THEN
    DECLARE _parent UUID;
    BEGIN
      _parent := public.graph_upsert_entity(NEW.organization_id, 'task', 'tasks', NEW.parent_task_id, NULL, '{}'::jsonb);
      PERFORM public.graph_upsert_edge(NEW.organization_id, _task_ent, _parent, 'depends_on');
    END;
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.graph_events(organization_id, entity_id, event_type, actor_id, payload)
    VALUES (NEW.organization_id, _task_ent, 'created', NEW.created_by, jsonb_build_object('status', NEW.status));
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.graph_events(organization_id, entity_id, event_type, actor_id, payload)
    VALUES (NEW.organization_id, _task_ent, 'status_changed', NEW.assigned_to,
      jsonb_build_object('from', OLD.status, 'to', NEW.status));
  END IF;

  RETURN NEW;
END;$$;

CREATE TRIGGER trg_graph_sync_task
  AFTER INSERT OR UPDATE OR DELETE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.graph_sync_task();

-- ============================================================
-- TRIGGERS: PROJECTS
-- ============================================================
CREATE OR REPLACE FUNCTION public.graph_sync_project()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _proj_ent UUID; _owner_ent UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.graph_entities WHERE organization_id = OLD.organization_id AND entity_type='project' AND source_id = OLD.id;
    RETURN OLD;
  END IF;
  _proj_ent := public.graph_upsert_entity(NEW.organization_id, 'project', 'projects', NEW.id, NEW.name,
    jsonb_build_object('status', NEW.status, 'due_date', NEW.due_date));
  IF NEW.owner_id IS NOT NULL THEN
    _owner_ent := public.graph_upsert_entity(NEW.organization_id, 'person', 'profiles', NEW.owner_id, NULL, '{}'::jsonb);
    PERFORM public.graph_upsert_edge(NEW.organization_id, _owner_ent, _proj_ent, 'owns');
  END IF;
  RETURN NEW;
END;$$;

CREATE TRIGGER trg_graph_sync_project
  AFTER INSERT OR UPDATE OR DELETE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.graph_sync_project();

-- ============================================================
-- TRIGGERS: PROFILES (people)
-- ============================================================
CREATE OR REPLACE FUNCTION public.graph_sync_profile()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.organization_id IS NOT NULL THEN
      DELETE FROM public.graph_entities WHERE organization_id = OLD.organization_id AND entity_type='person' AND source_id = OLD.id;
    END IF;
    RETURN OLD;
  END IF;
  IF NEW.organization_id IS NOT NULL THEN
    PERFORM public.graph_upsert_entity(NEW.organization_id, 'person', 'profiles', NEW.id, NEW.full_name,
      jsonb_build_object('job_title', NEW.job_title, 'department_id', NEW.department_id));
  END IF;
  RETURN NEW;
END;$$;

CREATE TRIGGER trg_graph_sync_profile
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.graph_sync_profile();

-- ============================================================
-- TRIGGERS: DOCUMENTS
-- ============================================================
CREATE OR REPLACE FUNCTION public.graph_sync_document()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _doc UUID; _uploader UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.graph_entities WHERE organization_id = OLD.organization_id AND entity_type='document' AND source_id = OLD.id;
    RETURN OLD;
  END IF;
  _doc := public.graph_upsert_entity(NEW.organization_id, 'document', 'documents', NEW.id, NEW.title,
    jsonb_build_object('category', NEW.category, 'status', NEW.status));
  IF NEW.uploaded_by IS NOT NULL THEN
    _uploader := public.graph_upsert_entity(NEW.organization_id, 'person', 'profiles', NEW.uploaded_by, NULL, '{}'::jsonb);
    PERFORM public.graph_upsert_edge(NEW.organization_id, _uploader, _doc, 'owns');
  END IF;
  RETURN NEW;
END;$$;

CREATE TRIGGER trg_graph_sync_document
  AFTER INSERT OR UPDATE OR DELETE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.graph_sync_document();

-- ============================================================
-- TRIGGERS: MESSAGES (participation edges, no per-message entity to keep graph light)
-- ============================================================
CREATE OR REPLACE FUNCTION public.graph_sync_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _org UUID; _channel UUID; _person UUID;
BEGIN
  SELECT organization_id INTO _org FROM public.channels WHERE id = NEW.channel_id;
  IF _org IS NULL THEN RETURN NEW; END IF;
  _channel := public.graph_upsert_entity(_org, 'channel', 'channels', NEW.channel_id, NULL, '{}'::jsonb);
  _person := public.graph_upsert_entity(_org, 'person', 'profiles', NEW.user_id, NULL, '{}'::jsonb);
  PERFORM public.graph_upsert_edge(_org, _person, _channel, 'participates_in');
  INSERT INTO public.graph_events(organization_id, entity_id, event_type, actor_id, payload)
  VALUES (_org, _channel, 'mentioned', NEW.user_id, jsonb_build_object('message_id', NEW.id));
  RETURN NEW;
END;$$;

CREATE TRIGGER trg_graph_sync_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.graph_sync_message();

-- ============================================================
-- TRIGGERS: KPIs
-- ============================================================
CREATE OR REPLACE FUNCTION public.graph_sync_kpi()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _kpi UUID; _owner UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.graph_entities WHERE organization_id = OLD.organization_id AND entity_type='kpi' AND source_id = OLD.id;
    RETURN OLD;
  END IF;
  _kpi := public.graph_upsert_entity(NEW.organization_id, 'kpi', 'kpis', NEW.id, NEW.title,
    jsonb_build_object('current', NEW.current_value, 'target', NEW.target_value, 'status', NEW.status));
  IF NEW.owner_id IS NOT NULL THEN
    _owner := public.graph_upsert_entity(NEW.organization_id, 'person', 'profiles', NEW.owner_id, NULL, '{}'::jsonb);
    PERFORM public.graph_upsert_edge(NEW.organization_id, _owner, _kpi, 'owns');
  END IF;
  RETURN NEW;
END;$$;

CREATE TRIGGER trg_graph_sync_kpi
  AFTER INSERT OR UPDATE OR DELETE ON public.kpis
  FOR EACH ROW EXECUTE FUNCTION public.graph_sync_kpi();

-- ============================================================
-- BACKFILL EXISTING DATA
-- ============================================================
INSERT INTO public.graph_entities(organization_id, entity_type, source_table, source_id, label, metadata)
SELECT organization_id, 'person', 'profiles', id, full_name,
       jsonb_build_object('job_title', job_title, 'department_id', department_id)
FROM public.profiles WHERE organization_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.graph_entities(organization_id, entity_type, source_table, source_id, label, metadata)
SELECT organization_id, 'project', 'projects', id, name,
       jsonb_build_object('status', status, 'due_date', due_date)
FROM public.projects
ON CONFLICT DO NOTHING;

INSERT INTO public.graph_entities(organization_id, entity_type, source_table, source_id, label, metadata)
SELECT organization_id, 'task', 'tasks', id, title,
       jsonb_build_object('status', status, 'priority', priority, 'due_date', due_date)
FROM public.tasks
ON CONFLICT DO NOTHING;

INSERT INTO public.graph_entities(organization_id, entity_type, source_table, source_id, label, metadata)
SELECT organization_id, 'document', 'documents', id, title,
       jsonb_build_object('category', category, 'status', status)
FROM public.documents
ON CONFLICT DO NOTHING;

INSERT INTO public.graph_entities(organization_id, entity_type, source_table, source_id, label, metadata)
SELECT organization_id, 'kpi', 'kpis', id, title,
       jsonb_build_object('current', current_value, 'target', target_value, 'status', status)
FROM public.kpis
ON CONFLICT DO NOTHING;

INSERT INTO public.graph_entities(organization_id, entity_type, source_table, source_id, label, metadata)
SELECT organization_id, 'channel', 'channels', id, name, '{}'::jsonb
FROM public.channels
ON CONFLICT DO NOTHING;

-- Backfill task -> project and task -> assignee/creator edges
INSERT INTO public.graph_edges(organization_id, from_entity_id, to_entity_id, edge_type)
SELECT t.organization_id, te.id, pe.id, 'belongs_to'
FROM public.tasks t
JOIN public.graph_entities te ON te.organization_id=t.organization_id AND te.entity_type='task' AND te.source_id=t.id
JOIN public.graph_entities pe ON pe.organization_id=t.organization_id AND pe.entity_type='project' AND pe.source_id=t.project_id
WHERE t.project_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.graph_edges(organization_id, from_entity_id, to_entity_id, edge_type)
SELECT t.organization_id, ae.id, te.id, 'assigned_to'
FROM public.tasks t
JOIN public.graph_entities te ON te.organization_id=t.organization_id AND te.entity_type='task' AND te.source_id=t.id
JOIN public.graph_entities ae ON ae.organization_id=t.organization_id AND ae.entity_type='person' AND ae.source_id=t.assigned_to
WHERE t.assigned_to IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.graph_edges(organization_id, from_entity_id, to_entity_id, edge_type)
SELECT p.organization_id, oe.id, pe.id, 'owns'
FROM public.projects p
JOIN public.graph_entities pe ON pe.organization_id=p.organization_id AND pe.entity_type='project' AND pe.source_id=p.id
JOIN public.graph_entities oe ON oe.organization_id=p.organization_id AND oe.entity_type='person' AND oe.source_id=p.owner_id
WHERE p.owner_id IS NOT NULL
ON CONFLICT DO NOTHING;
