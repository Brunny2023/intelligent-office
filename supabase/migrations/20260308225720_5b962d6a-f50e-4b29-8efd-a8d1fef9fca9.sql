
-- Drop restrictive policies
DROP POLICY IF EXISTS "Users without org can create organization" ON public.organizations;
DROP POLICY IF EXISTS "Users can view their own organization" ON public.organizations;
DROP POLICY IF EXISTS "Owners can update their organization" ON public.organizations;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Users without org can create organization"
ON public.organizations FOR INSERT TO authenticated
WITH CHECK (get_user_org_id(auth.uid()) IS NULL);

CREATE POLICY "Users can view their own organization"
ON public.organizations FOR SELECT TO authenticated
USING (id = get_user_org_id(auth.uid()));

CREATE POLICY "Owners can update their organization"
ON public.organizations FOR UPDATE TO authenticated
USING (id = get_user_org_id(auth.uid()) AND has_role(auth.uid(), 'owner'::app_role));
