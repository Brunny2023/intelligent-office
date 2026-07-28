
-- 1. AI insights: resolvable state + escalation + evidence
ALTER TABLE public.ai_insights
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','acknowledged','resolved','snoozed')),
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS resolved_by uuid,
  ADD COLUMN IF NOT EXISTS escalation_level int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_escalated_at timestamptz,
  ADD COLUMN IF NOT EXISTS reason jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS snoozed_until timestamptz;

DROP POLICY IF EXISTS "Update insights" ON public.ai_insights;
CREATE POLICY "Update insights" ON public.ai_insights
  FOR UPDATE TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()))
  WITH CHECK (organization_id = public.get_user_org_id(auth.uid()));

-- 2. Notification preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  in_app boolean NOT NULL DEFAULT true,
  email boolean NOT NULL DEFAULT false,
  slack boolean NOT NULL DEFAULT false,
  slack_webhook_url text,
  escalation_after_hours int NOT NULL DEFAULT 24 CHECK (escalation_after_hours BETWEEN 1 AND 168),
  escalate_to_manager boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own prefs" ON public.notification_preferences
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE TRIGGER trg_notif_prefs_touch BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.graph_touch_updated_at();

-- 3. Inter-org audit log
CREATE TABLE IF NOT EXISTS public.inter_org_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN (
    'consent_granted','consent_revoked','memo_sealed','memo_verified',
    'document_shared','document_unshared'
  )),
  owner_org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  partner_org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resource_type text,
  resource_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_owner ON public.inter_org_audit_log(owner_org_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_partner ON public.inter_org_audit_log(partner_org_id, occurred_at DESC);
GRANT SELECT ON public.inter_org_audit_log TO authenticated;
GRANT ALL ON public.inter_org_audit_log TO service_role;
ALTER TABLE public.inter_org_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "either party reads audit" ON public.inter_org_audit_log
  FOR SELECT TO authenticated
  USING (
    owner_org_id = public.get_user_org_id(auth.uid())
    OR partner_org_id = public.get_user_org_id(auth.uid())
  );

-- 4. Auto-audit triggers
CREATE OR REPLACE FUNCTION public.audit_consent_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    INSERT INTO public.inter_org_audit_log(event_type, owner_org_id, partner_org_id, actor_id, resource_type, resource_id, metadata)
    VALUES ('consent_granted', NEW.owner_org_id, NEW.partner_org_id, NEW.granted_by, NEW.share_type, NEW.resource_id,
      jsonb_build_object('share_type', NEW.share_type));
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'revoked' AND OLD.status <> 'revoked' THEN
    INSERT INTO public.inter_org_audit_log(event_type, owner_org_id, partner_org_id, actor_id, resource_type, resource_id, metadata)
    VALUES ('consent_revoked', NEW.owner_org_id, NEW.partner_org_id, auth.uid(), NEW.share_type, NEW.resource_id,
      jsonb_build_object('share_type', NEW.share_type));
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_audit_consent ON public.org_share_consents;
CREATE TRIGGER trg_audit_consent AFTER INSERT OR UPDATE ON public.org_share_consents
  FOR EACH ROW EXECUTE FUNCTION public.audit_consent_change();

CREATE OR REPLACE FUNCTION public.audit_memo_seal()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.inter_org_audit_log(event_type, owner_org_id, actor_id, resource_type, resource_id, metadata)
  VALUES ('memo_sealed', NEW.organization_id, NEW.signer_id, 'memo', NEW.memo_id,
    jsonb_build_object('chain_hash', NEW.chain_hash));
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_audit_seal ON public.signature_ledger;
CREATE TRIGGER trg_audit_seal AFTER INSERT ON public.signature_ledger
  FOR EACH ROW EXECUTE FUNCTION public.audit_memo_seal();

-- 5. Document shares (partner org access)
CREATE TABLE IF NOT EXISTS public.document_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  partner_org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  granted_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked')),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_org_id, partner_org_id, document_id)
);
GRANT SELECT, INSERT, UPDATE ON public.document_shares TO authenticated;
GRANT ALL ON public.document_shares TO service_role;
ALTER TABLE public.document_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "either party reads doc shares" ON public.document_shares
  FOR SELECT TO authenticated
  USING (
    owner_org_id = public.get_user_org_id(auth.uid())
    OR partner_org_id = public.get_user_org_id(auth.uid())
  );
CREATE POLICY "owners/execs grant doc shares" ON public.document_shares
  FOR INSERT TO authenticated
  WITH CHECK (
    owner_org_id = public.get_user_org_id(auth.uid())
    AND (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'executive') OR public.has_role(auth.uid(),'manager'))
  );
