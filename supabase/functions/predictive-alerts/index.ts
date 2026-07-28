import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

/**
 * Predictive alerts scanner.
 * Detects:
 *   - Slipping tasks: due within N hours, still not completed, low recent activity.
 *   - Stalled workflow instances: active >24h with no step_log progress in last 24h.
 * Persists into ai_insights (dedup by fingerprint in metadata) and notifies owners.
 *
 * Called either by pg_cron (no auth header, service role) or by an authed user
 * from the dashboard ("Run predictive scan"). When called by cron, scans all orgs.
 * When called by an authed user, scans only their org.
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

    const summary: any = { orgs_scanned: 0, insights_created: 0, notifications_sent: 0 };
    for (const orgId of orgIds) {
      summary.orgs_scanned++;
      const r = await scanOrg(admin, orgId);
      summary.insights_created += r.insights;
      summary.notifications_sent += r.notifs;
    }
    return json(summary);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

async function scanOrg(admin: any, orgId: string) {
  let insights = 0;
  let notifs = 0;
  const now = Date.now();
  const soon = new Date(now + 48 * 3600_000).toISOString().slice(0, 10);
  const today = new Date(now).toISOString().slice(0, 10);

  // Pre-fetch org owners/execs/managers for fallback routing.
  const { data: roleRows } = await admin
    .from("user_roles").select("user_id, role").eq("organization_id", orgId)
    .in("role", ["owner", "executive", "manager"]);
  const managers: string[] = (roleRows ?? []).map((r: any) => r.user_id);
  const routeFallback = () => managers[0];

  // 1. Slipping tasks: due within 48h, not completed, no activity in last 24h.
  const { data: slipping } = await admin
    .from("tasks")
    .select("id, title, assigned_to, created_by, project_id, due_date, status, updated_at, priority")
    .eq("organization_id", orgId)
    .neq("status", "completed")
    .gte("due_date", today)
    .lte("due_date", soon)
    .lt("updated_at", new Date(now - 24 * 3600_000).toISOString())
    .limit(50);

  for (const t of slipping ?? []) {
    const fp = `slip:${t.id}`;
    const evidence = {
      fingerprint: fp, task_id: t.id, due_date: t.due_date,
      assignee: t.assigned_to, created_by: t.created_by, project_id: t.project_id,
      hours_since_activity: Math.round((now - new Date(t.updated_at).getTime()) / 3600_000),
      link: `/execution?task=${t.id}`,
    };
    const created = await upsertInsight(admin, orgId, fp, {
      insight_type: "predictive_slip",
      severity: t.priority === "urgent" || t.priority === "high" ? "high" : "medium",
      title: `Task at risk: "${t.title}"`,
      content: `Due ${t.due_date} with no activity in 24h. Status: ${t.status}. Intervene before the deadline slips.`,
      metadata: evidence,
      reason: evidence,
    });
    if (created) {
      insights++;
      const targets = new Set<string>();
      if (t.assigned_to) targets.add(t.assigned_to);
      if (t.created_by && targets.size === 0) targets.add(t.created_by);
      if (targets.size === 0 && routeFallback()) targets.add(routeFallback()!);
      for (const uid of targets) {
        notifs += await notify(admin, orgId, uid, "Task at risk of slipping",
          `"${t.title}" is due ${t.due_date} and has had no activity for 24h.`, `/execution?task=${t.id}`);
      }
    }
  }

  // 2. Overdue clusters per assignee (>=3 overdue open tasks).
  const { data: overdue } = await admin
    .from("tasks")
    .select("assigned_to")
    .eq("organization_id", orgId)
    .neq("status", "completed")
    .not("assigned_to", "is", null)
    .lt("due_date", today);
  const clusters: Record<string, number> = {};
  for (const t of overdue ?? []) if (t.assigned_to) clusters[t.assigned_to] = (clusters[t.assigned_to] ?? 0) + 1;
  for (const [uid, count] of Object.entries(clusters)) {
    if (count < 3) continue;
    const fp = `overdue_cluster:${uid}:${today}`;
    const created = await upsertInsight(admin, orgId, fp, {
      insight_type: "predictive_overload",
      severity: count >= 6 ? "critical" : "high",
      title: `Overdue cluster (${count} tasks)`,
      content: `Assignee has ${count} overdue open tasks. Consider redistributing workload or escalating.`,
      metadata: { fingerprint: fp, assignee: uid, count },
    });
    if (created) {
      insights++;
      notifs += await notify(admin, orgId, uid, "You have overdue tasks piling up",
        `${count} overdue tasks need attention.`, `/execution`);
    }
  }

  // 3. Stalled workflow instances: active >24h with no step_log in last 24h.
  const cutoff = new Date(now - 24 * 3600_000).toISOString();
  const { data: active } = await admin
    .from("workflow_instances")
    .select("id, workflow_id, started_by, started_at, current_step, workflows(name, created_by)")
    .eq("organization_id", orgId).eq("status", "active")
    .lt("started_at", cutoff);

  for (const inst of active ?? []) {
    const { data: recent } = await admin.from("workflow_step_logs")
      .select("id").eq("instance_id", inst.id).gt("performed_at", cutoff).limit(1);
    if ((recent ?? []).length > 0) continue;
    const fp = `wf_stalled:${inst.id}`;
    const name = inst.workflows?.name ?? "Workflow";
    const evidence = {
      fingerprint: fp, instance_id: inst.id, workflow_id: inst.workflow_id,
      step: inst.current_step, hours_stalled: Math.round((now - new Date(inst.started_at).getTime()) / 3600_000),
      link: `/workflows?instance=${inst.id}`,
    };
    const created = await upsertInsight(admin, orgId, fp, {
      insight_type: "predictive_workflow_stall",
      severity: "high",
      title: `Stalled workflow: ${name}`,
      content: `Workflow instance stuck on step ${inst.current_step} for >24h with no activity. Advance or escalate.`,
      metadata: evidence, reason: evidence,
    });
    if (created) {
      insights++;
      const target = inst.started_by || inst.workflows?.created_by || routeFallback();
      if (target) notifs += await notify(admin, orgId, target, "Workflow stalled",
        `${name} has been stalled on step ${inst.current_step} for 24h+.`, `/workflows`);
    }
  }

  // 4. KPI drift: past mid-period with less than 50% attainment.
  const { data: kpis } = await admin
    .from("kpis")
    .select("id, title, current_value, target_value, period_start, period_end, owner_id")
    .eq("organization_id", orgId)
    .not("target_value", "is", null);
  for (const k of kpis ?? []) {
    if (!k.period_start || !k.period_end || !k.target_value) continue;
    const start = new Date(k.period_start).getTime();
    const end = new Date(k.period_end).getTime();
    if (Date.now() < start + (end - start) * 0.5) continue;
    const attain = Number(k.current_value ?? 0) / Number(k.target_value);
    if (attain >= 0.5) continue;
    const fp = `kpi_drift:${k.id}:${today.slice(0, 7)}`;
    const evidence = { fingerprint: fp, kpi_id: k.id, attainment_pct: Math.round(attain * 100), link: `/intelligence?kpi=${k.id}` };
    const created = await upsertInsight(admin, orgId, fp, {
      insight_type: "predictive_kpi_drift",
      severity: attain < 0.25 ? "critical" : "high",
      title: `KPI drifting off target: "${k.title}"`,
      content: `Only ${Math.round(attain * 100)}% attained past the period midpoint. Action needed to close the gap.`,
      metadata: evidence, reason: evidence,
    });
    if (created) {
      insights++;
      const target = k.owner_id || routeFallback();
      if (target) notifs += await notify(admin, orgId, target, "KPI drifting off target",
        `"${k.title}" is at ${Math.round(attain * 100)}% past midpoint.`, `/intelligence?kpi=${k.id}`);
    }
  }

  // 5. Aging approvals: workflow steps of type 'approval' whose instance is older than step timeout_hours.
  const { data: aging } = await admin
    .from("workflow_instances")
    .select("id, workflow_id, current_step, started_at, started_by, workflows(name)")
    .eq("organization_id", orgId).eq("status", "active");
  for (const inst of aging ?? []) {
    const { data: step } = await admin.from("workflow_steps")
      .select("action_type, timeout_hours, assignee_id")
      .eq("workflow_id", inst.workflow_id).eq("step_order", inst.current_step).maybeSingle();
    if (!step || step.action_type !== "approval") continue;
    const timeout = Number(step.timeout_hours || 48);
    if (Date.now() - new Date(inst.started_at).getTime() < timeout * 3600_000) continue;
    const fp = `approval_aging:${inst.id}`;
    const evidence = { fingerprint: fp, instance_id: inst.id, step: inst.current_step, timeout_hours: timeout, link: `/workflows?instance=${inst.id}` };
    const created = await upsertInsight(admin, orgId, fp, {
      insight_type: "predictive_approval_aging",
      severity: "high",
      title: `Approval overdue: ${inst.workflows?.name ?? "Workflow"}`,
      content: `Step ${inst.current_step} has been awaiting approval past its ${timeout}h SLA.`,
      metadata: evidence, reason: evidence,
    });
    if (created) {
      insights++;
      const target = step.assignee_id || inst.started_by || routeFallback();
      if (target) notifs += await notify(admin, orgId, target, "Approval overdue",
        `A workflow approval has passed its ${timeout}h SLA.`, `/workflows`);
    }
  }

  return { insights, notifs };
}

async function upsertInsight(admin: any, orgId: string, fp: string, payload: any): Promise<boolean> {
  // Dedupe: skip if an unresolved (unread OR generated <24h) insight with this fingerprint exists.
  const cutoff = new Date(Date.now() - 24 * 3600_000).toISOString();
  const { data: existing } = await admin.from("ai_insights")
    .select("id, is_read, generated_at")
    .eq("organization_id", orgId)
    .eq("insight_type", payload.insight_type)
    .contains("metadata", { fingerprint: fp })
    .gt("generated_at", cutoff)
    .limit(1);
  if ((existing ?? []).length > 0) return false;
  const { error } = await admin.from("ai_insights").insert({
    organization_id: orgId, is_read: false, generated_at: new Date().toISOString(),
    ...payload,
  });
  return !error;
}

async function notify(admin: any, orgId: string, userId: string, title: string, message: string, link: string): Promise<number> {
  const { error } = await admin.from("notifications").insert({
    user_id: userId, organization_id: orgId, title, message, type: "predictive", link, is_read: false,
  });
  return error ? 0 : 1;
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}