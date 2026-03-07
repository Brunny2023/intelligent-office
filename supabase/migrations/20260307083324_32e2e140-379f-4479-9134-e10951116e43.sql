
-- Phase 13: Workflow Automation Engine
CREATE TABLE public.workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  name text NOT NULL,
  description text,
  trigger_type text NOT NULL DEFAULT 'manual',
  trigger_config jsonb DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.workflow_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  step_order integer NOT NULL DEFAULT 0,
  action_type text NOT NULL DEFAULT 'approval',
  action_config jsonb DEFAULT '{}'::jsonb,
  assignee_id uuid,
  timeout_hours integer DEFAULT 24,
  escalation_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.workflow_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES public.workflows(id),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  current_step integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  trigger_data jsonb DEFAULT '{}'::jsonb,
  started_by uuid NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE public.workflow_step_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES public.workflow_instances(id) ON DELETE CASCADE,
  step_order integer NOT NULL,
  action text NOT NULL,
  performed_by uuid NOT NULL,
  notes text,
  performed_at timestamptz NOT NULL DEFAULT now()
);

-- Team Invitations
CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  email text NOT NULL,
  role public.app_role NOT NULL DEFAULT 'staff',
  department_id uuid REFERENCES public.departments(id),
  job_title text,
  invited_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  token uuid NOT NULL DEFAULT gen_random_uuid(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, email)
);

-- RLS for workflows
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_step_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Workflow policies
CREATE POLICY "View org workflows" ON public.workflows FOR SELECT
  USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "Manage workflows" ON public.workflows FOR ALL
  USING (organization_id = get_user_org_id(auth.uid()) AND (
    has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'executive') OR has_role(auth.uid(), 'manager')
  ));

CREATE POLICY "View workflow steps" ON public.workflow_steps FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.workflows w WHERE w.id = workflow_steps.workflow_id AND w.organization_id = get_user_org_id(auth.uid())));

CREATE POLICY "Manage workflow steps" ON public.workflow_steps FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workflows w WHERE w.id = workflow_steps.workflow_id AND w.organization_id = get_user_org_id(auth.uid()) AND (
    has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'executive') OR has_role(auth.uid(), 'manager')
  )));

CREATE POLICY "View org instances" ON public.workflow_instances FOR SELECT
  USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "Start workflow" ON public.workflow_instances FOR INSERT
  WITH CHECK (organization_id = get_user_org_id(auth.uid()) AND started_by = auth.uid());

CREATE POLICY "Update instance" ON public.workflow_instances FOR UPDATE
  USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "View step logs" ON public.workflow_step_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.workflow_instances wi WHERE wi.id = workflow_step_logs.instance_id AND wi.organization_id = get_user_org_id(auth.uid())));

CREATE POLICY "Add step logs" ON public.workflow_step_logs FOR INSERT
  WITH CHECK (performed_by = auth.uid() AND EXISTS (SELECT 1 FROM public.workflow_instances wi WHERE wi.id = workflow_step_logs.instance_id AND wi.organization_id = get_user_org_id(auth.uid())));

-- Invitation policies
CREATE POLICY "View org invitations" ON public.invitations FOR SELECT
  USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "Create invitations" ON public.invitations FOR INSERT
  WITH CHECK (organization_id = get_user_org_id(auth.uid()) AND invited_by = auth.uid() AND (
    has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'executive') OR has_role(auth.uid(), 'manager')
  ));

CREATE POLICY "Update invitations" ON public.invitations FOR UPDATE
  USING (organization_id = get_user_org_id(auth.uid()) AND (
    has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'executive') OR has_role(auth.uid(), 'manager')
  ));

CREATE POLICY "Delete invitations" ON public.invitations FOR DELETE
  USING (organization_id = get_user_org_id(auth.uid()) AND (
    has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'executive')
  ));

-- Function to accept invitation by token
CREATE OR REPLACE FUNCTION public.accept_invitation(_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _inv record;
  _user_id uuid;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  SELECT * INTO _inv FROM public.invitations
    WHERE token = _token AND status = 'pending' AND expires_at > now();

  IF _inv IS NULL THEN
    RETURN jsonb_build_object('error', 'Invalid or expired invitation');
  END IF;

  -- Update profile
  UPDATE public.profiles SET
    organization_id = _inv.organization_id,
    department_id = _inv.department_id,
    job_title = _inv.job_title
  WHERE id = _user_id;

  -- Assign role
  INSERT INTO public.user_roles (user_id, organization_id, role)
    VALUES (_user_id, _inv.organization_id, _inv.role)
    ON CONFLICT (user_id, organization_id) DO UPDATE SET role = EXCLUDED.role;

  -- Mark accepted
  UPDATE public.invitations SET status = 'accepted', accepted_at = now() WHERE id = _inv.id;

  RETURN jsonb_build_object('success', true, 'organization_id', _inv.organization_id);
END;
$$;
