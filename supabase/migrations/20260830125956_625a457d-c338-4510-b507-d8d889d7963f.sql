SELECT cron.alter_job(
  (SELECT jobid FROM cron.job WHERE jobname = 'escalate-alerts-hourly'),
  command := 'SELECT public.escalate_alerts();'
);