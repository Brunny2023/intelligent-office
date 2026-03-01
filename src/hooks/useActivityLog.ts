import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "./useOrganization";

export const useActivityLog = () => {
  const { user } = useAuth();
  const { org } = useOrganization();

  const logActivity = async (
    action: string,
    entityType: string,
    entityId?: string,
    metadata?: Record<string, unknown>
  ) => {
    if (!user || !org) return;

    await supabase.from("activity_logs").insert([{
      user_id: user.id,
      organization_id: org.id,
      action,
      entity_type: entityType,
      entity_id: entityId || undefined,
      metadata: (metadata || {}) as any,
    }]);
  };

  return { logActivity };
};
