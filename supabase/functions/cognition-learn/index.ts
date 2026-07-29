import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const SYSTEM = `You are the continuous learning engine of an Enterprise Cognition Platform. You will receive a JSON digest of the last 24 hours of an organization's activity: completed tasks, published memos, meeting summaries, KPI movements, and closed deliberations.

Extract 3-8 durable lessons the organization should remember for future decisions. Each lesson must be specific, actionable, and grounded in the digest — no generic advice.

Return STRICT JSON:
{
  "lessons": [
    { "memory_type": "decision|precedent|pattern|risk|opportunity",
      "title": "<8-12 words>",
      "content": "<2-4 sentences of what happened and what to remember>",
      "tags": ["<domain>", "<theme>"] }
  ]
}
If nothing meaningful happened, return { "lessons": [] }.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const body = await req.json().catch(() => ({}));
    const targetOrg: string | null = body.organization_id ?? null;

    const { data: orgs } = targetOrg
      ? await admin.from("organizations").select("id, name").eq("id", targetOrg)
      : await admin.from("organizations").select("id, name");

    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const results: Array<{ organization_id: string; lessons: number; error?: string }> = [];

    for (const org of orgs ?? []) {
      try {
        const [tasks, memos, meetings, kpis, delibs] = await Promise.all([
          admin.from("tasks").select("title, status, priority, completed_at, description")
            .eq("organization_id", org.id).eq("status", "completed").gte("completed_at", since).limit(30),
          admin.from("internal_memos").select("title, content, status, published_at")
            .eq("organization_id", org.id).gte("published_at", since).limit(10),
          admin.from("meeting_summaries").select("summary, key_decisions, action_items, created_at")
            .eq("organization_id", org.id).gte("created_at", since).limit(10),
          admin.from("kpis").select("title, current_value, target_value, unit, status, updated_at")
            .eq("organization_id", org.id).gte("updated_at", since).limit(20),
          admin.from("cognition_requests").select("intent, outcome, completed_at")
            .eq("organization_id", org.id).eq("status", "completed").gte("completed_at", since).limit(10),
        ]);

        const digest = {
          organization: org.name,
          window: "last_24h",
          completed_tasks: tasks.data,
          published_memos: memos.data,
          meeting_summaries: meetings.data,
          kpi_movements: kpis.data,
          deliberations: delibs.data,
        };
        const totalItems = (tasks.data?.length ?? 0) + (memos.data?.length ?? 0) +
          (meetings.data?.length ?? 0) + (kpis.data?.length ?? 0) + (delibs.data?.length ?? 0);
        if (totalItems === 0) { results.push({ organization_id: org.id, lessons: 0 }); continue; }

        const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
          body: JSON.stringify({
            model: "openai/gpt-5.6-sol",
            reasoning_effort: "none",
            messages: [
              { role: "system", content: SYSTEM },
              { role: "user", content: `DIGEST:\n${JSON.stringify(digest).slice(0, 16000)}` },
            ],
            response_format: { type: "json_object" },
          }),
        });
        if (!resp.ok) { results.push({ organization_id: org.id, lessons: 0, error: `ai_${resp.status}` }); continue; }
        const data = await resp.json();
        const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
        const lessons: any[] = Array.isArray(parsed.lessons) ? parsed.lessons : [];
        if (lessons.length === 0) { results.push({ organization_id: org.id, lessons: 0 }); continue; }

        const rows = lessons.slice(0, 10).map((l) => ({
          organization_id: org.id,
          memory_type: (l.memory_type ?? "pattern").toString().slice(0, 32),
          title: (l.title ?? "Daily lesson").toString().slice(0, 240),
          content: (l.content ?? "").toString().slice(0, 4000),
          tags: Array.isArray(l.tags) ? l.tags.slice(0, 8).map((t: any) => t.toString().slice(0, 40)) : [],
        }));
        await admin.from("organizational_memory").insert(rows);
        await admin.from("graph_events").insert({
          organization_id: org.id,
          event_type: "cognition_learning_cycle",
          payload: { lessons: rows.length, window: "24h" },
        });
        results.push({ organization_id: org.id, lessons: rows.length });
      } catch (e) {
        results.push({ organization_id: org.id, lessons: 0, error: (e as Error).message });
      }
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});