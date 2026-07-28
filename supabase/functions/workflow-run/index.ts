import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

/**
 * Workflow executor. Callable modes:
 *   { mode: "process_org" }                → run one step for every active instance in caller's org
 *   { mode: "advance", instance_id }       → advance a single instance one step
 *   { mode: "start", workflow_id, data }   → manually instantiate a workflow
 *   { mode: "escalate" }                   → escalate any active steps past their timeout
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: u } = await admin.auth.getUser(auth.slice(7));
    if (!u.user) return json({ error: "unauthorized" }, 401);
    const { data: prof } = await admin.from("profiles").select("organization_id").eq("id", u.user.id).maybeSingle();
    const orgId = prof?.organization_id;
    if (!orgId) return json({ error: "no_organization" }, 403);

    const body = await req.json().catch(() => ({}));
    const mode = body.mode ?? "process_org";

    if (mode === "start") {
      const { workflow_id, data = {} } = body;
      const { data: wf } = await admin.from("workflows").select("*").eq("id", workflow_id).maybeSingle();
      if (!wf || wf.organization_id !== orgId) return json({ error: "workflow_not_found" }, 404);
      const { data: inst, error } = await admin.from("workflow_instances").insert({
        workflow_id, organization_id: orgId, current_step: 0, status: "active",
        trigger_data: data, started_by: u.user.id,
      }).select().single();
      if (error) throw error;
      return json({ started: inst });
    }

    if (mode === "advance") {
      return json(await advance(admin, body.instance_id, orgId, u.user.id));
    }

    if (mode === "escalate") {
      const { data: stale } = await admin
        .from("workflow_instances").select("id, started_at")
        .eq("organization_id", orgId).eq("status", "active")
        .lt("started_at", new Date(Date.now() - 24 * 3600_000).toISOString());
      const results: unknown[] = [];
      for (const s of stale ?? []) results.push(await advance(admin, s.id, orgId, u.user.id, true));
      return json({ escalated: results.length, results });
    }

    // default: process_org — advance every active instance by one step.
    const { data: active } = await admin
      .from("workflow_instances").select("id")
      .eq("organization_id", orgId).eq("status", "active").limit(50);
    const results: unknown[] = [];
    for (const inst of active ?? []) results.push(await advance(admin, inst.id, orgId, u.user.id));
    return json({ processed: results.length, results });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

async function advance(admin: ReturnType<typeof createClient>, instanceId: string, orgId: string, actor: string, escalate = false) {
  const { data: inst } = await admin.from("workflow_instances").select("*").eq("id", instanceId).maybeSingle();
  if (!inst || inst.organization_id !== orgId) return { instance_id: instanceId, error: "not_found" };
  if (inst.status !== "active") return { instance_id: instanceId, status: inst.status };

  const { data: steps } = await admin.from("workflow_steps").select("*")
    .eq("workflow_id", inst.workflow_id).order("step_order", { ascending: true });
  const step = (steps ?? []).find((s) => s.step_order === inst.current_step);
  if (!step) {
    await admin.from("workflow_instances").update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", instanceId);
    return { instance_id: instanceId, status: "completed" };
  }

  const cfg = step.action_config ?? {};
  let note = "";
  try {
    if (step.action_type === "notification") {
      const target = step.assignee_id ?? inst.started_by;
      await admin.from("notifications").insert({
        user_id: target, organization_id: orgId,
        title: cfg.title ?? "Workflow notification",
        message: cfg.message ?? "A workflow step requires your attention.",
        type: "workflow",
      });
      note = `notified ${target}`;
    } else if (step.action_type === "assign_task") {
      await admin.from("tasks").insert({
        organization_id: orgId,
        title: cfg.title ?? "Workflow-generated task",
        description: cfg.description ?? null,
        status: "todo", priority: cfg.priority ?? "medium",
        assigned_to: step.assignee_id, created_by: inst.started_by,
        due_date: cfg.due_date ?? null,
      });
      note = "task created";
    } else if (step.action_type === "approval") {
      // Approval steps wait for an external UI action. Just log and hold.
      await admin.from("workflow_step_logs").insert({
        instance_id: instanceId, step_order: step.step_order,
        action: "awaiting_approval", performed_by: actor,
        notes: `Awaiting ${step.assignee_id ?? "assignee"}`,
      });
      return { instance_id: instanceId, status: "awaiting_approval", step: step.step_order };
    } else if (step.action_type === "escalation" || escalate) {
      await admin.from("notifications").insert({
        user_id: step.assignee_id ?? inst.started_by, organization_id: orgId,
        title: "Escalation", message: cfg.message ?? "A workflow step has been escalated.", type: "workflow",
      });
      note = "escalated";
    } else if (step.action_type === "update_status") {
      note = `status noted: ${cfg.status ?? "n/a"}`;
    }

    await admin.from("workflow_step_logs").insert({
      instance_id: instanceId, step_order: step.step_order,
      action: step.action_type, performed_by: actor, notes: note,
    });
    await admin.from("workflow_instances").update({ current_step: inst.current_step + 1 }).eq("id", instanceId);
    return { instance_id: instanceId, executed: step.action_type, note };
  } catch (err) {
    await admin.from("workflow_step_logs").insert({
      instance_id: instanceId, step_order: step.step_order,
      action: "error", performed_by: actor, notes: (err as Error).message,
    });
    return { instance_id: instanceId, error: (err as Error).message };
  }
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}