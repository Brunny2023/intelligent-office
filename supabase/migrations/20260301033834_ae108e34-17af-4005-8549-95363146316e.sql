
-- =============================================
-- FIX: Attach handle_new_user trigger to auth.users
-- =============================================
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- PHASE 4: Attendance & Workforce Presence System
-- =============================================

-- Attendance records for clock-in/out
CREATE TABLE public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL,
  clock_in timestamptz NOT NULL DEFAULT now(),
  clock_out timestamptz,
  status text NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'late', 'half_day')),
  ip_address text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Users can view attendance in their org
CREATE POLICY "Users can view org attendance"
  ON public.attendance_records FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()));

-- Users can insert their own attendance
CREATE POLICY "Users can clock in"
  ON public.attendance_records FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND organization_id = public.get_user_org_id(auth.uid()));

-- Users can update their own attendance (clock out)
CREATE POLICY "Users can clock out"
  ON public.attendance_records FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Leave requests
CREATE TYPE public.leave_type AS ENUM ('annual', 'sick', 'personal', 'maternity', 'paternity', 'unpaid', 'other');
CREATE TYPE public.leave_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

CREATE TABLE public.leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL,
  leave_type leave_type NOT NULL DEFAULT 'annual',
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  status leave_status NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- Users can view leave requests in their org
CREATE POLICY "Users can view org leaves"
  ON public.leave_requests FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()));

-- Users can submit their own leave requests
CREATE POLICY "Users can request leave"
  ON public.leave_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND organization_id = public.get_user_org_id(auth.uid()));

-- Users can cancel their own pending requests
CREATE POLICY "Users can cancel own leave"
  ON public.leave_requests FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status = 'pending');

-- Managers+ can review leave requests
CREATE POLICY "Managers can review leaves"
  ON public.leave_requests FOR UPDATE TO authenticated
  USING (
    organization_id = public.get_user_org_id(auth.uid())
    AND (
      public.has_role(auth.uid(), 'owner') OR
      public.has_role(auth.uid(), 'executive') OR
      public.has_role(auth.uid(), 'manager')
    )
  );

-- =============================================
-- PHASE 5: Corporate Activity Logging System
-- =============================================

CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Users can view activity in their org
CREATE POLICY "Users can view org activity"
  ON public.activity_logs FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()));

-- System/users can insert activity for their org
CREATE POLICY "Users can log activity"
  ON public.activity_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND organization_id = public.get_user_org_id(auth.uid()));

-- Create index for fast activity feed queries
CREATE INDEX idx_activity_logs_org_created ON public.activity_logs (organization_id, created_at DESC);
CREATE INDEX idx_activity_logs_user_created ON public.activity_logs (user_id, created_at DESC);
CREATE INDEX idx_attendance_user_date ON public.attendance_records (user_id, clock_in DESC);
CREATE INDEX idx_attendance_org_date ON public.attendance_records (organization_id, clock_in DESC);
