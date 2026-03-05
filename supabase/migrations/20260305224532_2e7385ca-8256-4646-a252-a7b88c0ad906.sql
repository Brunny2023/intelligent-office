
-- ============================================
-- FIX: Attach handle_new_user trigger (if missing)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END$$;

-- ============================================
-- FIX: Channels RLS policy bug (cm.channel_id = cm.id should be cm.channel_id = channels.id)
-- ============================================
DROP POLICY IF EXISTS "View channels" ON public.channels;
CREATE POLICY "View channels" ON public.channels
  FOR SELECT TO authenticated
  USING (
    (organization_id = get_user_org_id(auth.uid()))
    AND (
      channel_type = 'public'::channel_type
      OR EXISTS (
        SELECT 1 FROM channel_members cm
        WHERE cm.channel_id = channels.id AND cm.user_id = auth.uid()
      )
    )
  );

-- FIX: Messages RLS policy bug
DROP POLICY IF EXISTS "View messages" ON public.messages;
CREATE POLICY "View messages" ON public.messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM channel_members cm
      WHERE cm.channel_id = messages.channel_id AND cm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Send messages" ON public.messages;
CREATE POLICY "Send messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM channel_members cm
      WHERE cm.channel_id = messages.channel_id AND cm.user_id = auth.uid()
    )
  );

-- ============================================
-- PHASE 8: Documents & Knowledge Management
-- ============================================
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  department_id UUID REFERENCES public.departments(id),
  uploaded_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT DEFAULT 0,
  file_type TEXT,
  category TEXT DEFAULT 'general',
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active',
  tags TEXT[] DEFAULT '{}',
  project_id UUID REFERENCES public.projects(id),
  task_id UUID REFERENCES public.tasks(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View org documents" ON public.documents
  FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "Upload documents" ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = get_user_org_id(auth.uid())
    AND uploaded_by = auth.uid()
  );

CREATE POLICY "Update own documents" ON public.documents
  FOR UPDATE TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR has_role(auth.uid(), 'owner'::app_role)
    OR has_role(auth.uid(), 'manager'::app_role)
  );

CREATE INDEX idx_documents_org ON public.documents(organization_id);
CREATE INDEX idx_documents_dept ON public.documents(department_id);

-- ============================================
-- PHASE 9: KPI & Performance Intelligence
-- ============================================
CREATE TABLE IF NOT EXISTS public.performance_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  user_id UUID NOT NULL,
  reviewer_id UUID NOT NULL,
  review_period_start DATE NOT NULL,
  review_period_end DATE NOT NULL,
  overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
  task_completion_rate NUMERIC(5,2) DEFAULT 0,
  attendance_rate NUMERIC(5,2) DEFAULT 0,
  communication_score INTEGER CHECK (communication_score BETWEEN 1 AND 5),
  quality_score INTEGER CHECK (quality_score BETWEEN 1 AND 5),
  strengths TEXT,
  improvements TEXT,
  comments TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own reviews" ON public.performance_reviews
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR reviewer_id = auth.uid()
    OR has_role(auth.uid(), 'owner'::app_role)
    OR has_role(auth.uid(), 'executive'::app_role)
    OR has_role(auth.uid(), 'manager'::app_role)
  );

CREATE POLICY "Create reviews" ON public.performance_reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = get_user_org_id(auth.uid())
    AND reviewer_id = auth.uid()
    AND (
      has_role(auth.uid(), 'owner'::app_role)
      OR has_role(auth.uid(), 'executive'::app_role)
      OR has_role(auth.uid(), 'manager'::app_role)
    )
  );

CREATE POLICY "Update own reviews" ON public.performance_reviews
  FOR UPDATE TO authenticated
  USING (reviewer_id = auth.uid());

CREATE INDEX idx_perf_reviews_user ON public.performance_reviews(user_id);
CREATE INDEX idx_perf_reviews_org ON public.performance_reviews(organization_id);

-- Company/Department KPIs
CREATE TABLE IF NOT EXISTS public.kpis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  department_id UUID REFERENCES public.departments(id),
  title TEXT NOT NULL,
  description TEXT,
  target_value NUMERIC DEFAULT 0,
  current_value NUMERIC DEFAULT 0,
  unit TEXT DEFAULT '%',
  category TEXT DEFAULT 'general',
  period_start DATE,
  period_end DATE,
  owner_id UUID,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.kpis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View org kpis" ON public.kpis
  FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "Manage kpis" ON public.kpis
  FOR ALL TO authenticated
  USING (
    organization_id = get_user_org_id(auth.uid())
    AND (
      has_role(auth.uid(), 'owner'::app_role)
      OR has_role(auth.uid(), 'executive'::app_role)
      OR has_role(auth.uid(), 'manager'::app_role)
    )
  );

CREATE INDEX idx_kpis_org ON public.kpis(organization_id);

