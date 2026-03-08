
-- Support tickets table
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  created_by uuid NOT NULL,
  subject text NOT NULL,
  description text NOT NULL,
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  assigned_to uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Everyone in org can view their own tickets; admins see all
CREATE POLICY "View own tickets" ON public.support_tickets
  FOR SELECT USING (
    created_by = auth.uid() OR
    (organization_id = get_user_org_id(auth.uid()) AND (
      has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'executive') OR has_role(auth.uid(), 'manager')
    ))
  );

CREATE POLICY "Create tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (
    created_by = auth.uid() AND organization_id = get_user_org_id(auth.uid())
  );

CREATE POLICY "Update tickets" ON public.support_tickets
  FOR UPDATE USING (
    created_by = auth.uid() OR
    (organization_id = get_user_org_id(auth.uid()) AND (
      has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'executive') OR has_role(auth.uid(), 'manager')
    ))
  );

-- Ticket replies
CREATE TABLE public.ticket_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  is_admin_reply boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ticket_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View ticket replies" ON public.ticket_replies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_replies.ticket_id AND (
        t.created_by = auth.uid() OR
        (t.organization_id = get_user_org_id(auth.uid()) AND (
          has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'executive') OR has_role(auth.uid(), 'manager')
        ))
      )
    )
  );

CREATE POLICY "Add ticket replies" ON public.ticket_replies
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_replies.ticket_id AND (
        t.created_by = auth.uid() OR
        (t.organization_id = get_user_org_id(auth.uid()) AND (
          has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'executive') OR has_role(auth.uid(), 'manager')
        ))
      )
    )
  );

-- Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Create notifications" ON public.notifications
  FOR INSERT WITH CHECK (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "Update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Delete own notifications" ON public.notifications
  FOR DELETE USING (user_id = auth.uid());

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_replies;
