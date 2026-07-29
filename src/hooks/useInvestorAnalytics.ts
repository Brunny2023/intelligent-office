import { useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

function getVisitorId(): string {
  const key = "go_visitor_id";
  let v = localStorage.getItem(key);
  if (!v) {
    v = crypto.randomUUID();
    localStorage.setItem(key, v);
  }
  return v;
}

export function useInvestorAnalytics() {
  const visitorId = useRef<string>("");
  useEffect(() => { visitorId.current = getVisitorId(); }, []);

  const track = useCallback(async (event_type: string, metadata: Record<string, unknown> = {}, meeting_id?: string | null) => {
    try {
      await supabase.from("investor_analytics").insert({
        event_type,
        visitor_id: visitorId.current || getVisitorId(),
        meeting_id: meeting_id ?? null,
        metadata: metadata as never,
      });
    } catch { /* noop — analytics is best-effort */ }
  }, []);

  return { track };
}