-- 1) Track follow-up dispatches on the deliberation itself
ALTER TABLE public.cognition_requests
  ADD COLUMN IF NOT EXISTS last_followup_at timestamptz,
  ADD COLUMN IF NOT EXISTS followup_level integer NOT NULL DEFAULT 0;

-- 2) Per-user threshold for cognition follow-ups (reuses existing table)
ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS cognition_followup_after_hours integer NOT NULL DEFAULT 24,
  ADD COLUMN IF NOT EXISTS cognition_followup_max_level integer NOT NULL DEFAULT 3;

-- 3) The SLA follow-up scanner
CREATE OR REPLACE FUNCTION public.cognition_sla_followups()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _r record;
  _prefs record;
  _hours int;
  _max_level int;
  _threshold timestamptz;
  _last timestamptz;
  _count int := 0;
  _needs_review boolean;
BEGIN
  FOR _r IN
    SELECT id, organization_id, requested_by, request, intent, outcome, completed_at,
           last_followup_at, followup_level
    FROM public.cognition_requests
    WHERE status = 'completed'
      AND completed_at IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.cognition_feedback f WHERE f.request_id = cognition_requests.id
      )
  LOOP
    -- Only escalate deliberations that actually need leadership review: policy block,
    -- explicit risk/compliance flag, or an execution plan awaiting sign-off.
    _needs_review := (
      (_r.outcome ? 'blocked_by_policy') OR
      (coalesce(_r.outcome->>'risk','') ~* '(high|critical|severe|urgent)') OR
      (coalesce(_r.outcome->>'compliance','') !~* '^(no specific|none|n/a|)$') OR
      (_r.outcome ? 'execution_plan')
    );
    IF NOT _needs_review THEN CONTINUE; END IF;

    SELECT * INTO _prefs FROM public.notification_preferences WHERE user_id = _r.requested_by;
    _hours := coalesce(_prefs.cognition_followup_after_hours, 24);
    _max_level := coalesce(_prefs.cognition_followup_max_level, 3);
    IF _r.followup_level >= _max_level THEN CONTINUE; END IF;

    _threshold := now() - make_interval(hours => _hours);
    _last := coalesce(_r.last_followup_at, _r.completed_at);
    IF _last > _threshold THEN CONTINUE; END IF;

    INSERT INTO public.notifications(user_id, organization_id, title, message, type, link, is_read)
    VALUES (
      _r.requested_by,
      _r.organization_id,
      CASE WHEN _r.followup_level = 0 THEN 'Awaiting your decision' ELSE 'Reminder: still awaiting decision' END,
      'A deliberation "' || left(coalesce(_r.intent, _r.request), 80) || '" has been open past its SLA. Please approve, revise, or reject.',
      'escalation',
      '/cognition?request=' || _r.id::text,
      false
    );

    UPDATE public.cognition_requests
      SET last_followup_at = now(),
          followup_level = coalesce(followup_level, 0) + 1
      WHERE id = _r.id;

    _count := _count + 1;
  END LOOP;
  RETURN jsonb_build_object('followups_sent', _count);
END;
$$;

-- 4) Schedule hourly
DO $$
BEGIN
  PERFORM cron.unschedule('cognition-sla-followups');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'cognition-sla-followups',
  '15 * * * *',
  $cron$ SELECT public.cognition_sla_followups(); $cron$
);