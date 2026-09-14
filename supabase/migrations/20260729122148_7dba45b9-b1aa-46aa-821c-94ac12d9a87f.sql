-- 1. Enrich organizational_memory
ALTER TABLE public.organizational_memory
  ADD COLUMN IF NOT EXISTS relevance_score numeric NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_referenced_at timestamptz,
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION public.organizational_memory_search_vector()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.content,'')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(NEW.tags,' '),'')), 'C');
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_org_memory_search_vector ON public.organizational_memory;
CREATE TRIGGER trg_org_memory_search_vector
  BEFORE INSERT OR UPDATE ON public.organizational_memory
  FOR EACH ROW EXECUTE FUNCTION public.organizational_memory_search_vector();

UPDATE public.organizational_memory
  SET search_vector =
    setweight(to_tsvector('english', coalesce(title,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(content,'')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(tags,' '),'')), 'C')
  WHERE search_vector IS NULL;

CREATE INDEX IF NOT EXISTS organizational_memory_search_idx
  ON public.organizational_memory USING GIN (search_vector);

-- 2. Retrieval helper
CREATE OR REPLACE FUNCTION public.search_memory(_org uuid, _query text, _limit int DEFAULT 8)
RETURNS TABLE(id uuid, memory_type text, title text, content text, tags text[], rank real, relevance_score numeric, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.id, m.memory_type, m.title, m.content, m.tags,
    ts_rank(m.search_vector, plainto_tsquery('english', _query))::real AS rank,
    m.relevance_score, m.created_at
  FROM public.organizational_memory m
  WHERE m.organization_id = _org
    AND (
      _query IS NULL OR _query = ''
      OR m.search_vector @@ plainto_tsquery('english', _query)
    )
  ORDER BY (ts_rank(m.search_vector, plainto_tsquery('english', coalesce(_query,''))) * m.relevance_score) DESC,
           m.created_at DESC
  LIMIT _limit;
$$;

GRANT EXECUTE ON FUNCTION public.search_memory(uuid, text, int) TO authenticated, service_role;

-- 3. Bump relevance when memory is referenced
CREATE OR REPLACE FUNCTION public.touch_memory(_memory_ids uuid[])
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.organizational_memory
    SET relevance_score = least(relevance_score + 0.1, 10),
        last_referenced_at = now()
    WHERE id = ANY(_memory_ids);
$$;
GRANT EXECUTE ON FUNCTION public.touch_memory(uuid[]) TO authenticated, service_role;

-- 4. Nightly learning cron — invokes edge function per org
CREATE OR REPLACE FUNCTION public.cognition_learn_dispatch()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://sydqmpordfbtjmxuxjkc.supabase.co/functions/v1/cognition-learn',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Automation-Context', 'cron',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key'
      )
    ),
    body := '{}'::jsonb
  );
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'cognition_learn_dispatch failed: %', SQLERRM;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cognition-learn-nightly') THEN
    PERFORM cron.unschedule('cognition-learn-nightly');
  END IF;
  PERFORM cron.schedule('cognition-learn-nightly', '15 3 * * *', $cron$ SELECT public.cognition_learn_dispatch(); $cron$);
END $$;