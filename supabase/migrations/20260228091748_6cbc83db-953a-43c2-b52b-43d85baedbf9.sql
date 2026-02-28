
-- Fix permissive INSERT policies

-- Organizations: only allow if user doesn't already belong to an org
DROP POLICY "Anyone can create an organization" ON public.organizations;
CREATE POLICY "Users without org can create organization"
  ON public.organizations FOR INSERT TO authenticated
  WITH CHECK (public.get_user_org_id(auth.uid()) IS NULL);

-- Profiles: only allow inserting own profile
DROP POLICY "System can insert profiles" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- User roles: only allow inserting for own user during org setup
DROP POLICY "System can insert roles" ON public.user_roles;
CREATE POLICY "Users can assign own role during setup"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
