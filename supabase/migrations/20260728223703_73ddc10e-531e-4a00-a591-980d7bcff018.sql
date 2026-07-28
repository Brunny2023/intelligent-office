-- 1. Signature ledger (append-only)
CREATE TABLE public.signature_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  memo_id uuid NOT NULL REFERENCES public.internal_memos(id) ON DELETE CASCADE,
  signer_id uuid NOT NULL REFERENCES auth.users(id),
  content_hash text NOT NULL,
  signature_hash text NOT NULL,
  prev_hash text,
  chain_hash text NOT NULL,
  signed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_sigledger_memo ON public.signature_ledger(memo_id);
CREATE INDEX idx_sigledger_org ON public.signature_ledger(organization_id, signed_at DESC);

GRANT SELECT ON public.signature_ledger TO authenticated;
GRANT ALL ON public.signature_ledger TO service_role;

ALTER TABLE public.signature_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members read ledger" ON public.signature_ledger
  FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()));

-- 2. Org share consents (Partner Connect)
CREATE TABLE public.org_share_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  partner_org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  share_type text NOT NULL CHECK (share_type IN ('kpi','insight')),
  resource_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked','expired')),
  granted_by uuid NOT NULL REFERENCES auth.users(id),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_org_id, partner_org_id, share_type, resource_id)
);
CREATE INDEX idx_share_owner ON public.org_share_consents(owner_org_id, status);
CREATE INDEX idx_share_partner ON public.org_share_consents(partner_org_id, status);

GRANT SELECT, INSERT, UPDATE ON public.org_share_consents TO authenticated;
GRANT ALL ON public.org_share_consents TO service_role;

ALTER TABLE public.org_share_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "either party reads consents" ON public.org_share_consents
  FOR SELECT TO authenticated
  USING (
    owner_org_id = public.get_user_org_id(auth.uid())
    OR partner_org_id = public.get_user_org_id(auth.uid())
  );

CREATE POLICY "owners/execs write consents" ON public.org_share_consents
  FOR INSERT TO authenticated
  WITH CHECK (
    owner_org_id = public.get_user_org_id(auth.uid())
    AND (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'executive'))
    AND granted_by = auth.uid()
  );

CREATE POLICY "owners/execs update consents" ON public.org_share_consents
  FOR UPDATE TO authenticated
  USING (
    owner_org_id = public.get_user_org_id(auth.uid())
    AND (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'executive'))
  );

CREATE TRIGGER trg_share_touch BEFORE UPDATE ON public.org_share_consents
  FOR EACH ROW EXECUTE FUNCTION public.graph_touch_updated_at();

-- 3. Sign memo function
CREATE OR REPLACE FUNCTION public.sign_memo(_memo_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _memo record;
  _sig record;
  _prev text;
  _chash text;
  _shash text;
  _chain text;
  _ledger_id uuid;
BEGIN
  IF _uid IS NULL THEN RETURN jsonb_build_object('error','not_authenticated'); END IF;

  SELECT * INTO _memo FROM public.internal_memos WHERE id = _memo_id;
  IF _memo IS NULL THEN RETURN jsonb_build_object('error','memo_not_found'); END IF;
  IF _memo.organization_id <> public.get_user_org_id(_uid) THEN
    RETURN jsonb_build_object('error','forbidden');
  END IF;

  SELECT * INTO _sig FROM public.user_signatures WHERE user_id = _uid ORDER BY updated_at DESC LIMIT 1;
  IF _sig IS NULL THEN RETURN jsonb_build_object('error','no_signature_on_file'); END IF;

  _chash := encode(digest(coalesce(_memo.title,'') || '|' || coalesce(_memo.content,''), 'sha256'), 'hex');
  _shash := encode(digest(_sig.signature_data || '|' || _uid::text || '|' || now()::text, 'sha256'), 'hex');

  SELECT chain_hash INTO _prev FROM public.signature_ledger
    WHERE organization_id = _memo.organization_id ORDER BY signed_at DESC LIMIT 1;

  _chain := encode(digest(coalesce(_prev,'') || '|' || _chash || '|' || _shash, 'sha256'), 'hex');

  INSERT INTO public.signature_ledger(organization_id, memo_id, signer_id, content_hash, signature_hash, prev_hash, chain_hash)
  VALUES (_memo.organization_id, _memo_id, _uid, _chash, _shash, _prev, _chain)
  RETURNING id INTO _ledger_id;

  UPDATE public.internal_memos SET signature_id = _sig.id, status = 'signed' WHERE id = _memo_id;

  RETURN jsonb_build_object('success', true, 'ledger_id', _ledger_id, 'chain_hash', _chain);
END $$;

-- 4. Verify memo signature
CREATE OR REPLACE FUNCTION public.verify_memo_signature(_memo_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _memo record;
  _entry record;
  _recomputed text;
BEGIN
  SELECT * INTO _memo FROM public.internal_memos WHERE id = _memo_id;
  IF _memo IS NULL THEN RETURN jsonb_build_object('valid', false, 'reason', 'memo_not_found'); END IF;
  IF _memo.organization_id <> public.get_user_org_id(auth.uid()) THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'forbidden');
  END IF;

  SELECT * INTO _entry FROM public.signature_ledger
    WHERE memo_id = _memo_id ORDER BY signed_at DESC LIMIT 1;
  IF _entry IS NULL THEN RETURN jsonb_build_object('valid', false, 'reason', 'not_signed'); END IF;

  _recomputed := encode(digest(coalesce(_memo.title,'') || '|' || coalesce(_memo.content,''), 'sha256'), 'hex');
  RETURN jsonb_build_object(
    'valid', _recomputed = _entry.content_hash,
    'signed_at', _entry.signed_at,
    'signer_id', _entry.signer_id,
    'chain_hash', _entry.chain_hash
  );
END $$;

-- 5. Retention purge
CREATE OR REPLACE FUNCTION public.retention_purge()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org record;
  _cutoff timestamptz;
  _al bigint := 0; _no bigint := 0; _ms bigint := 0;
BEGIN
  FOR _org IN
    SELECT o.id, coalesce(cs.data_retention_days, 365) AS days
    FROM public.organizations o
    LEFT JOIN public.compliance_settings cs ON cs.organization_id = o.id
  LOOP
    _cutoff := now() - make_interval(days => _org.days);
    WITH d AS (DELETE FROM public.activity_logs WHERE organization_id = _org.id AND created_at < _cutoff RETURNING 1)
      SELECT _al + count(*) INTO _al FROM d;
    WITH d AS (DELETE FROM public.notifications WHERE organization_id = _org.id AND created_at < _cutoff RETURNING 1)
      SELECT _no + count(*) INTO _no FROM d;
    WITH d AS (
      DELETE FROM public.messages m USING public.channels c
      WHERE m.channel_id = c.id AND c.organization_id = _org.id AND m.created_at < _cutoff RETURNING 1
    ) SELECT _ms + count(*) INTO _ms FROM d;
  END LOOP;
  RETURN jsonb_build_object('activity_logs_purged', _al, 'notifications_purged', _no, 'messages_purged', _ms);
END $$;

-- 6. Ensure pgcrypto for digest()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 7. Schedule retention job daily
SELECT cron.schedule('retention-purge-daily', '15 3 * * *', $$ SELECT public.retention_purge(); $$);