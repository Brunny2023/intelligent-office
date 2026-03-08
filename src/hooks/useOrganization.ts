import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface OrgProfile {
  id: string;
  full_name: string;
  organization_id: string | null;
  department_id: string | null;
  job_title: string | null;
  avatar_url: string | null;
  timezone: string | null;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  mission: string | null;
  core_values: string[];
  brand_tagline: string | null;
  favicon_url: string | null;
}

export const useOrganization = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<OrgProfile | null>(null);
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const load = async () => {
      const { data: p } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (p) {
        setProfile(p as OrgProfile);
        if (p.organization_id) {
          const { data: o } = await supabase
            .from("organizations")
            .select("*")
            .eq("id", p.organization_id)
            .single();
          if (o) {
            setOrg({
              ...o,
              core_values: (o as any).core_values || [],
              mission: (o as any).mission || null,
              brand_tagline: (o as any).brand_tagline || null,
              favicon_url: (o as any).favicon_url || null,
            } as Organization);
          }
        }
      }
      setLoading(false);
    };
    load();
  }, [user]);

  return { profile, org, loading };
};
