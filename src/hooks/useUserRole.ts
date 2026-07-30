import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";

const CACHE_KEY = "svo-user-role";

/**
 * Resolves the signed-in member's role for the active org.
 * The last known role is cached for the session so navigating between pages
 * (each page mounts its own layout) does not flash a role-less UI.
 */
export const useUserRole = () => {
  const { user } = useAuth();
  const { org, loading: orgLoading } = useOrganization();
  const [role, setRole] = useState<string | null>(
    () => (typeof sessionStorage !== "undefined" ? sessionStorage.getItem(CACHE_KEY) : null)
  );
  const [loading, setLoading] = useState(true);
  const isAdmin = role === "owner" || role === "executive" || role === "manager";

  useEffect(() => {
    let active = true;
    // Never resolve to "no role" while the org is still being fetched — that
    // would bounce role-gated pages (e.g. /admin) back to the dashboard.
    if (orgLoading) { setLoading(true); return; }
    if (!user || !org) {
      setRole(null);
      sessionStorage.removeItem(CACHE_KEY);
      setLoading(false);
      return;
    }
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("organization_id", org.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        const next = data?.role || null;
        setRole(next);
        if (next) sessionStorage.setItem(CACHE_KEY, next);
        else sessionStorage.removeItem(CACHE_KEY);
        setLoading(false);
      });
    return () => { active = false; };
  }, [user, org?.id, orgLoading]);

  return { role, isAdmin, loading };
};
