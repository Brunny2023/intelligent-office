
-- Phase 14: Compliance settings table
CREATE TABLE public.compliance_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE,
  gdpr_enabled boolean DEFAULT false,
  ndpr_enabled boolean DEFAULT false,
  data_retention_days integer DEFAULT 365,
  audit_log_enabled boolean DEFAULT true,
  ip_restriction_enabled boolean DEFAULT false,
  allowed_ips text[] DEFAULT '{}',
  mfa_required boolean DEFAULT false,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.compliance_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View compliance settings" ON public.compliance_settings
  FOR SELECT USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "Manage compliance settings" ON public.compliance_settings
  FOR ALL USING (
    organization_id = get_user_org_id(auth.uid())
    AND (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'executive'))
  );

-- Organization branding columns
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS mission text;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS core_values text[] DEFAULT '{}';
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS brand_tagline text;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS favicon_url text;

-- Job Planning System
CREATE TABLE public.job_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  category text DEFAULT 'general',
  status text DEFAULT 'active',
  start_date date,
  end_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.job_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View org job plans" ON public.job_plans
  FOR SELECT USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "Create own job plans" ON public.job_plans
  FOR INSERT WITH CHECK (
    organization_id = get_user_org_id(auth.uid())
    AND user_id = auth.uid()
  );

CREATE POLICY "Update own or manage job plans" ON public.job_plans
  FOR UPDATE USING (
    organization_id = get_user_org_id(auth.uid())
    AND (user_id = auth.uid() OR has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'))
  );

CREATE POLICY "Delete own job plans" ON public.job_plans
  FOR DELETE USING (
    user_id = auth.uid()
    OR has_role(auth.uid(), 'owner')
    OR has_role(auth.uid(), 'manager')
  );

CREATE TABLE public.job_plan_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_plan_id uuid NOT NULL REFERENCES public.job_plans(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  period_type text NOT NULL,
  title text NOT NULL,
  target_value numeric DEFAULT 0,
  current_value numeric DEFAULT 0,
  unit text DEFAULT '%',
  due_date date,
  status text DEFAULT 'pending',
  notes text,
  reminder_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.job_plan_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View org targets" ON public.job_plan_targets
  FOR SELECT USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "Create targets" ON public.job_plan_targets
  FOR INSERT WITH CHECK (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "Update targets" ON public.job_plan_targets
  FOR UPDATE USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "Delete targets" ON public.job_plan_targets
  FOR DELETE USING (organization_id = get_user_org_id(auth.uid()));
