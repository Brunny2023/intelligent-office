
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS cognition_request_id uuid REFERENCES public.cognition_requests(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.ai_departments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS tasks_cognition_request_id_idx ON public.tasks(cognition_request_id);
CREATE INDEX IF NOT EXISTS tasks_department_id_idx ON public.tasks(department_id);

CREATE TABLE IF NOT EXISTS public.cognition_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  request_id uuid NOT NULL REFERENCES public.cognition_requests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  outcome text NOT NULL CHECK (outcome IN ('approved','revised','rejected')),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.cognition_feedback TO authenticated;
GRANT ALL ON public.cognition_feedback TO service_role;

ALTER TABLE public.cognition_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cognition_feedback_org_select" ON public.cognition_feedback
  FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()));

CREATE POLICY "cognition_feedback_insert_self" ON public.cognition_feedback
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id(auth.uid()) AND user_id = auth.uid());

CREATE INDEX IF NOT EXISTS cognition_feedback_request_idx ON public.cognition_feedback(request_id);
CREATE INDEX IF NOT EXISTS cognition_feedback_org_idx ON public.cognition_feedback(organization_id);
