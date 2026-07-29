ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS event_prefs jsonb NOT NULL DEFAULT jsonb_build_object(
    'cognition_finished', jsonb_build_object('in_app', true, 'realtime', true),
    'policy_blocked',     jsonb_build_object('in_app', true, 'realtime', true),
    'insight_escalation', jsonb_build_object('in_app', true, 'realtime', true)
  );