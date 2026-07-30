CREATE TABLE IF NOT EXISTS public.access_token_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  invitation_id uuid,
  access_code text,
  event_type text NOT NULL,
  actor_id uuid,
  actor_email text,
  role text,
  fingerprint text,
  user_agent text,
  success boolean NOT NULL DEFAULT true,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ate_org_created_idx ON public.access_token_events (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ate_fp_idx ON public.access_token_events (fingerprint, created_at DESC);
CREATE INDEX IF NOT EXISTS ate_code_idx ON public.access_token_events (access_code, created_at DESC);

GRANT SELECT ON public.access_token_events TO authenticated;
GRANT ALL ON public.access_token_events TO service_role;
ALTER TABLE public.access_token_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org admins view token audit" ON public.access_token_events;
CREATE POLICY "Org admins view token audit" ON public.access_token_events
FOR SELECT TO authenticated
USING (
  organization_id = public.get_user_org_id(auth.uid())
  AND (
    public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'executive')
    OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'auditor')
  )
);

CREATE TABLE IF NOT EXISTS public.status_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text,
  component text NOT NULL DEFAULT 'platform',
  severity text NOT NULL DEFAULT 'minor',
  status text NOT NULL DEFAULT 'resolved',
  started_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.status_incidents TO anon, authenticated;
