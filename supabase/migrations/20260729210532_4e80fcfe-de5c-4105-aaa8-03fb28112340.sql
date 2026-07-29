ALTER TABLE public.invitations ALTER COLUMN email DROP NOT NULL;
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS access_code text;
CREATE UNIQUE INDEX IF NOT EXISTS invitations_access_code_key ON public.invitations (access_code) WHERE access_code IS NOT NULL;

CREATE OR REPLACE FUNCTION public.create_access_token(_role app_role, _department_id uuid DEFAULT NULL, _job_title text DEFAULT NULL, _expires_hours integer DEFAULT 168)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _org uuid;
  _code text;
  _row public.invitations;
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

  RETURN jsonb_build_object('success', true, 'access_code', _row.access_code, 'token', _row.token, 'expires_at', _row.expires_at);
END;
$$;

CREATE OR REPLACE FUNCTION public.lookup_access_token(_code text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _inv record;
  _org record;
BEGIN
  SELECT * INTO _inv FROM public.invitations
   WHERE access_code = upper(trim(_code)) AND status = 'pending' AND expires_at > now();
  IF _inv IS NULL THEN RETURN jsonb_build_object('valid', false); END IF;
  SELECT id, name, slug, logo_url INTO _org FROM public.organizations WHERE id = _inv.organization_id;
  RETURN jsonb_build_object('valid', true, 'organization_name', _org.name, 'organization_slug', _org.slug,
                            'logo_url', _org.logo_url, 'role', _inv.role, 'expires_at', _inv.expires_at);
END;
$$;

CREATE OR REPLACE FUNCTION public.redeem_access_token(_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _inv record;
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RETURN jsonb_build_object('error','Not authenticated'); END IF;

  SELECT * INTO _inv FROM public.invitations
   WHERE access_code = upper(trim(_code)) AND status = 'pending' AND expires_at > now()
   FOR UPDATE;
  IF _inv IS NULL THEN RETURN jsonb_build_object('error','Invalid, used or expired access token'); END IF;

  UPDATE public.profiles SET organization_id = _inv.organization_id,
    department_id = _inv.department_id, job_title = COALESCE(_inv.job_title, job_title)
  WHERE id = _uid;

  INSERT INTO public.user_roles (user_id, organization_id, role)
  VALUES (_uid, _inv.organization_id, _inv.role)
  ON CONFLICT (user_id, organization_id) DO UPDATE SET role = EXCLUDED.role;

  UPDATE public.invitations SET status = 'accepted', accepted_at = now() WHERE id = _inv.id;

  RETURN jsonb_build_object('success', true, 'organization_id', _inv.organization_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_access_token(app_role, uuid, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_access_token(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_access_token(text) TO anon, authenticated;