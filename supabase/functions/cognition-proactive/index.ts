import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

/**
 * Wave 6 — Proactive Cognition.
 *
 * The AI leadership stops waiting to be asked. This scanner sweeps every org
 * for signals worth deliberating on (critical unresolved insights, off-track
 * KPIs, stalled workflow clusters, overdue-task pileups) and nominates a
 * cognition topic for leadership. Nominations land as notifications to org
 * owners/execs with a proposed prompt they can escalate into a full
 * deliberation from /cognition.
 *
 * Called by pg_cron (no auth) or ad-hoc by an authed user (scoped to their org).
 * Dedupes by (org, signature) within a rolling 24h window via ai_insights
 * marker rows of type='proactive_cognition' so we never spam.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  try {
    let orgIds: string[] | null = null;
    const auth = req.headers.get("Authorization") ?? "";
    if (auth.startsWith("Bearer ")) {
      const { data: u } = await admin.auth.getUser(auth.slice(7));
      if (u.user) {
        const { data: prof } = await admin.from("profiles").select("organization_id").eq("id", u.user.id).maybeSingle();
        if (prof?.organization_id) orgIds = [prof.organization_id];
      }
    }
    if (!orgIds) {
      const { data: orgs } = await admin.from("organizations").select("id");
      orgIds = (orgs ?? []).map((o: any) => o.id);
    }

    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    let nominated = 0;

    for (const orgId of orgIds) {
      const nominations: Array<{ signature: string; prompt: string; severity: string; source: string }> = [];

      // Signal 1: unresolved critical/high insights older than 48h.
      const twoDaysAgo = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
      const { data: stale } = await admin.from("ai_insights")
        .select("id, title, severity")
        .eq("organization_id", orgId).eq("status", "open")
        .in("severity", ["high", "critical"])
        .lt("generated_at", twoDaysAgo).limit(5);
      for (const s of stale ?? []) {
        nominations.push({
          signature: `stale_insight:${s.id}`,
          prompt: `A ${s.severity} alert has been open >48h: "${s.title}". Deliberate on root cause, owner, and next steps.`,
          severity: s.severity, source: "ai_insight",
        });
      }

      // Signal 2: KPIs at risk (current < 70% of target with a defined target).
      const { data: kpis } = await admin.from("kpis")
        .select("id, title, current_value, target_value, unit, status")
        .eq("organization_id", orgId).not("target_value", "is", null);
      const offTrack = (kpis ?? []).filter((k: any) =>
        Number(k.target_value) > 0 && Number(k.current_value ?? 0) < Number(k.target_value) * 0.7
      ).slice(0, 3);
      for (const k of offTrack) {
        nominations.push({
          signature: `off_track_kpi:${k.id}`,
          prompt: `KPI "${k.title}" is off-track: ${k.current_value ?? 0}${k.unit ?? ""} vs target ${k.target_value}${k.unit ?? ""}. Deliberate on corrective plan and accountable owner.`,
          severity: "high", source: "kpi",
        });
      }

      // Signal 3: overdue-task pileup (>=5 overdue, unassigned or in one dept).
      const today = new Date().toISOString().slice(0, 10);
      const { data: overdue } = await admin.from("tasks")
        .select("id, department_id")
        .eq("organization_id", orgId).neq("status", "completed")
        .lt("due_date", today);
      if ((overdue?.length ?? 0) >= 5) {
        const byDept = new Map<string, number>();
        for (const t of overdue!) {
          const k = t.department_id ?? "unassigned";
          byDept.set(k, (byDept.get(k) ?? 0) + 1);
        }
        const top = [...byDept.entries()].sort((a, b) => b[1] - a[1])[0];
        if (top && top[1] >= 5) {
          nominations.push({
            signature: `overdue_pileup:${top[0]}:${Math.floor(Date.now() / 86400000)}`,
            prompt: `Overdue task pileup detected (${top[1]} overdue tasks concentrated in a single area). Deliberate on capacity, priorities, and unblockers.`,
            severity: "high", source: "tasks",
          });
        }
      }

      if (nominations.length === 0) continue;

      // Dedup against last 24h of proactive markers.
      const { data: prior } = await admin.from("ai_insights")
        .select("metadata")
        .eq("organization_id", orgId).eq("insight_type", "proactive_cognition")
        .gte("generated_at", since);
      const seen = new Set((prior ?? []).map((p: any) => p.metadata?.signature).filter(Boolean));

      // Recipients: owners + executives.
      const { data: leaders } = await admin.from("user_roles").select("user_id")
        .eq("organization_id", orgId).in("role", ["owner", "executive"]);
      const leaderIds = (leaders ?? []).map((l: any) => l.user_id);
      if (leaderIds.length === 0) continue;

      for (const n of nominations) {
        if (seen.has(n.signature)) continue;

        // Marker row (also visible in AI Insights as a nomination).
        await admin.from("ai_insights").insert({
          organization_id: orgId,
          insight_type: "proactive_cognition",
          title: "Leadership recommends a deliberation",
          content: n.prompt,
          severity: n.severity,
          status: "open",
          metadata: { signature: n.signature, source: n.source, prompt: n.prompt },
          reason: { signals: [{ type: "proactive", source: n.source }] },
        });

        // Notify leaders — clicking lands in /cognition with the prompt prefilled.
        const link = `/cognition?prefill=${encodeURIComponent(n.prompt)}`;
        await admin.from("notifications").insert(leaderIds.map((uid) => ({
          user_id: uid, organization_id: orgId,
          title: "Proactive cognition nomination",
          message: n.prompt.slice(0, 180),
          type: "cognition", link, is_read: false,
        })));
        nominated += 1;
      }
    }

    return new Response(JSON.stringify({ ok: true, orgs: orgIds.length, nominated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});