import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const SYSTEM_PROMPT = `You are the Enterprise Cognition engine of Global Office. You do NOT respond as a single assistant. You run an organization's virtual leadership through a deliberate reasoning lifecycle grounded ONLY in the organization's own context provided below.

You must return STRICT JSON matching this shape (no prose, no markdown fences):
{
  "intent": "<1 sentence summary of what the requester actually wants>",
  "executive_deliberation": [
    { "role": "ceo|coo|cfo|cto|cio|cdo|cmo|chro|clo|cro|cso", "position": "<1-2 sentences from that executive's perspective referencing org context>" }
  ],
  "consultant": { "domain": "<one of the org's consultant domains>", "recommendation": "<2-3 sentences of expert guidance>" },
  "department": { "name": "<the AI department that should own this>", "rationale": "<why>" },
  "execution_plan": [ { "step": 1, "action": "<action>", "owner": "<specialist role>", "success_criteria": "<observable>" } ],
  "risk": "<1-2 sentences>",
  "compliance": "<1-2 sentences or 'No specific compliance concern.'>",
  "financial_impact": "<1-2 sentences>",
  "success_criteria": ["<criterion 1>", "<criterion 2>"],
  "decision_summary": "<3-5 sentences the CEO would say back to the requester>",
  "memory_entry": { "title": "<short>", "content": "<what to remember for future decisions>", "tags": ["<tag>"] },
  "follow_ups": ["<next likely question or request>", "<next step>"]
}

RULES:
- Include 3-6 executives in executive_deliberation, choose the ones actually relevant to the request. Never invent roles outside the list above.
- Use organization mission, values, KPIs, and prior decisions to ground every position.
- Executive positions must reflect distinct viewpoints (financial vs operational vs strategic vs risk) — no echo chamber.
- execution_plan: 3-7 concrete steps.
- If the request is off-domain or lacks context, still return the JSON but set decision_summary explaining the gap and follow_ups asking for the missing input.
- Never mention that you are an AI. You are the organization's leadership reasoning collectively.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const started = Date.now();
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: userData } = await admin.auth.getUser(authHeader.slice(7));
    if (!userData?.user) return json({ error: "unauthorized" }, 401);

    const { data: profile } = await admin
      .from("profiles").select("organization_id, full_name, job_title").eq("id", userData.user.id).maybeSingle();
    const orgId = profile?.organization_id;
    if (!orgId) return json({ error: "no_organization" }, 403);

    const body = await req.json().catch(() => ({}));
    const request: string = (body.request ?? "").toString().trim();
    const targetDepartmentId: string | null = body.targetDepartmentId ?? null;
    if (!request) return json({ error: "request required" }, 400);

    // Gather org context — memory is now relevance-ranked via full-text search
    const [{ data: org }, { data: executives }, { data: consultants }, { data: departments }, { data: kpis }, memoryRes, { data: recentDecisions }] = await Promise.all([
      admin.from("organizations").select("name, mission, brand_tagline, core_values").eq("id", orgId).maybeSingle(),
      admin.from("ai_executives").select("role, title, mandate, focus_kpis").eq("organization_id", orgId).eq("is_active", true),
      admin.from("ai_consultants").select("domain, title, expertise").eq("organization_id", orgId).eq("is_active", true),
      admin.from("ai_departments").select("id, name, charter").eq("organization_id", orgId).eq("is_active", true),
      admin.from("kpis").select("title, current_value, target_value, unit, status").eq("organization_id", orgId).limit(20),
      admin.rpc("search_memory", { _org: orgId, _query: request, _limit: 10 }),
      admin.from("cognition_requests").select("request, outcome").eq("organization_id", orgId).eq("status", "completed").order("completed_at", { ascending: false }).limit(6),
    ]);
    const memory = (memoryRes.data as Array<{ id: string; title: string; content: string; tags: string[] }> | null) ?? [];
    const referencedMemoryIds = memory.map((m) => m.id);
    if (referencedMemoryIds.length > 0) {
      await admin.rpc("touch_memory", { _memory_ids: referencedMemoryIds });
    }

    const context = {
      organization: org,
      executives,
      consultants,
      departments,
      kpis,
      recent_decisions: recentDecisions,
      organizational_memory: memory,
      requester: { name: profile?.full_name, title: profile?.job_title },
    };

    // Create request row
    const { data: reqRow, error: reqErr } = await admin.from("cognition_requests").insert({
      organization_id: orgId,
      requested_by: userData.user.id,
      request,
      target_department_id: targetDepartmentId,
      status: "processing",
    }).select("id").single();
    if (reqErr || !reqRow) return json({ error: "insert_failed", detail: reqErr?.message }, 500);
    const requestId = reqRow.id;

    await admin.from("cognition_steps").insert({
      request_id: requestId, organization_id: orgId, stage: "context_retrieval",
      actor_type: "system", actor_label: "Organizational Intelligence",
      reasoning: `Loaded ${executives?.length ?? 0} executives, ${consultants?.length ?? 0} consultants, ${departments?.length ?? 0} departments, ${kpis?.length ?? 0} KPIs, ${memory?.length ?? 0} memory entries.`,
      output: { counts: { executives: executives?.length, consultants: consultants?.length, departments: departments?.length, kpis: kpis?.length, memory: memory?.length } },
      step_order: 1,
    });

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: JSON.stringify({
        model: "openai/gpt-5.6-sol",
        reasoning_effort: "none",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "system", content: `ORGANIZATION CONTEXT:\n${JSON.stringify(context).slice(0, 14000)}` },
          { role: "user", content: `Request from ${profile?.full_name ?? "a team member"} (${profile?.job_title ?? "member"}):\n"${request}"\n\nRun the deliberation and return the JSON.` },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      await admin.from("cognition_requests").update({ status: "failed", latency_ms: Date.now() - started }).eq("id", requestId);
      return json({ error: "ai_error", status: resp.status, detail: text.slice(0, 500) }, 200);
    }
    const data = await resp.json();
    const raw = data.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try { parsed = JSON.parse(raw); } catch { parsed = { decision_summary: raw, error: "unparseable" }; }

    // Persist steps
    const steps: Array<{ stage: string; actor_type: string; actor_label: string; reasoning: string; output: any; step_order: number }> = [];
    steps.push({ stage: "intent", actor_type: "system", actor_label: "Intent Analyzer", reasoning: parsed.intent ?? "", output: { intent: parsed.intent }, step_order: 2 });
    (parsed.executive_deliberation ?? []).forEach((e: any, i: number) => {
      steps.push({ stage: "executive_deliberation", actor_type: "executive", actor_label: (e.role || "exec").toUpperCase(), reasoning: e.position ?? "", output: e, step_order: 3 + i });
    });
    if (parsed.consultant) {
      steps.push({ stage: "consultant", actor_type: "consultant", actor_label: parsed.consultant.domain ?? "consultant", reasoning: parsed.consultant.recommendation ?? "", output: parsed.consultant, step_order: 20 });
    }
    if (parsed.department) {
      steps.push({ stage: "department_assignment", actor_type: "department", actor_label: parsed.department.name ?? "department", reasoning: parsed.department.rationale ?? "", output: parsed.department, step_order: 21 });
    }
    steps.push({ stage: "execution_plan", actor_type: "consultant", actor_label: "Plan", reasoning: `${(parsed.execution_plan ?? []).length} steps`, output: { plan: parsed.execution_plan }, step_order: 22 });
    steps.push({ stage: "review", actor_type: "executive", actor_label: "CEO Review", reasoning: parsed.decision_summary ?? "", output: { risk: parsed.risk, compliance: parsed.compliance, financial_impact: parsed.financial_impact, success_criteria: parsed.success_criteria }, step_order: 23 });

    await admin.from("cognition_steps").insert(steps.map((s) => ({ ...s, request_id: requestId, organization_id: orgId })));

    // Persist memory
    if (parsed.memory_entry?.title && parsed.memory_entry?.content) {
      await admin.from("organizational_memory").insert({
        organization_id: orgId,
        memory_type: "decision",
        title: parsed.memory_entry.title,
        content: parsed.memory_entry.content,
        tags: parsed.memory_entry.tags ?? [],
        source_request_id: requestId,
        created_by: userData.user.id,
      });
    }

    // Wave 2 — AI Workforce execution: convert execution_plan into real tasks
    // owned by the assigned AI department. Tasks are created with priority derived
    // from risk language and default to `todo` for human/AI worker pickup.
    const createdTasks: Array<{ id: string; title: string }> = [];
    if (Array.isArray(parsed.execution_plan) && parsed.execution_plan.length > 0) {
      const deptName: string | undefined = parsed.department?.name;
      let deptId: string | null = null;
      if (deptName && departments) {
        deptId = departments.find((d: any) => d.name?.toLowerCase() === deptName.toLowerCase())?.id ?? null;
      }
      const priority = /high|urgent|critical|severe/i.test(parsed.risk ?? "") ? "high" : "medium";
      const rows = parsed.execution_plan.slice(0, 12).map((s: any) => ({
        organization_id: orgId,
        title: (s.action ?? "Execution step").toString().slice(0, 240),
        description: [
          s.owner ? `Owner: ${s.owner}` : null,
          s.success_criteria ? `Success criteria: ${s.success_criteria}` : null,
          parsed.intent ? `From deliberation: ${parsed.intent}` : null,
        ].filter(Boolean).join("\n\n"),
        status: "todo" as const,
        priority,
        created_by: userData.user.id,
        department_id: deptId,
        cognition_request_id: requestId,
      }));
      const { data: taskRows } = await admin.from("tasks").insert(rows).select("id, title");
      if (taskRows) createdTasks.push(...taskRows);
    }

    // Graph event
    await admin.from("graph_events").insert({
      organization_id: orgId,
      event_type: "cognition_deliberation",
      actor_id: userData.user.id,
      payload: { request_id: requestId, intent: parsed.intent, department: parsed.department?.name, tasks_created: createdTasks.length },
    });

    const latency = Date.now() - started;
    await admin.from("cognition_requests").update({
      status: "completed",
      intent: parsed.intent,
      outcome: { ...parsed, tasks_created: createdTasks },
      latency_ms: latency,
      completed_at: new Date().toISOString(),
    }).eq("id", requestId);

    return json({ request_id: requestId, latency_ms: latency, tasks_created: createdTasks, ...parsed });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}