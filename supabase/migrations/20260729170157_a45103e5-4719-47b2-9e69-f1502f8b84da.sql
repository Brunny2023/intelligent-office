
-- 1) Memory feedback audit trail
CREATE TABLE public.memory_feedback_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  memory_id UUID,
  user_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('boost','dampen','approve','reject','comment','delete')),
  reason TEXT,
  prev_score NUMERIC,
  new_score NUMERIC,
  memory_title TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.memory_feedback_events TO authenticated;
GRANT ALL ON public.memory_feedback_events TO service_role;

ALTER TABLE public.memory_feedback_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can view memory feedback events"
  ON public.memory_feedback_events FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()));

CREATE POLICY "org members can add memory feedback events"
  ON public.memory_feedback_events FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id(auth.uid()) AND user_id = auth.uid());

CREATE INDEX idx_memory_feedback_org_created ON public.memory_feedback_events(organization_id, created_at DESC);
CREATE INDEX idx_memory_feedback_memory ON public.memory_feedback_events(memory_id);

-- 2) Notifications archive
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_notifications_user_archived
  ON public.notifications(user_id, archived_at);

-- 3) Per-event snoozes on notification preferences
ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS snoozes JSONB NOT NULL DEFAULT '{}'::jsonb;
