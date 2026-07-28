
-- =========================================================
-- WAVE 1 FIX: attach triggers on source tables
-- =========================================================
DROP TRIGGER IF EXISTS trg_graph_sync_task ON public.tasks;
CREATE TRIGGER trg_graph_sync_task
AFTER INSERT OR UPDATE OR DELETE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.graph_sync_task();

DROP TRIGGER IF EXISTS trg_graph_sync_project ON public.projects;
CREATE TRIGGER trg_graph_sync_project
AFTER INSERT OR UPDATE OR DELETE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.graph_sync_project();

DROP TRIGGER IF EXISTS trg_graph_sync_profile ON public.profiles;
CREATE TRIGGER trg_graph_sync_profile
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.graph_sync_profile();

DROP TRIGGER IF EXISTS trg_graph_sync_document ON public.documents;
CREATE TRIGGER trg_graph_sync_document
AFTER INSERT OR UPDATE OR DELETE ON public.documents
FOR EACH ROW EXECUTE FUNCTION public.graph_sync_document();

DROP TRIGGER IF EXISTS trg_graph_sync_message ON public.messages;
CREATE TRIGGER trg_graph_sync_message
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.graph_sync_message();

DROP TRIGGER IF EXISTS trg_graph_sync_kpi ON public.kpis;
CREATE TRIGGER trg_graph_sync_kpi
AFTER INSERT OR UPDATE OR DELETE ON public.kpis
FOR EACH ROW EXECUTE FUNCTION public.graph_sync_kpi();

-- =========================================================
-- WAVE 1 FIX: full backfill
-- =========================================================
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT * FROM public.profiles WHERE organization_id IS NOT NULL LOOP
    PERFORM public.graph_upsert_entity(r.organization_id, 'person', 'profiles', r.id, r.full_name,
      jsonb_build_object('job_title', r.job_title, 'department_id', r.department_id));
  END LOOP;

  FOR r IN SELECT * FROM public.projects LOOP
    PERFORM public.graph_upsert_entity(r.organization_id, 'project', 'projects', r.id, r.name,
      jsonb_build_object('status', r.status, 'due_date', r.due_date));
    IF r.owner_id IS NOT NULL THEN
      PERFORM public.graph_upsert_edge(r.organization_id,
        (SELECT id FROM public.graph_entities WHERE organization_id = r.organization_id AND entity_type='person' AND source_id = r.owner_id),
        (SELECT id FROM public.graph_entities WHERE organization_id = r.organization_id AND entity_type='project' AND source_id = r.id),
        'owns');
    END IF;
  END LOOP;

  FOR r IN SELECT * FROM public.tasks LOOP
    DECLARE _t UUID; _p UUID; _a UUID; _c UUID;
    BEGIN
      _t := public.graph_upsert_entity(r.organization_id, 'task', 'tasks', r.id, r.title,
        jsonb_build_object('status', r.status, 'priority', r.priority, 'due_date', r.due_date));
      IF r.project_id IS NOT NULL THEN
        _p := public.graph_upsert_entity(r.organization_id, 'project', 'projects', r.project_id, NULL, '{}'::jsonb);
        PERFORM public.graph_upsert_edge(r.organization_id, _t, _p, 'belongs_to');
      END IF;
      IF r.assigned_to IS NOT NULL THEN
        _a := public.graph_upsert_entity(r.organization_id, 'person', 'profiles', r.assigned_to, NULL, '{}'::jsonb);
        PERFORM public.graph_upsert_edge(r.organization_id, _a, _t, 'assigned_to');
      END IF;
      IF r.created_by IS NOT NULL THEN
        _c := public.graph_upsert_entity(r.organization_id, 'person', 'profiles', r.created_by, NULL, '{}'::jsonb);
        PERFORM public.graph_upsert_edge(r.organization_id, _c, _t, 'owns');
      END IF;
    END;
  END LOOP;

  FOR r IN SELECT * FROM public.documents LOOP
    DECLARE _d UUID; _u UUID;
    BEGIN
      _d := public.graph_upsert_entity(r.organization_id, 'document', 'documents', r.id, r.title,
        jsonb_build_object('category', r.category, 'status', r.status));
      IF r.uploaded_by IS NOT NULL THEN
        _u := public.graph_upsert_entity(r.organization_id, 'person', 'profiles', r.uploaded_by, NULL, '{}'::jsonb);
        PERFORM public.graph_upsert_edge(r.organization_id, _u, _d, 'owns');
      END IF;
    END;
  END LOOP;

  FOR r IN SELECT * FROM public.kpis LOOP
    DECLARE _k UUID; _o UUID;
    BEGIN
      _k := public.graph_upsert_entity(r.organization_id, 'kpi', 'kpis', r.id, r.title,
        jsonb_build_object('current', r.current_value, 'target', r.target_value, 'status', r.status));
      IF r.owner_id IS NOT NULL THEN
        _o := public.graph_upsert_entity(r.organization_id, 'person', 'profiles', r.owner_id, NULL, '{}'::jsonb);
        PERFORM public.graph_upsert_edge(r.organization_id, _o, _k, 'owns');
      END IF;
    END;
  END LOOP;
END $$;