CREATE POLICY "owners/execs update doc shares" ON public.document_shares
  FOR UPDATE TO authenticated
  USING (
    owner_org_id = public.get_user_org_id(auth.uid())
    AND (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'executive') OR public.has_role(auth.uid(),'manager'))
  );
CREATE TRIGGER trg_docshare_touch BEFORE UPDATE ON public.document_shares
  FOR EACH ROW EXECUTE FUNCTION public.graph_touch_updated_at();

CREATE OR REPLACE FUNCTION public.has_document_share(_owner_org uuid, _document_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.document_shares s
    WHERE s.owner_org_id = _owner_org
      AND s.document_id = _document_id
      AND s.status = 'active'
      AND (s.expires_at IS NULL OR s.expires_at > now())
      AND s.partner_org_id = public.get_user_org_id(auth.uid())
  )
$$;

DROP POLICY IF EXISTS "View shared documents" ON public.documents;
CREATE POLICY "View shared documents" ON public.documents
  FOR SELECT TO authenticated
  USING (public.has_document_share(organization_id, id));

CREATE OR REPLACE FUNCTION public.audit_document_share()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    INSERT INTO public.inter_org_audit_log(event_type, owner_org_id, partner_org_id, actor_id, resource_type, resource_id, metadata)
    VALUES ('document_shared', NEW.owner_org_id, NEW.partner_org_id, NEW.granted_by, 'document', NEW.document_id, '{}'::jsonb);
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'revoked' AND OLD.status <> 'revoked' THEN
    INSERT INTO public.inter_org_audit_log(event_type, owner_org_id, partner_org_id, actor_id, resource_type, resource_id, metadata)
    VALUES ('document_unshared', NEW.owner_org_id, NEW.partner_org_id, auth.uid(), 'document', NEW.document_id, '{}'::jsonb);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_audit_docshare ON public.document_shares;
CREATE TRIGGER trg_audit_docshare AFTER INSERT OR UPDATE ON public.document_shares
  FOR EACH ROW EXECUTE FUNCTION public.audit_document_share();

-- 6. Escalation function + hourly cron
CREATE OR REPLACE FUNCTION public.escalate_alerts()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _row record;
  _prefs record;
  _mgr uuid;
  _escalated int := 0;
BEGIN
  FOR _row IN
    SELECT i.id, i.organization_id, i.title, i.content, i.severity, i.escalation_level, i.metadata,
           (i.metadata->>'assignee')::uuid AS assignee
    FROM public.ai_insights i
    WHERE i.status = 'open'
      AND i.escalation_level < 3
      AND i.generated_at < now() - interval '1 hour'
  LOOP
    -- Look up assignee prefs (fallback to defaults)
    SELECT * INTO _prefs FROM public.notification_preferences WHERE user_id = _row.assignee;
    IF _prefs.escalation_after_hours IS NULL THEN _prefs.escalation_after_hours := 24; END IF;
    IF _prefs.escalate_to_manager IS NULL THEN _prefs.escalate_to_manager := true; END IF;

    -- Only escalate if enough time elapsed since last escalation (or generation)
    IF coalesce(_row.escalation_level, 0) = 0 AND
       NOT EXISTS (SELECT 1 FROM public.ai_insights WHERE id = _row.id AND generated_at < now() - make_interval(hours => _prefs.escalation_after_hours))
    THEN CONTINUE;
    END IF;
    IF _row.escalation_level >= 1 AND EXISTS (
      SELECT 1 FROM public.ai_insights WHERE id = _row.id
        AND (last_escalated_at IS NULL OR last_escalated_at > now() - make_interval(hours => _prefs.escalation_after_hours))
    ) THEN CONTINUE;
    END IF;

    IF NOT _prefs.escalate_to_manager THEN CONTINUE; END IF;

    -- Find an owner/executive in the org as the manager
    SELECT ur.user_id INTO _mgr
    FROM public.user_roles ur
    WHERE ur.organization_id = _row.organization_id
      AND ur.role IN ('owner','executive','manager')
    ORDER BY CASE ur.role WHEN 'manager' THEN 1 WHEN 'executive' THEN 2 ELSE 3 END
    LIMIT 1;

    IF _mgr IS NULL THEN CONTINUE; END IF;

    INSERT INTO public.notifications(user_id, organization_id, title, message, type, link, is_read)
    VALUES (_mgr, _row.organization_id,
      'Escalated: ' || _row.title,
      'This alert has been open past the escalation window. Please review.',
      'escalation', '/ai-insights?id=' || _row.id, false);

    UPDATE public.ai_insights
      SET escalation_level = coalesce(escalation_level, 0) + 1,
          last_escalated_at = now()
    WHERE id = _row.id;
    _escalated := _escalated + 1;
  END LOOP;
  RETURN jsonb_build_object('escalated', _escalated);
END $$;