-- ============================================
-- HR MODULE: Recruitment & Onboarding
-- ============================================
CREATE TABLE IF NOT EXISTS public.job_postings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  department_id UUID REFERENCES public.departments(id),
  title TEXT NOT NULL,
  description TEXT,
  requirements TEXT,
  employment_type TEXT DEFAULT 'full-time',
  location TEXT DEFAULT 'remote',
  salary_range TEXT,
  status TEXT DEFAULT 'open',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View org job postings" ON public.job_postings
  FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "HR manage postings" ON public.job_postings
  FOR ALL TO authenticated
  USING (
    organization_id = get_user_org_id(auth.uid())
    AND (
      has_role(auth.uid(), 'owner'::app_role)
      OR has_role(auth.uid(), 'executive'::app_role)
      OR has_role(auth.uid(), 'manager'::app_role)
    )
  );

CREATE TABLE IF NOT EXISTS public.candidates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  job_posting_id UUID REFERENCES public.job_postings(id),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  resume_url TEXT,
  cover_letter TEXT,
  stage TEXT DEFAULT 'applied',
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View org candidates" ON public.candidates
  FOR SELECT TO authenticated
  USING (
    organization_id = get_user_org_id(auth.uid())
    AND (
      has_role(auth.uid(), 'owner'::app_role)
      OR has_role(auth.uid(), 'executive'::app_role)
      OR has_role(auth.uid(), 'manager'::app_role)
    )
  );

CREATE POLICY "Manage candidates" ON public.candidates
  FOR ALL TO authenticated
  USING (
    organization_id = get_user_org_id(auth.uid())
    AND (
      has_role(auth.uid(), 'owner'::app_role)
      OR has_role(auth.uid(), 'executive'::app_role)
      OR has_role(auth.uid(), 'manager'::app_role)
    )
  );

-- Staff termination / offboarding
CREATE TABLE IF NOT EXISTS public.terminations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  user_id UUID NOT NULL,
  terminated_by UUID NOT NULL,
  termination_type TEXT DEFAULT 'voluntary',
  reason TEXT,
  last_working_day DATE,
  exit_interview_notes TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.terminations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View terminations" ON public.terminations
  FOR SELECT TO authenticated
  USING (
    organization_id = get_user_org_id(auth.uid())
    AND (
      user_id = auth.uid()
      OR has_role(auth.uid(), 'owner'::app_role)
      OR has_role(auth.uid(), 'executive'::app_role)
      OR has_role(auth.uid(), 'manager'::app_role)
    )
  );

CREATE POLICY "Manage terminations" ON public.terminations
  FOR ALL TO authenticated
  USING (
    organization_id = get_user_org_id(auth.uid())
    AND (
      has_role(auth.uid(), 'owner'::app_role)
      OR has_role(auth.uid(), 'executive'::app_role)
      OR has_role(auth.uid(), 'manager'::app_role)
    )
  );

-- ============================================
-- FINANCE MODULE: Payroll & Expense Reports
-- ============================================
CREATE TABLE IF NOT EXISTS public.payroll_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  user_id UUID NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  base_salary NUMERIC(12,2) DEFAULT 0,
  bonuses NUMERIC(12,2) DEFAULT 0,
  deductions NUMERIC(12,2) DEFAULT 0,
  net_pay NUMERIC(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'draft',
  approved_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own payroll" ON public.payroll_records
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (
      organization_id = get_user_org_id(auth.uid())
      AND (
        has_role(auth.uid(), 'owner'::app_role)
        OR has_role(auth.uid(), 'executive'::app_role)
        OR has_role(auth.uid(), 'manager'::app_role)
      )
    )
  );

CREATE POLICY "Manage payroll" ON public.payroll_records
  FOR ALL TO authenticated
  USING (
    organization_id = get_user_org_id(auth.uid())
    AND (
      has_role(auth.uid(), 'owner'::app_role)
      OR has_role(auth.uid(), 'executive'::app_role)
    )
  );

CREATE TABLE IF NOT EXISTS public.expense_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  submitted_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  category TEXT DEFAULT 'general',
  receipt_url TEXT,
  status TEXT DEFAULT 'pending',
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.expense_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own expenses" ON public.expense_reports
  FOR SELECT TO authenticated
  USING (
    submitted_by = auth.uid()
    OR (
      organization_id = get_user_org_id(auth.uid())
      AND (
        has_role(auth.uid(), 'owner'::app_role)
        OR has_role(auth.uid(), 'executive'::app_role)
        OR has_role(auth.uid(), 'manager'::app_role)
      )
    )
  );

CREATE POLICY "Submit expenses" ON public.expense_reports
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = get_user_org_id(auth.uid())
    AND submitted_by = auth.uid()
  );

CREATE POLICY "Approve expenses" ON public.expense_reports
  FOR UPDATE TO authenticated
  USING (
    organization_id = get_user_org_id(auth.uid())
    AND (
      has_role(auth.uid(), 'owner'::app_role)
      OR has_role(auth.uid(), 'executive'::app_role)
      OR has_role(auth.uid(), 'manager'::app_role)
    )
  );

-- Indexes
CREATE INDEX idx_payroll_org ON public.payroll_records(organization_id);
CREATE INDEX idx_payroll_user ON public.payroll_records(user_id);
CREATE INDEX idx_expenses_org ON public.expense_reports(organization_id);
CREATE INDEX idx_candidates_org ON public.candidates(organization_id);
CREATE INDEX idx_terminations_org ON public.terminations(organization_id);
CREATE INDEX idx_job_postings_org ON public.job_postings(organization_id);
