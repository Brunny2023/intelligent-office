
-- ============================================
-- FIX: Attach handle_new_user trigger if missing
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- ============================================
-- PHASE 6: Execution Engine
-- ============================================

-- Task status enum
CREATE TYPE public.task_status AS ENUM (
  'todo', 'in_progress', 'review', 'approved', 'completed', 'blocked'
);

-- Task priority enum
CREATE TYPE public.task_priority AS ENUM (
  'low', 'medium', 'high', 'urgent'
);

-- Projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  owner_id UUID NOT NULL,
  department_id UUID REFERENCES public.departments(id),
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org projects" ON public.projects
  FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "Users can create projects" ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id(auth.uid()) AND owner_id = auth.uid());

CREATE POLICY "Owner/managers can update projects" ON public.projects
  FOR UPDATE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()) AND (
    owner_id = auth.uid() OR
    has_role(auth.uid(), 'owner') OR
    has_role(auth.uid(), 'executive') OR
    has_role(auth.uid(), 'manager')
  ));

-- Tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status public.task_status NOT NULL DEFAULT 'todo',
  priority public.task_priority NOT NULL DEFAULT 'medium',
  assigned_to UUID,
  created_by UUID NOT NULL,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org tasks" ON public.tasks
  FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "Users can create tasks" ON public.tasks
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Assignee/creator/managers can update tasks" ON public.tasks
  FOR UPDATE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()) AND (
    assigned_to = auth.uid() OR
    created_by = auth.uid() OR
    has_role(auth.uid(), 'owner') OR
    has_role(auth.uid(), 'executive') OR
    has_role(auth.uid(), 'manager')
  ));

-- Task comments for contextual discussions
CREATE TABLE public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view task comments" ON public.task_comments
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_id AND t.organization_id = get_user_org_id(auth.uid())
  ));

CREATE POLICY "Users can add comments" ON public.task_comments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_id AND t.organization_id = get_user_org_id(auth.uid())
  ));

-- ============================================
-- PHASE 7: Communication Hub
-- ============================================

CREATE TYPE public.channel_type AS ENUM ('public', 'private', 'direct');

-- Channels table
CREATE TABLE public.channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  channel_type public.channel_type NOT NULL DEFAULT 'public',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

-- Channel members
CREATE TABLE public.channel_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(channel_id, user_id)
);

ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;

-- Messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  parent_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- RLS for channels: members can view, public channels visible to org
CREATE POLICY "View channels" ON public.channels
  FOR SELECT TO authenticated
  USING (
    organization_id = get_user_org_id(auth.uid()) AND (
      channel_type = 'public' OR
      EXISTS (SELECT 1 FROM public.channel_members cm WHERE cm.channel_id = id AND cm.user_id = auth.uid())
    )
  );

CREATE POLICY "Create channels" ON public.channels
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id(auth.uid()) AND created_by = auth.uid());

-- RLS for channel_members
CREATE POLICY "View channel members" ON public.channel_members
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.channels c
    WHERE c.id = channel_id AND c.organization_id = get_user_org_id(auth.uid())
  ));

CREATE POLICY "Join public channels" ON public.channel_members
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.channels c
    WHERE c.id = channel_id AND c.organization_id = get_user_org_id(auth.uid())
  ));

-- RLS for messages
CREATE POLICY "View messages" ON public.messages
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.channel_members cm
    WHERE cm.channel_id = channel_id AND cm.user_id = auth.uid()
  ));

CREATE POLICY "Send messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.channel_members cm
    WHERE cm.channel_id = channel_id AND cm.user_id = auth.uid()
  ));

-- Indexes for performance
CREATE INDEX idx_tasks_org_status ON public.tasks(organization_id, status);
CREATE INDEX idx_tasks_assigned ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_project ON public.tasks(project_id);
CREATE INDEX idx_messages_channel ON public.messages(channel_id, created_at DESC);
CREATE INDEX idx_channel_members_user ON public.channel_members(user_id);
CREATE INDEX idx_projects_org ON public.projects(organization_id);
