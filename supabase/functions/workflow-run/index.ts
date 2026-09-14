import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const AI_GATEWAY_API_KEY = Deno.env.get("AI_GATEWAY_API_KEY")!;

/**
 * Workflow executor. Callable modes:
 *   { mode: "process_org" }                → run one step for every active instance in caller's org
 *   { mode: "advance", instance_id }       → advance a single instance one step
 *   { mode: "start", workflow_id, data }   → manually instantiate a workflow
 *   { mode: "escalate" }                   → escalate any active steps past their timeout
 *   { mode: "approve", instance_id }       → approve current approval step; advance
 *   { mode: "reject",  instance_id, notes }→ reject current step; mark instance failed
 *   { mode: "suggest" }                    → AI-suggest workflow templates from org signals
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

    if (mode === "approve" || mode === "reject") {
      const { data: inst } = await admin.from("workflow_instances").select("*").eq("id", body.instance_id).maybeSingle();
      if (!inst || inst.organization_id !== orgId) return json({ error: "not_found" }, 404);
      const { data: steps } = await admin.from("workflow_steps").select("*")
        .eq("workflow_id", inst.workflow_id).order("step_order");
      const step = (steps ?? []).find((s: any) => s.step_order === inst.current_step);
      await admin.from("workflow_step_logs").insert({
        instance_id: body.instance_id, step_order: inst.current_step,
        action: mode === "approve" ? "approved" : "rejected",
        performed_by: u.user.id, notes: body.notes ?? null,
      });
      if (mode === "reject") {
        await admin.from("workflow_instances").update({ status: "rejected", completed_at: new Date().toISOString() }).eq("id", body.instance_id);
        return json({ status: "rejected" });
      }
      await admin.from("workflow_instances").update({ current_step: inst.current_step + 1 }).eq("id", body.instance_id);
      // auto-run next step
      return json(await advance(admin, body.instance_id, orgId, u.user.id));
    }

    if (mode === "suggest") {
      const [{ data: workload }, { data: stale }, { data: overdue }] = await Promise.all([
        admin.rpc("graph_workload_by_person", { _org: orgId }),
        admin.from("tasks").select("id,title,status,assigned_to,updated_at").eq("organization_id", orgId)
          .in("status", ["blocked", "in_progress"]).lt("updated_at", new Date(Date.now() - 48 * 3600_000).toISOString()).limit(20),
        admin.from("tasks").select("id,title,due_date,assigned_to").eq("organization_id", orgId)
          .lt("due_date", new Date().toISOString().slice(0,10)).neq("status", "completed").limit(20),
      ]);
      const signals = { workload: (workload ?? []).slice(0, 10), stale_tasks: stale ?? [], overdue_tasks: overdue ?? [] };
      const prompt = `You are an operations analyst. Given the following organizational signals, propose 3 concrete workflow automations that would resolve visible bottlenecks. Return strict JSON: {"suggestions":[{"name":string,"why":string,"trigger":"task_created|task_completed|leave_requested|expense_submitted|document_uploaded|manual","steps":[{"action_type":"notification|assign_task|approval|escalation","reason":string}]}]}\n\nSIGNALS:\n${JSON.stringify(signals).slice(0, 6000)}`;
      const aiRes = await fetch("https://your-ai-gateway.example/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${AI_GATEWAY_API_KEY}` },
        body: JSON.stringify({
          model: "openai/gpt-5.6-sol",
          reasoning_effort: "none",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        }),
      });
      const aiJson = await aiRes.json().catch(() => ({}));
      let parsed: any = { suggestions: [] };
      try { parsed = JSON.parse(aiJson?.choices?.[0]?.message?.content ?? "{}"); } catch { /* noop */ }
      return json({ signals, suggestions: parsed.suggestions ?? [] });
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