GRANT ALL ON public.status_incidents TO service_role;
ALTER TABLE public.status_incidents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read incidents" ON public.status_incidents;
CREATE POLICY "Anyone can read incidents" ON public.status_incidents
FOR SELECT TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.log_token_event(
  _org uuid, _invitation uuid, _code text, _event text, _actor uuid,
  _role text, _fingerprint text, _user_agent text, _success boolean, _detail jsonb
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.access_token_events
    (organization_id, invitation_id, access_code, event_type, actor_id, role, fingerprint, user_agent, success, detail)
  VALUES (_org, _invitation, _code, _event, _actor, _role, left(coalesce(_fingerprint,''),128),
          left(coalesce(_user_agent,''),400), _success, coalesce(_detail,'{}'::jsonb));
END; $$;

CREATE OR REPLACE FUNCTION public.token_attempt_blocked(_fingerprint text, _code text)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _fp_fails int; _code_fails int;
BEGIN
  SELECT count(*) INTO _fp_fails FROM public.access_token_events
   WHERE fingerprint = _fingerprint AND success = false
     AND event_type IN ('verify_failed','redeem_failed')
     AND created_at > now() - interval '15 minutes';
  SELECT count(*) INTO _code_fails FROM public.access_token_events
   WHERE access_code = upper(trim(coalesce(_code,''))) AND success = false
     AND created_at > now() - interval '15 minutes';
  RETURN (_fp_fails >= 10 OR _code_fails >= 5);
END; $$;

CREATE OR REPLACE FUNCTION public.alert_suspicious_token_activity(_org uuid, _fingerprint text, _code text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _r record; _recent int;
BEGIN
  IF _org IS NULL THEN RETURN; END IF;
  SELECT count(*) INTO _recent FROM public.access_token_events
   WHERE organization_id = _org AND success = false AND created_at > now() - interval '15 minutes';
  IF _recent < 5 THEN RETURN; END IF;
  IF EXISTS (SELECT 1 FROM public.notifications
              WHERE organization_id = _org AND type = 'security'
                AND created_at > now() - interval '30 minutes'
                AND title = 'Suspicious join attempts detected') THEN
    RETURN;
  END IF;
  FOR _r IN SELECT user_id FROM public.user_roles
             WHERE organization_id = _org AND role IN ('owner','executive') LOOP
    INSERT INTO public.notifications (organization_id, user_id, title, message, type, link)
    VALUES (_org, _r.user_id, 'Suspicious join attempts detected',
      _recent || ' failed access-token attempts in the last 15 minutes. Review the access token audit trail.',
      'security', '/team');
  END LOOP;
END; $$;

DROP FUNCTION IF EXISTS public.lookup_access_token(text);
DROP FUNCTION IF EXISTS public.redeem_access_token(text);

CREATE OR REPLACE FUNCTION public.lookup_access_token(_code text, _fingerprint text DEFAULT NULL, _user_agent text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _inv record; _org record; _norm text := upper(trim(coalesce(_code,'')));
BEGIN
  IF _norm !~ '^[0-9A-F]{12}$' THEN
    PERFORM public.log_token_event(NULL,NULL,_norm,'verify_failed',auth.uid(),NULL,_fingerprint,_user_agent,false,
      jsonb_build_object('reason','malformed'));
    RETURN jsonb_build_object('valid', false, 'reason','malformed');
  END IF;

  IF public.token_attempt_blocked(_fingerprint, _norm) THEN
    RETURN jsonb_build_object('valid', false, 'rate_limited', true,
      'reason','Too many attempts. Please wait 15 minutes before trying again.');
  END IF;

  SELECT * INTO _inv FROM public.invitations
   WHERE access_code = _norm AND status = 'pending' AND expires_at > now();

  IF _inv IS NULL THEN
    PERFORM public.log_token_event(NULL,NULL,_norm,'verify_failed',auth.uid(),NULL,_fingerprint,_user_agent,false,
      jsonb_build_object('reason','invalid_or_expired'));
    PERFORM public.alert_suspicious_token_activity(
      (SELECT organization_id FROM public.invitations WHERE access_code = _norm LIMIT 1), _fingerprint, _norm);
    RETURN jsonb_build_object('valid', false);
  END IF;

  SELECT id, name, slug, logo_url INTO _org FROM public.organizations WHERE id = _inv.organization_id;
  PERFORM public.log_token_event(_inv.organization_id,_inv.id,_norm,'verified',auth.uid(),_inv.role::text,_fingerprint,_user_agent,true,'{}'::jsonb);

  RETURN jsonb_build_object('valid', true, 'organization_name', _org.name, 'organization_slug', _org.slug,
                            'logo_url', _org.logo_url, 'role', _inv.role, 'expires_at', _inv.expires_at);
END; $$;

CREATE OR REPLACE FUNCTION public.redeem_access_token(_code text, _fingerprint text DEFAULT NULL, _user_agent text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _inv record; _uid uuid := auth.uid(); _norm text := upper(trim(coalesce(_code,'')));
BEGIN
  IF _uid IS NULL THEN RETURN jsonb_build_object('error','Not authenticated'); END IF;

  IF _norm !~ '^[0-9A-F]{12}$' THEN
    PERFORM public.log_token_event(NULL,NULL,_norm,'redeem_failed',_uid,NULL,_fingerprint,_user_agent,false,
      jsonb_build_object('reason','malformed'));
    RETURN jsonb_build_object('error','Invalid access token');
  END IF;

  IF public.token_attempt_blocked(_fingerprint, _norm) THEN
    RETURN jsonb_build_object('error','Too many attempts. Please wait 15 minutes before trying again.','rate_limited',true);
  END IF;

  SELECT * INTO _inv FROM public.invitations
   WHERE access_code = _norm AND status = 'pending' AND expires_at > now()
   FOR UPDATE;

  IF _inv IS NULL THEN
    PERFORM public.log_token_event(NULL,NULL,_norm,'redeem_failed',_uid,NULL,_fingerprint,_user_agent,false,
      jsonb_build_object('reason','invalid_used_or_expired'));
    PERFORM public.alert_suspicious_token_activity(
      (SELECT organization_id FROM public.invitations WHERE access_code = _norm LIMIT 1), _fingerprint, _norm);
    RETURN jsonb_build_object('error','Invalid, used or expired access token');
  END IF;

  UPDATE public.profiles SET organization_id = _inv.organization_id,
    department_id = _inv.department_id, job_title = COALESCE(_inv.job_title, job_title)
  WHERE id = _uid;

  INSERT INTO public.user_roles (user_id, organization_id, role)
  VALUES (_uid, _inv.organization_id, _inv.role)
  ON CONFLICT (user_id, organization_id) DO UPDATE SET role = EXCLUDED.role;

  UPDATE public.invitations SET status = 'accepted', accepted_at = now() WHERE id = _inv.id;

  PERFORM public.log_token_event(_inv.organization_id,_inv.id,_norm,'redeemed',_uid,_inv.role::text,_fingerprint,_user_agent,true,'{}'::jsonb);

  RETURN jsonb_build_object('success', true, 'organization_id', _inv.organization_id);
END; $$;

CREATE OR REPLACE FUNCTION public.create_access_token(_role app_role, _department_id uuid DEFAULT NULL, _job_title text DEFAULT NULL, _expires_hours integer DEFAULT 168)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _org uuid; _code text; _row public.invitations;
BEGIN
  IF _uid IS NULL THEN RETURN jsonb_build_object('error','Not authenticated'); END IF;
  _org := public.get_user_org_id(_uid);
  IF _org IS NULL THEN RETURN jsonb_build_object('error','No organization'); END IF;
  IF NOT (public.has_role(_uid,'owner') OR public.has_role(_uid,'executive') OR public.has_role(_uid,'manager')) THEN
    RETURN jsonb_build_object('error','Only owners, executives and managers can generate access tokens');
  END IF;
  IF _role = 'owner' THEN RETURN jsonb_build_object('error','Owner role cannot be granted by access token'); END IF;
  IF _expires_hours IS NULL OR _expires_hours < 1 OR _expires_hours > 720 THEN
    RETURN jsonb_build_object('error','Expiry must be between 1 and 720 hours');
  END IF;

  LOOP
    _code := upper(encode(gen_random_bytes(6),'hex'));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.invitations WHERE access_code = _code);
  END LOOP;

  INSERT INTO public.invitations (organization_id, email, role, department_id, job_title, invited_by, status, expires_at, access_code)
  VALUES (_org, NULL, _role, _department_id, _job_title, _uid, 'pending', now() + make_interval(hours => _expires_hours), _code)
  RETURNING * INTO _row;

  PERFORM public.log_token_event(_org,_row.id,_code,'generated',_uid,_role::text,NULL,NULL,true,
    jsonb_build_object('expires_at',_row.expires_at,'job_title',_job_title));

  RETURN jsonb_build_object('success', true, 'access_code', _row.access_code, 'token', _row.token, 'expires_at', _row.expires_at);
END; $$;

CREATE OR REPLACE FUNCTION public.revoke_access_token(_invitation_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _org uuid; _inv record;
BEGIN
  IF _uid IS NULL THEN RETURN jsonb_build_object('error','Not authenticated'); END IF;
  _org := public.get_user_org_id(_uid);
  IF NOT (public.has_role(_uid,'owner') OR public.has_role(_uid,'executive') OR public.has_role(_uid,'manager')) THEN
    RETURN jsonb_build_object('error','Not permitted');
  END IF;
  SELECT * INTO _inv FROM public.invitations WHERE id = _invitation_id AND organization_id = _org;
  IF _inv IS NULL THEN RETURN jsonb_build_object('error','Token not found'); END IF;

  UPDATE public.invitations SET status = 'revoked' WHERE id = _inv.id;
  PERFORM public.log_token_event(_org,_inv.id,_inv.access_code,'revoked',_uid,_inv.role::text,NULL,NULL,true,'{}'::jsonb);
  RETURN jsonb_build_object('success', true);
END; $$;

GRANT EXECUTE ON FUNCTION public.lookup_access_token(text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_access_token(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_access_token(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_access_token(app_role, uuid, text, integer) TO authenticated;