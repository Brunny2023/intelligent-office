import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Resolves user_ids to full_names, caching results.
 */
export const useProfileNames = () => {
  const cache = useRef<Record<string, string>>({});
  const avatarCache = useRef<Record<string, string | null>>({});
  const [names, setNames] = useState<Record<string, string>>({});
  const [avatars, setAvatars] = useState<Record<string, string | null>>({});

  const resolve = useCallback(async (userIds: string[]) => {
    const missing = userIds.filter(id => !cache.current[id]);
    if (missing.length === 0) return;

    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", missing);

    if (data) {
      const newEntries: Record<string, string> = {};
      const newAvatars: Record<string, string | null> = {};
      data.forEach(p => {
        cache.current[p.id] = p.full_name;
        avatarCache.current[p.id] = p.avatar_url;
        newEntries[p.id] = p.full_name;
        newAvatars[p.id] = p.avatar_url;
      });
      setNames(prev => ({ ...prev, ...newEntries }));
      setAvatars(prev => ({ ...prev, ...newAvatars }));
    }
  }, []);

  const getName = useCallback((userId: string) => {
    return cache.current[userId] || names[userId] || userId.slice(0, 8) + "…";
  }, [names]);

  const getAvatar = useCallback((userId: string) => {
    return avatarCache.current[userId] || avatars[userId] || null;
  }, [avatars]);

  return { resolve, getName, getAvatar, names: { ...cache.current, ...names }, avatars: { ...avatarCache.current, ...avatars } };
};
