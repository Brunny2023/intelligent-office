
CREATE TABLE public.platform_admins (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.platform_admins TO authenticated;
GRANT ALL ON public.platform_admins TO service_role;
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see if they are a platform admin"
ON public.platform_admins FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _result JSONB;
BEGIN
  IF _uid IS NULL OR NOT public.is_platform_admin(_uid) THEN
    RETURN jsonb_build_object('error', 'unauthorized');
  END IF;

  SELECT jsonb_build_object(
    'total_orgs', (SELECT count(*) FROM public.organizations),
    'total_users', (SELECT count(*) FROM public.profiles),
    'total_tasks', (SELECT count(*) FROM public.tasks),
    'tasks_30d', (SELECT count(*) FROM public.tasks WHERE created_at > now() - interval '30 days'),
    'messages_30d', (SELECT count(*) FROM public.messages WHERE created_at > now() - interval '30 days'),
    'ai_insights_30d', (SELECT count(*) FROM public.ai_insights WHERE created_at > now() - interval '30 days'),
    'mau_30d', (SELECT count(DISTINCT user_id) FROM public.activity_logs WHERE created_at > now() - interval '30 days'),
    'open_tickets', (SELECT count(*) FROM public.support_tickets WHERE status IN ('open','in_progress')),
    'active_projects', (SELECT count(*) FROM public.projects WHERE status = 'active'),
    'total_meetings', 0,
    'new_orgs_30d', (SELECT count(*) FROM public.organizations WHERE created_at > now() - interval '30 days')
  ) INTO _result;

  RETURN _result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_platform_tenants()
RETURNS TABLE (
  id UUID, name TEXT, slug TEXT, created_at TIMESTAMPTZ,
  member_count BIGINT, task_count BIGINT, ticket_count BIGINT, last_activity TIMESTAMPTZ
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    o.id, o.name, o.slug, o.created_at,
    (SELECT count(*) FROM public.profiles p WHERE p.organization_id = o.id) AS member_count,
    (SELECT count(*) FROM public.tasks t WHERE t.organization_id = o.id) AS task_count,
    (SELECT count(*) FROM public.support_tickets s WHERE s.organization_id = o.id) AS ticket_count,
    (SELECT max(a.created_at) FROM public.activity_logs a WHERE a.organization_id = o.id) AS last_activity
  FROM public.organizations o
  ORDER BY o.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_platform_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_platform_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_platform_tenants() TO authenticated;
