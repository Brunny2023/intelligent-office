DO $$
DECLARE f record;
  keep_auth text[] := ARRAY[
    'accept_invitation','complete_onboarding','create_access_token','revoke_access_token',
    'lookup_access_token','redeem_access_token','get_investor_metrics','get_platform_stats',
    'get_platform_tenants','graph_workload_by_person','intelligence_isolation_probe',
    'is_platform_admin','search_memory','touch_memory','sign_memo','verify_memo_signature',
    'cognition_governance_scorecard','has_role','has_share_consent','has_document_share',
    'get_user_org_id','is_approved_investor','current_investor_id'
  ];
  keep_anon text[] := ARRAY['lookup_access_token','redeem_access_token','get_investor_metrics'];
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS sig, p.proname
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', f.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f.sig);
    IF f.proname = ANY(keep_auth) THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', f.sig);
    END IF;
    IF f.proname = ANY(keep_anon) THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon', f.sig);
    END IF;
  END LOOP;
END $$;