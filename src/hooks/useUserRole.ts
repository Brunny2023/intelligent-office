import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";

export const useUserRole = () => {
  const { user } = useAuth();
  const { org } = useOrganization();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const isAdmin = role === "owner" || role === "executive" || role === "manager";

  useEffect(() => {
    if (!user || !org) { setLoading(false); return; }
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("organization_id", org.id)
      .maybeSingle()
      .then(({ data }) => {
        setRole(data?.role || null);
        setLoading(false);
      });
  }, [user, org]);

  return { role, isAdmin, loading };
};
