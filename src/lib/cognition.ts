import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Fire-and-forget deliberation trigger for the Wave 5 module rewiring.
 * Non-blocking: modules keep their UX snappy while the leadership deliberates
 * in the background. The resulting cognition_request row shows up in /cognition
 * with the full audit trail, policy checks, and any auto-created tasks.
 */
export async function triggerCognition(request: string, targetDepartmentId?: string | null): Promise<void> {
  try {
    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;
    if (!token) return;
    // Wave-6 gap fix: background triggers were invisible to users. Surface a
    // non-blocking toast so people know the leadership is deliberating, with
    // a one-tap deep-link into the Cognition Center to watch it stream in.
    toast({
      title: "Leadership is deliberating",
      description: "Follow along in the Cognition Center at /cognition.",
    });
    // Kick off; do not await response so callers stay responsive.
    void fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cognition-deliberate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ request, targetDepartmentId: targetDepartmentId ?? null }),
    }).catch(() => { /* swallow — deliberation is advisory */ });
  } catch { /* ignore */ }
}