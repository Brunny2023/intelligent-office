DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cognition-proactive-scan') THEN
    PERFORM cron.unschedule('cognition-proactive-scan');
  END IF;
  PERFORM cron.schedule(
    'cognition-proactive-scan',
    '0 */6 * * *',
    $cron$
    SELECT net.http_post(
      url := 'https://sydqmpordfbtjmxuxjkc.supabase.co/functions/v1/cognition-proactive',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Automation-Context', 'cron',
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key')
      ),
      body := '{}'::jsonb
    );
    $cron$
  );
END $$;