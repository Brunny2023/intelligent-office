import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const usePlatformAdmin = () => {
  const { user } = useAuth();
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    if (!user) { setLoading(false); setIsPlatformAdmin(false); return; }
    supabase.rpc("is_platform_admin", { _user_id: user.id }).then(({ data }) => {
      if (!mounted) return;
      setIsPlatformAdmin(Boolean(data));
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [user]);

  return { isPlatformAdmin, loading };
};