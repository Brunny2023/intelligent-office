CREATE OR REPLACE FUNCTION public.has_share_consent(_owner_org uuid, _share_type text, _resource_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_share_consents c
    WHERE c.owner_org_id = _owner_org
      AND c.share_type = _share_type
      AND c.resource_id = _resource_id
      AND c.status = 'active'
      AND (c.expires_at IS NULL OR c.expires_at > now())
      AND c.partner_org_id = public.get_user_org_id(auth.uid())
  )
$$;

DROP POLICY IF EXISTS "View shared kpis" ON public.kpis;
CREATE POLICY "View shared kpis" ON public.kpis
  FOR SELECT TO authenticated
  USING (public.has_share_consent(organization_id, 'kpi', id));

DROP POLICY IF EXISTS "View shared insights" ON public.ai_insights;
CREATE POLICY "View shared insights" ON public.ai_insights
  FOR SELECT TO authenticated
  USING (public.has_share_consent(organization_id, 'insight', id));