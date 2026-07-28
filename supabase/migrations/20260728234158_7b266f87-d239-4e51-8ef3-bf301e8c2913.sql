CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'end_stale_meeting_rooms_every_15m') THEN
    PERFORM cron.unschedule('end_stale_meeting_rooms_every_15m');
  END IF;
END $$;

SELECT cron.schedule(
  'end_stale_meeting_rooms_every_15m',
  '*/15 * * * *',
  $$SELECT public.end_stale_meeting_rooms();$$
);