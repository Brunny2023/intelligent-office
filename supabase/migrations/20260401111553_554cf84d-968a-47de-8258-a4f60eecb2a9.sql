
-- 1. Security definer function to atomically handle onboarding
CREATE OR REPLACE FUNCTION public.complete_onboarding(
  _name text,
  _slug text,
  _mission text DEFAULT NULL,
  _brand_tagline text DEFAULT NULL,
  _core_values text[] DEFAULT '{}'::text[],
  _logo_url text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_id uuid;
  _org_id uuid;
  _existing_org uuid;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  -- Check if user already has an org
  SELECT organization_id INTO _existing_org FROM public.profiles WHERE id = _user_id;
  IF _existing_org IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'User already belongs to an organization');
  END IF;

  -- Check slug uniqueness
  IF EXISTS (SELECT 1 FROM public.organizations WHERE slug = _slug) THEN
    RETURN jsonb_build_object('error', 'This slug is already taken');
  END IF;

  -- Create organization
  INSERT INTO public.organizations (name, slug, mission, brand_tagline, core_values, logo_url)
  VALUES (_name, _slug, _mission, _brand_tagline, _core_values, _logo_url)
  RETURNING id INTO _org_id;

  -- Update profile
  UPDATE public.profiles SET organization_id = _org_id WHERE id = _user_id;

  -- Assign owner role
  INSERT INTO public.user_roles (user_id, organization_id, role)
  VALUES (_user_id, _org_id, 'owner');

  RETURN jsonb_build_object('success', true, 'organization_id', _org_id);
END;
$$;

-- 2. User signatures table
CREATE TABLE public.user_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  signature_data text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own signature" ON public.user_signatures
FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "View org signatures" ON public.user_signatures
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.profiles p1
  JOIN public.profiles p2 ON p1.organization_id = p2.organization_id
  WHERE p1.id = auth.uid() AND p2.id = user_signatures.user_id
));

-- 3. Internal memos table
CREATE TABLE public.internal_memos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  created_by uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  recipients text[] DEFAULT '{}'::text[],
  signature_id uuid REFERENCES public.user_signatures(id),
  status text NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.internal_memos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Create memos" ON public.internal_memos
FOR INSERT TO authenticated
WITH CHECK (organization_id = get_user_org_id(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "View org memos" ON public.internal_memos
FOR SELECT TO authenticated
USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "Update own memos" ON public.internal_memos
FOR UPDATE TO authenticated
USING (created_by = auth.uid());

-- 4. Inter-organization messaging tables
CREATE TABLE public.org_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_a_id uuid NOT NULL REFERENCES public.organizations(id),
  org_b_id uuid NOT NULL REFERENCES public.organizations(id),
  subject text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_a_id, org_b_id)
);

ALTER TABLE public.org_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own org conversations" ON public.org_conversations
FOR SELECT TO authenticated
USING (org_a_id = get_user_org_id(auth.uid()) OR org_b_id = get_user_org_id(auth.uid()));

CREATE POLICY "Create org conversations" ON public.org_conversations
FOR INSERT TO authenticated
WITH CHECK (org_a_id = get_user_org_id(auth.uid()) AND org_a_id <> org_b_id);

CREATE TABLE public.org_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.org_conversations(id),
  sender_id uuid NOT NULL,
  sender_org_id uuid NOT NULL REFERENCES public.organizations(id),
  content text NOT NULL,
  attachment_url text,
  attachment_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.org_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View org messages" ON public.org_messages
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.org_conversations c
  WHERE c.id = org_messages.conversation_id
  AND (c.org_a_id = get_user_org_id(auth.uid()) OR c.org_b_id = get_user_org_id(auth.uid()))
));

CREATE POLICY "Send org messages" ON public.org_messages
FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND sender_org_id = get_user_org_id(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.org_conversations c
    WHERE c.id = org_messages.conversation_id
    AND (c.org_a_id = get_user_org_id(auth.uid()) OR c.org_b_id = get_user_org_id(auth.uid()))
  )
);

-- 5. Add attachment support to existing messages table
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_url text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_name text;

-- 6. Enable realtime for inter-org messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.org_messages;
