-- Run this script with a privileged database connection after migrations deploy.
-- It is intentionally read-only: it validates the production wiring but changes nothing.
DO $$
DECLARE
  job_command text;
BEGIN
  SELECT command
    INTO job_command
    FROM cron.job
   WHERE jobname = 'escalate-alerts-hourly';

  IF job_command IS NULL THEN
    RAISE EXCEPTION 'Missing cron job: escalate-alerts-hourly';
  END IF;

  IF position('SELECT public.escalate_alerts();' IN job_command) = 0 THEN
    RAISE EXCEPTION 'Unexpected escalation cron command: %', job_command;
  END IF;

  IF NOT has_function_privilege('postgres', 'public.escalate_alerts()', 'EXECUTE') THEN
    RAISE EXCEPTION 'postgres lacks EXECUTE on public.escalate_alerts()';
  END IF;
END $$;

SELECT
  jobname,
  schedule,
  command,
  active
FROM cron.job
WHERE jobname = 'escalate-alerts-hourly';
