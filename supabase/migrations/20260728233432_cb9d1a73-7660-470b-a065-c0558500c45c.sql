
-- Single active room per (org, room_name)
CREATE UNIQUE INDEX IF NOT EXISTS meeting_rooms_active_unique
  ON public.meeting_rooms(organization_id, room_name)
  WHERE status = 'active';

-- Duration & analytics columns
ALTER TABLE public.meeting_rooms
  ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS peak_participants INTEGER NOT NULL DEFAULT 1;

-- Helper: end stale rooms (>4h with no active participant)
CREATE OR REPLACE FUNCTION public.end_stale_meeting_rooms()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _n INTEGER;
BEGIN
  WITH updated AS (
    UPDATE public.meeting_rooms r
      SET status = 'ended',
          ended_at = now(),
          duration_seconds = EXTRACT(EPOCH FROM (now() - r.started_at))::int
    WHERE r.status = 'active'
      AND r.started_at < now() - interval '4 hours'
      AND NOT EXISTS (
        SELECT 1 FROM public.meeting_participants p
        WHERE p.room_id = r.id AND p.left_at IS NULL
      )
    RETURNING 1
  )
  SELECT count(*) INTO _n FROM updated;
  RETURN _n;
END $$;
