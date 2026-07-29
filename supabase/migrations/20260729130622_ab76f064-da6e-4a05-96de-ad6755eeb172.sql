-- ============ Wave 2/3 gap fix: feedback → memory learning ============
CREATE OR REPLACE FUNCTION public.cognition_feedback_learn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _req record;
  _delta numeric;
BEGIN
  SELECT * INTO _req FROM public.cognition_requests WHERE id = NEW.request_id;
  IF _req IS NULL THEN RETURN NEW; END IF;

  _delta := CASE NEW.outcome
    WHEN 'approved' THEN 0.5
    WHEN 'revised'  THEN -0.15
    WHEN 'rejected' THEN -0.5
    ELSE 0
  END;

  IF _delta <> 0 THEN
    UPDATE public.organizational_memory
      SET relevance_score = GREATEST(0.1, LEAST(10, relevance_score + _delta)),
          last_referenced_at = now()
      WHERE organization_id = _req.organization_id
        AND source_request_id = NEW.request_id;
  END IF;

  IF NEW.comment IS NOT NULL AND length(btrim(NEW.comment)) > 0 THEN
    INSERT INTO public.organizational_memory(
      organization_id, memory_type, title, content, tags, source_request_id, created_by, relevance_score
    ) VALUES (
      _req.organization_id,
      'feedback',
      concat(initcap(NEW.outcome), ' — ', left(coalesce(_req.intent, _req.request), 80)),
      NEW.comment,
      ARRAY['feedback', NEW.outcome]::text[],
      NEW.request_id,
      NEW.user_id,
      CASE NEW.outcome WHEN 'approved' THEN 2.0 WHEN 'rejected' THEN 2.5 ELSE 1.5 END
    );
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS cognition_feedback_learn_trg ON public.cognition_feedback;
CREATE TRIGGER cognition_feedback_learn_trg
  AFTER INSERT ON public.cognition_feedback
  FOR EACH ROW EXECUTE FUNCTION public.cognition_feedback_learn();

-- ============ Wave 4: Governance & Explainability ============
CREATE TABLE IF NOT EXISTS public.cognition_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  rule TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'advisory',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cognition_policies TO authenticated;
GRANT ALL ON public.cognition_policies TO service_role;

ALTER TABLE public.cognition_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view org policies" ON public.cognition_policies
  FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()));

CREATE POLICY "Leaders manage org policies" ON public.cognition_policies
  FOR ALL TO authenticated
  USING (
    organization_id = public.get_user_org_id(auth.uid())
    AND (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'executive') OR public.has_role(auth.uid(),'manager'))
  )
  WITH CHECK (
    organization_id = public.get_user_org_id(auth.uid())
    AND (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'executive') OR public.has_role(auth.uid(),'manager'))
  );

CREATE INDEX IF NOT EXISTS idx_cognition_policies_org ON public.cognition_policies(organization_id, is_active);

CREATE TRIGGER cognition_policies_touch
  BEFORE UPDATE ON public.cognition_policies
  FOR EACH ROW EXECUTE FUNCTION public.graph_touch_updated_at();

-- Governance scorecard: aggregate risk/compliance across recent deliberations
CREATE OR REPLACE FUNCTION public.cognition_governance_scorecard(_org uuid, _days int DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _total int; _approved int; _revised int; _rejected int;
  _avg_latency numeric; _policies_active int; _memories int;
  _high_risk int; _compliance_flags int;
BEGIN
  IF _org <> public.get_user_org_id(auth.uid()) AND NOT public.is_platform_admin(auth.uid()) THEN
    RETURN jsonb_build_object('error','forbidden');
  END IF;

  SELECT count(*) INTO _total FROM public.cognition_requests
    WHERE organization_id = _org AND created_at > now() - make_interval(days => _days);
  SELECT count(*) FILTER (WHERE outcome='approved'),
         count(*) FILTER (WHERE outcome='revised'),
         count(*) FILTER (WHERE outcome='rejected')
    INTO _approved, _revised, _rejected
    FROM public.cognition_feedback
    WHERE organization_id = _org AND created_at > now() - make_interval(days => _days);
  SELECT coalesce(avg(latency_ms),0) INTO _avg_latency FROM public.cognition_requests
    WHERE organization_id = _org AND status='completed' AND created_at > now() - make_interval(days => _days);
  SELECT count(*) INTO _policies_active FROM public.cognition_policies
    WHERE organization_id = _org AND is_active = true;
  SELECT count(*) INTO _memories FROM public.organizational_memory
    WHERE organization_id = _org;
  SELECT count(*) INTO _high_risk FROM public.cognition_requests
    WHERE organization_id = _org AND created_at > now() - make_interval(days => _days)
      AND outcome->>'risk' ~* '(high|critical|severe|urgent)';
  SELECT count(*) INTO _compliance_flags FROM public.cognition_requests
    WHERE organization_id = _org AND created_at > now() - make_interval(days => _days)
      AND outcome->>'compliance' IS NOT NULL
      AND outcome->>'compliance' !~* '^no specific';

  RETURN jsonb_build_object(
    'window_days', _days,
    'deliberations_total', _total,
    'feedback_approved', _approved,
    'feedback_revised', _revised,
    'feedback_rejected', _rejected,
    'approval_rate', CASE WHEN (_approved+_revised+_rejected) > 0
      THEN round((_approved::numeric / (_approved+_revised+_rejected)) * 100, 1) ELSE NULL END,
    'avg_latency_ms', round(_avg_latency),
    'active_policies', _policies_active,
    'memory_entries', _memories,
    'high_risk_decisions', _high_risk,
    'compliance_flags', _compliance_flags
  );
END $$;