-- 1) Per-tenant egress toggle
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS egress_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS egress_mode text NOT NULL DEFAULT 'audio_video';

-- 2) Egress tracking on recordings
ALTER TABLE public.meeting_recordings
  ADD COLUMN IF NOT EXISTS egress_id text,
  ADD COLUMN IF NOT EXISTS egress_status text,
  ADD COLUMN IF NOT EXISTS egress_error text,
  ADD COLUMN IF NOT EXISTS egress_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS egress_ended_at timestamptz,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'client';

CREATE INDEX IF NOT EXISTS idx_meeting_recordings_egress_id ON public.meeting_recordings(egress_id) WHERE egress_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_meeting_recordings_egress_status ON public.meeting_recordings(egress_status) WHERE egress_status IS NOT NULL;

-- 3) Egress health events log (audit + alerting source)
CREATE TABLE IF NOT EXISTS public.egress_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  recording_id uuid REFERENCES public.meeting_recordings(id) ON DELETE SET NULL,
  egress_id text,
  event_type text NOT NULL,
  status text,
  error text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.egress_events TO authenticated;
GRANT ALL ON public.egress_events TO service_role;

ALTER TABLE public.egress_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members read egress events"
  ON public.egress_events FOR SELECT
  TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_egress_events_org ON public.egress_events(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_egress_events_egress_id ON public.egress_events(egress_id);

-- 4) Detect stuck egress jobs and raise ai_insights alerts
CREATE OR REPLACE FUNCTION public.detect_stuck_egress()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _stuck record;
  _alerts int := 0;
BEGIN
  FOR _stuck IN
    SELECT r.id, r.organization_id, r.egress_id, r.egress_started_at, r.egress_status
    FROM public.meeting_recordings r
    WHERE r.source = 'egress'
      AND r.egress_status IN ('starting', 'active')
      AND r.egress_started_at < now() - interval '2 hours'
      AND NOT EXISTS (
        SELECT 1 FROM public.ai_insights ai
        WHERE ai.organization_id = r.organization_id
          AND ai.insight_type = 'egress_stuck'
          AND ai.metadata->>'recording_id' = r.id::text
          AND ai.status = 'open'
      )
  LOOP
    INSERT INTO public.ai_insights(
      organization_id, insight_type, title, content, severity, status, metadata, reason
    ) VALUES (
      _stuck.organization_id,
      'egress_stuck',
      'Meeting recording appears stuck',
      'A server-side recording has been in "' || _stuck.egress_status || '" state for over 2 hours. It may have failed silently. Please review.',
      'high',
      'open',
      jsonb_build_object(
        'recording_id', _stuck.id,
        'egress_id', _stuck.egress_id,
        'started_at', _stuck.egress_started_at
      ),
      jsonb_build_object(
        'signals', jsonb_build_array(
          jsonb_build_object('type', 'egress_duration', 'value', extract(epoch from (now() - _stuck.egress_started_at))),
          jsonb_build_object('type', 'egress_status', 'value', _stuck.egress_status)
        )
      )
    );
    _alerts := _alerts + 1;
  END LOOP;
  RETURN jsonb_build_object('stuck_alerts_created', _alerts);
END;
$$;

-- 5) Schedule the monitor every 15 minutes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('detect-stuck-egress') WHERE EXISTS (
      SELECT 1 FROM cron.job WHERE jobname = 'detect-stuck-egress'
    );
    PERFORM cron.schedule('detect-stuck-egress', '*/15 * * * *', $CRON$SELECT public.detect_stuck_egress();$CRON$);
  END IF;
END $$;