-- =========================================================
-- Workload RPC (used by intelligence-query)
-- =========================================================
CREATE OR REPLACE FUNCTION public.graph_workload_by_person(_org uuid)
RETURNS TABLE(user_id uuid, full_name text, open_count bigint, blocked_count bigint, completed_count bigint, overdue_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    p.id AS user_id,
    p.full_name,
    count(*) FILTER (WHERE t.status IN ('todo','in_progress','review')) AS open_count,
    count(*) FILTER (WHERE t.status = 'blocked') AS blocked_count,
    count(*) FILTER (WHERE t.status = 'completed') AS completed_count,
    count(*) FILTER (WHERE t.due_date < CURRENT_DATE AND t.status <> 'completed') AS overdue_count
  FROM public.profiles p
  LEFT JOIN public.tasks t ON t.assigned_to = p.id AND t.organization_id = _org
  WHERE p.organization_id = _org
  GROUP BY p.id, p.full_name
  ORDER BY open_count DESC;
$$;
GRANT EXECUTE ON FUNCTION public.graph_workload_by_person(uuid) TO authenticated, service_role;

-- =========================================================
-- Isolation probe (RLS verification, safe for any caller)
-- =========================================================
CREATE OR REPLACE FUNCTION public.intelligence_isolation_probe()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _org uuid;
  _entities_own bigint;
  _entities_leak bigint;
  _edges_own bigint;
  _edges_leak bigint;
  _events_own bigint;
  _events_leak bigint;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('error','not_authenticated');
  END IF;
  SELECT organization_id INTO _org FROM public.profiles WHERE id = _uid;
  IF _org IS NULL THEN
    RETURN jsonb_build_object('error','no_organization');
  END IF;
  SELECT count(*) INTO _entities_own FROM public.graph_entities WHERE organization_id = _org;
  SELECT count(*) INTO _entities_leak FROM public.graph_entities WHERE organization_id <> _org;
  SELECT count(*) INTO _edges_own FROM public.graph_edges WHERE organization_id = _org;
  SELECT count(*) INTO _edges_leak FROM public.graph_edges WHERE organization_id <> _org;
  SELECT count(*) INTO _events_own FROM public.graph_events WHERE organization_id = _org;
  SELECT count(*) INTO _events_leak FROM public.graph_events WHERE organization_id <> _org;

  RETURN jsonb_build_object(
    'user_id', _uid,
    'org_id', _org,
    'entities_visible_own', _entities_own,
    'entities_visible_other', _entities_leak,
    'edges_visible_own', _edges_own,
    'edges_visible_other', _edges_leak,
    'events_visible_own', _events_own,
    'events_visible_other', _events_leak,
    'isolated', (_entities_leak = 0 AND _edges_leak = 0 AND _events_leak = 0)
  );
END $$;
GRANT EXECUTE ON FUNCTION public.intelligence_isolation_probe() TO authenticated;

-- =========================================================
-- WAVE 2: workflow auto-instantiation
-- =========================================================
CREATE OR REPLACE FUNCTION public.workflow_instantiate(_org uuid, _trigger text, _actor uuid, _payload jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _wf RECORD;
BEGIN
  FOR _wf IN SELECT id FROM public.workflows
    WHERE organization_id = _org AND is_active = true AND trigger_type = _trigger LOOP
    INSERT INTO public.workflow_instances(workflow_id, organization_id, current_step, status, trigger_data, started_by)
    VALUES (_wf.id, _org, 0, 'active', COALESCE(_payload,'{}'::jsonb), COALESCE(_actor, _org));
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.workflow_on_task() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.workflow_instantiate(NEW.organization_id, 'task_created', NEW.created_by,
      jsonb_build_object('task_id', NEW.id, 'title', NEW.title, 'assigned_to', NEW.assigned_to));
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    PERFORM public.workflow_instantiate(NEW.organization_id, 'task_completed', NEW.assigned_to,
      jsonb_build_object('task_id', NEW.id));
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_workflow_on_task ON public.tasks;
CREATE TRIGGER trg_workflow_on_task AFTER INSERT OR UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.workflow_on_task();

CREATE OR REPLACE FUNCTION public.workflow_on_leave() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.workflow_instantiate(NEW.organization_id, 'leave_requested', NEW.user_id,
      jsonb_build_object('leave_id', NEW.id, 'type', NEW.leave_type));
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_workflow_on_leave ON public.leave_requests;
CREATE TRIGGER trg_workflow_on_leave AFTER INSERT ON public.leave_requests
FOR EACH ROW EXECUTE FUNCTION public.workflow_on_leave();

CREATE OR REPLACE FUNCTION public.workflow_on_expense() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.workflow_instantiate(NEW.organization_id, 'expense_submitted', NEW.submitted_by,
    jsonb_build_object('expense_id', NEW.id, 'amount', NEW.amount));
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_workflow_on_expense ON public.expense_reports;
CREATE TRIGGER trg_workflow_on_expense AFTER INSERT ON public.expense_reports
FOR EACH ROW EXECUTE FUNCTION public.workflow_on_expense();

CREATE OR REPLACE FUNCTION public.workflow_on_document() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.workflow_instantiate(NEW.organization_id, 'document_uploaded', NEW.uploaded_by,
    jsonb_build_object('document_id', NEW.id, 'title', NEW.title));
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_workflow_on_document ON public.documents;
CREATE TRIGGER trg_workflow_on_document AFTER INSERT ON public.documents
FOR EACH ROW EXECUTE FUNCTION public.workflow_on_document();

-- Allow workflow-run edge function (service role) to write step logs on behalf of assignees.
-- Also allow legitimate authenticated executor actions to record logs where performed_by
-- is any org member (needed for approvals recorded through the UI).
DROP POLICY IF EXISTS "Add step logs" ON public.workflow_step_logs;
CREATE POLICY "Add step logs" ON public.workflow_step_logs FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.workflow_instances wi
    WHERE wi.id = workflow_step_logs.instance_id
    AND wi.organization_id = public.get_user_org_id(auth.uid()))
);
