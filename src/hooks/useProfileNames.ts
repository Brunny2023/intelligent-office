import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Resolves user_ids to full_names, caching results.
 */
export const useProfileNames = () => {
  const cache = useRef<Record<string, string>>({});
  const [names, setNames] = useState<Record<string, string>>({});

  const resolve = useCallback(async (userIds: string[]) => {
    const missing = userIds.filter(id => !cache.current[id]);
    if (missing.length === 0) return;

    const { data } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", missing);

    if (data) {
      const newEntries: Record<string, string> = {};
      data.forEach(p => {
        cache.current[p.id] = p.full_name;
        newEntries[p.id] = p.full_name;
      });
      setNames(prev => ({ ...prev, ...newEntries }));
    }
  }, []);

  const getName = useCallback((userId: string) => {
    return cache.current[userId] || names[userId] || userId.slice(0, 8) + "…";
  }, [names]);

  return { resolve, getName, names: { ...cache.current, ...names } };
};
