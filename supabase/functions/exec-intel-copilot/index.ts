import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AI_GATEWAY_API_KEY = Deno.env.get("AI_GATEWAY_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Compact, high-signal Investor Knowledge Base. Every fact must be citable.
// Sourced from public/investor-pack/ documents. Keep terse — the model gets
// this whole blob as retrieval context.
const INVESTOR_KB = {
  company: {
    name: "Intelligent Office",
    tagline: "The Organizational Intelligence Layer for the Enterprise",
    stage: "Pre-seed, pre-launch commercial",
    incorporation: "the Intelligent Office showcase project — a Delaware C-Corporation",
    hq: "Global (remote-first, Africa origin, global roadmap)",
  },
  raise: {
    round: "Pre-seed",
    ask_usd: "$3.0M",
    valuation_cap_usd: "$18M post-money target",
    use_of_funds: "40% product & AI, 30% GTM, 20% team, 10% ops",
    runway_months: 24,
  },
  traction: {
    status: "Pre-revenue; product built; investor pack complete; commercial pilots pending",
    pipeline: "Design partners in negotiation across finance, professional services, and public sector",
    pilot_orgs_target_year_1: 25,
  },
  financials_projection: {
    year_1_arr_usd: "$0.4M",
    year_2_arr_usd: "$2.8M",
    year_3_arr_usd: "$11.5M",
    gross_margin_target: "84-88% at scale",
    cac_target_usd: "$1,800",
    ltv_target_usd: "$28,000",
    ltv_cac: "15.5x steady state",
    payback_months: "6-9 months CAC payback",
    burn_month_usd: "$125K target average",
  },
  market: {
    tam_usd: "$210B enterprise productivity + intelligence software (Gartner 2024)",
    sam_usd: "$62B SMB + mid-market ops & intelligence tooling",
    som_5yr_usd: "$1.4B addressable across emerging-markets scale-ups",
    growth_rate: "13.6% CAGR through 2028",
  },
  moat: [
    "Organizational Intelligence Graph — Postgres-modeled substrate of entities, edges, events across every module",
    "Executive Intelligence Layer — private founder/executive copilot grounded on the graph, not generic LLM",
    "Consent-native inter-org fabric — Partner Connect with cryptographic audit trail",
    "Compliance-first: NDPR/GDPR retention, immutable signature ledger, tenant-isolated data",
    "Emerging-markets first design: offline-tolerant, low-bandwidth, mobile-first",
  ],
  product_modules: [
    "Execution (tasks, projects, kanban, workload)",
    "Attendance & HR (clock-in, leave, payroll, reviews)",
    "Meetings (LiveKit with server-side egress, AI transcripts, summaries)",
    "Communications (channels, org-to-org messaging)",
    "Documents & Memos (digital signatures, chain-hashed ledger)",
    "AI Insights (predictive alerts, escalation, notification prefs)",
    "Workflows (visual IF/THEN automation)",
    "Intelligence Graph & Executive Copilot",
    "Super Admin (tenant, usage, health, egress monitoring)",
  ],
  competitors_positioning: {
    vs_microsoft_365: "Not another productivity suite. Intelligence layer that reasons over the whole org.",
    vs_slack_notion: "Communications and docs are commodity. We own the graph beneath them.",
    vs_generic_ai: "Not a chat toy — grounded, cited, consent-scoped enterprise intelligence.",
    vs_odoo_zoho: "Emerging-market-native pricing and posture, AI-first, not ERP-first.",
  },
  team: {
    founder: "Emmanuel (Manny), Founder & CEO — the Intelligent Office showcase project",
    hiring_priorities: ["Head of AI/ML", "Head of GTM (Enterprise)", "Head of Compliance", "2 Senior Engineers"],
  },
  roadmap: {
    now: "Commercial-grade platform live; investor pack complete; pilots opening",
    next_6_months: "Design partners; SOC 2 Type I; multi-region deploy; verticalize onboarding",
    next_12_months: "$2.8M ARR target; Series A prep; expand to 3 emerging markets",
  },
  risks_mitigations: [
    "Category risk — mitigated by pilot-led narrative and cited moat",
    "Enterprise sales cycle — mitigated by consultancy-led pilots and DFI partnerships",
    "AI cost — mitigated by grounded retrieval + configured AI Gateway pooling",
    "Talent — mitigated by remote-first stack and equity generosity",
  ],
  sources: {
    pitch_deck: "Global-Office-Investor-Deck.pptx",
    financial_model: "Global-Office-Financial-Model.xlsx",
    business_plan: "Global-Office-Business-Plan.docx",
    memo: "Global-Office-Investment-Memorandum.docx",
    faq: "Global-Office-Investor-FAQ.docx",
    market: "Global-Office-Market-Research.docx",
    competitors: "Global-Office-Competitive-Analysis.docx",
    strategy: "Global-Office-Product-Strategy.docx",
    dd: "Global-Office-Due-Diligence-Package.docx",
  },
};

const SYSTEM_PROMPT = `You are the Executive Intelligence Copilot — a PRIVATE, silent advisor to the founder during a live investor meeting. The investor cannot see you. You never speak, you only assist the founder.

RESPONSE CONTRACT (STRICT JSON, one of three shapes):

1. ANSWER — high confidence, single unambiguous answer grounded in the knowledge base:
   {"mode":"answer","headline":"<max 12 words, one fact>","source":{"label":"<short label>","ref":"<filename from sources>"},"expand":{"metrics":["…","…"],"talking_points":["…","…","…"]},"followUps":["q1","q2","q3","q4"]}

2. CLARIFY — question is ambiguous or has multiple valid interpretations. DO NOT GUESS:
   {"mode":"clarify","question":"<single one-line clarification>","followUps":[]}

3. MANUAL — low confidence, insufficient grounding, or off-domain:
   {"mode":"manual","hint":"<one short line telling founder to answer manually — e.g. 'Speak from experience — no grounded data.'>","followUps":[]}

RULES:
- NEVER produce paragraphs, ChatGPT-style explanations, chain-of-thought, or probabilities.
- Headlines are glanceable: number + unit, or short noun phrase.
- ALWAYS return valid JSON — no prose outside the JSON, no markdown fences.
- If grounded fact exists in the KB, always use ANSWER (not MANUAL).
- followUps: 3-5 likely next investor questions, terse.
- expand.metrics: adjacent numbers the founder might need next.
- expand.talking_points: 2-3 short lines the founder can say naturally, sound like a confident executive, no jargon.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: userData } = await admin.auth.getUser(authHeader.slice(7));
    if (!userData?.user) return json({ error: "unauthorized" }, 401);

    const { data: isAdmin } = await admin.rpc("is_platform_admin", { _user_id: userData.user.id });
    if (!isAdmin) return json({ error: "forbidden" }, 403);

    const body = await req.json();
    const utterance: string = (body.utterance ?? "").toString().trim();
    const meetingId: string | null = body.meetingId ?? null;
    const roomName: string = body.roomName ?? "";
    const history: Array<{ role: string; text: string }> = body.history ?? [];

    if (!utterance) return json({ error: "utterance required" }, 400);

    const start = Date.now();

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "system", content: `INVESTOR KNOWLEDGE BASE:\n${JSON.stringify(INVESTOR_KB)}` },
      ...history.slice(-6).map((h) => ({ role: h.role === "investor" ? "user" : "assistant", content: h.text })),
      { role: "user", content: `Investor just said: "${utterance}"\n\nReturn the JSON per contract.` },
    ];

    const resp = await fetch("https://your-ai-gateway.example/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${AI_GATEWAY_API_KEY}` },
      body: JSON.stringify({
        model: "openai/gpt-5.6-sol",
        reasoning_effort: "none",
        service_tier: "priority",
        messages,
        response_format: { type: "json_object" },
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.warn("founder_copilot_ai_error", {
        latency_ms: Date.now() - start,
        status: resp.status,
      });
      return json({ error: "ai_error", status: resp.status, detail: t.slice(0, 400) }, 200);
    }
    const data = await resp.json();
    const raw = data.choices?.[0]?.message?.content ?? "{}";
    let parsed: unknown;
    try { parsed = JSON.parse(raw); }
    catch { parsed = { mode: "manual", hint: "Copilot output unreadable — answer manually.", followUps: [] }; }

    const latency = Date.now() - start;
    console.info("founder_copilot_request", {
      latency_ms: latency,
      mode: (parsed as { mode?: string } | null)?.mode ?? "unknown",
      persisted: Boolean(meetingId),
    });

    // Persist Q&A for post-meeting review
    if (meetingId) {
      admin.from("investor_meeting_qa").insert({
        meeting_id: meetingId,
        room_name: roomName,
        utterance,
        answer: parsed as any,
        latency_ms: latency,
      }).then(() => {});
    }

    return json({ ...(parsed as object), latency_ms: latency });
  } catch (err) {
    console.error("founder_copilot_request_failed", {
      error: (err as Error).message,
    });
    return json({ error: (err as Error).message }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}