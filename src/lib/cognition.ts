import { supabase } from "@/integrations/supabase/client";

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