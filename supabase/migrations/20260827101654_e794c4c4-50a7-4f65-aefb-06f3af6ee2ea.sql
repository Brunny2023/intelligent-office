-- 1. Lock down anon table exposure (GraphQL/PostgREST discoverability)
DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public' LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t.tablename);
  END LOOP;
END $$;

GRANT INSERT ON public.investor_analytics TO anon;
GRANT INSERT ON public.investor_meetings TO anon;
GRANT INSERT ON public.investor_profiles TO anon;
GRANT SELECT ON public.status_incidents TO anon;

-- 2. Fix mutable search_path on email queue helpers
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq, extensions;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq, extensions;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq, extensions;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq, extensions;

-- 3. Revoke EXECUTE on SECURITY DEFINER functions that clients must never call directly
DO $$
DECLARE f record;
  keep text[] := ARRAY[
    'accept_invitation','complete_onboarding','create_access_token','revoke_access_token',
    'lookup_access_token','redeem_access_token','get_investor_metrics','get_platform_stats',
    'get_platform_tenants','graph_workload_by_person','intelligence_isolation_probe',
    'is_platform_admin','search_memory','touch_memory','sign_memo','verify_memo_signature',
    'cognition_governance_scorecard','has_role','has_share_consent','has_document_share',
    'get_user_org_id','is_approved_investor','current_investor_id'
  ];
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS sig, p.proname
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
  LOOP
    IF NOT (f.proname = ANY(keep)) THEN
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon, authenticated', f.sig);
    END IF;
  END LOOP;
END $$;

-- anon only needs the access-token lookup/redeem path and public metrics
REVOKE ALL ON FUNCTION public.accept_invitation(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.complete_onboarding(text, text, text, text, text[], text) FROM anon;
REVOKE ALL ON FUNCTION public.create_access_token(public.app_role, uuid, text, integer) FROM anon;
REVOKE ALL ON FUNCTION public.revoke_access_token(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.get_platform_stats() FROM anon;
REVOKE ALL ON FUNCTION public.get_platform_tenants() FROM anon;
REVOKE ALL ON FUNCTION public.search_memory(uuid, text, integer) FROM anon;
REVOKE ALL ON FUNCTION public.touch_memory(uuid[]) FROM anon;
REVOKE ALL ON FUNCTION public.sign_memo(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.verify_memo_signature(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.cognition_governance_scorecard(uuid, integer) FROM anon;
REVOKE ALL ON FUNCTION public.graph_workload_by_person(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.intelligence_isolation_probe() FROM anon;
REVOKE ALL ON FUNCTION public.is_platform_admin(uuid) FROM anon;

-- 4. Short, shareable meeting codes for investor meetings
ALTER TABLE public.investor_meetings
  ADD COLUMN IF NOT EXISTS short_code text;

UPDATE public.investor_meetings
SET short_code = lower(substr(replace(gen_random_uuid()::text,'-',''), 1, 8))
WHERE short_code IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS investor_meetings_short_code_key
  ON public.investor_meetings (short_code);

ALTER TABLE public.investor_meetings
  ALTER COLUMN short_code SET DEFAULT lower(substr(replace(gen_random_uuid()::text,'-',''), 1, 8));