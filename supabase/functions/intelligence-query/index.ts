import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const AI_GATEWAY_API_KEY = Deno.env.get("AI_GATEWAY_API_KEY")!;

type Question =
  | "overloaded_people"
  | "at_risk_projects"
  | "blocker_chains"
  | "collaboration_density"
  | "pending_decisions"
  | "workload_by_person"
  | "org_summary"
  | "custom";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "unauthorized" }, 401);
    }
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: userData, error: userErr } = await admin.auth.getUser(authHeader.slice(7));
    if (userErr || !userData.user) return json({ error: "unauthorized" }, 401);

    const { data: profile } = await admin
      .from("profiles").select("organization_id").eq("id", userData.user.id).maybeSingle();
    const orgId = profile?.organization_id;
    if (!orgId) return json({ error: "no_organization" }, 403);

    const body = await req.json().catch(() => ({}));
    const question: Question = body.question ?? "org_summary";
    const prompt: string | undefined = body.prompt;

    // Fetch graph facts scoped to org (service role, so RLS is bypassed but we pin org).
    const facts = await gatherFacts(admin, orgId, question);

    // Ask the model to synthesize an answer grounded ONLY in the facts we provide.
    const messages = [
      {
        role: "system",
        content:
          "You are the Intelligent Office Organizational Intelligence advisor. Answer ONLY using the JSON facts provided. Cite entities by their label and id. If the facts do not support an answer, say so clearly. Return 3-6 short bullet points, each concrete and actionable. Never invent numbers.",
      },
      {
        role: "user",
        content: `Question: ${prompt ?? question}\n\nGraph facts:\n${JSON.stringify(facts).slice(0, 12000)}`,
      },
    ];

    const resp = await fetch("https://your-ai-gateway.example/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Configured Provider-API-Key": AI_GATEWAY_API_KEY,
      },
      body: JSON.stringify({
        model: "openai/gpt-5.6-sol",
        reasoning_effort: "none",
        messages,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return json({ error: "ai_error", status: resp.status, detail: text.slice(0, 500), facts }, 200);
    }
    const data = await resp.json();
    const answer = data.choices?.[0]?.message?.content ?? "";
    return json({ question, answer, facts });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function gatherFacts(admin: ReturnType<typeof createClient>, orgId: string, q: Question) {
  const facts: Record<string, unknown> = {};

  if (q === "overloaded_people" || q === "workload_by_person" || q === "org_summary") {
    const { data } = await admin.rpc("graph_workload_by_person", { _org: orgId }).select("*");
    facts.workload = data ?? (await workloadFallback(admin, orgId));
  }
  if (q === "at_risk_projects" || q === "org_summary") {
    const { data: projects } = await admin
      .from("projects").select("id, name, status, due_date")
      .eq("organization_id", orgId);
    const at_risk: Array<Record<string, unknown>> = [];
    for (const p of projects ?? []) {
      const { count: blocked } = await admin
        .from("tasks").select("id", { count: "exact", head: true })
        .eq("project_id", p.id).eq("status", "blocked");
      const { count: overdue } = await admin
        .from("tasks").select("id", { count: "exact", head: true })
        .eq("project_id", p.id).lt("due_date", new Date().toISOString())
        .neq("status", "completed");
      if ((blocked ?? 0) > 0 || (overdue ?? 0) > 0) {
        at_risk.push({ ...p, blocked, overdue });
      }
    }
    facts.at_risk_projects = at_risk;
  }
  if (q === "blocker_chains" || q === "org_summary") {
    const { data } = await admin
      .from("tasks").select("id, title, assigned_to, due_date")
      .eq("organization_id", orgId).eq("status", "blocked").limit(25);
    facts.blocked_tasks = data ?? [];
  }
  if (q === "collaboration_density" || q === "org_summary") {
    const since = new Date(Date.now() - 7 * 86400_000).toISOString();
    const { count: msg7d } = await admin
      .from("graph_events").select("id", { count: "exact", head: true })
      .eq("organization_id", orgId).eq("event_type", "mentioned").gte("occurred_at", since);
    facts.messages_7d = msg7d ?? 0;
  }
  if (q === "pending_decisions" || q === "org_summary") {
    const { data } = await admin
      .from("tasks").select("id, title, priority, due_date")
      .eq("organization_id", orgId).eq("status", "review").limit(25);
    facts.pending_review = data ?? [];
  }

  const { count: entities } = await admin
    .from("graph_entities").select("id", { count: "exact", head: true })
    .eq("organization_id", orgId);
  const { count: edges } = await admin
    .from("graph_edges").select("id", { count: "exact", head: true })
    .eq("organization_id", orgId);
  facts.graph_size = { entities: entities ?? 0, edges: edges ?? 0 };

  return facts;
}

async function workloadFallback(admin: ReturnType<typeof createClient>, orgId: string) {
  const { data } = await admin
    .from("tasks").select("assigned_to, status")
    .eq("organization_id", orgId);
  const map = new Map<string, { open: number; blocked: number; completed: number }>();
  for (const t of data ?? []) {
    if (!t.assigned_to) continue;
    const rec = map.get(t.assigned_to) ?? { open: 0, blocked: 0, completed: 0 };
    if (t.status === "completed") rec.completed++;
    else if (t.status === "blocked") rec.blocked++;
    else rec.open++;
    map.set(t.assigned_to, rec);
  }
  return Array.from(map.entries()).map(([user_id, v]) => ({ user_id, ...v }));
}