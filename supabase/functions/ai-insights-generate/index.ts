import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

const allowedSeverities = new Set(["info", "warning", "critical", "success"]);
const allowedInsightTypes = new Set(["daily_summary", "anomaly", "performance", "task_priority"]);

type Insight = {
  title: string;
  content: string;
  severity: string;
  insight_type: string;
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders });

function validateInsights(value: unknown): Insight[] | null {
  if (!Array.isArray(value)) return null;

  const insights = value.filter((item): item is Insight => {
    if (!item || typeof item !== "object") return false;
    const candidate = item as Record<string, unknown>;
    return (
      typeof candidate.title === "string" && candidate.title.trim().length > 0 &&
      typeof candidate.content === "string" && candidate.content.trim().length > 0 &&
      typeof candidate.severity === "string" && allowedSeverities.has(candidate.severity) &&
      typeof candidate.insight_type === "string" && allowedInsightTypes.has(candidate.insight_type)
    );
  });

  return insights.length === value.length && insights.length > 0 ? insights : null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const payload = await req.json();
    const context = typeof payload?.context === "string" ? payload.context.trim() : "";
    const orgId = typeof payload?.orgId === "string" ? payload.orgId.trim() : "";
    if (!context || !orgId) {
      return jsonResponse({ error: "context and orgId are required" }, 400);
    }

    const gatewayUrl = Deno.env.get("AI_GATEWAY_URL");
    const gatewayKey = Deno.env.get("AI_GATEWAY_API_KEY");
    if (!gatewayUrl || !gatewayKey) {
      return jsonResponse({ error: "AI gateway is not configured" }, 500);
    }

    const response = await fetch(`${gatewayUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${gatewayKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are an AI business intelligence analyst. Return ONLY a JSON array of 4-7 actionable objects with title, content, severity (info|warning|critical|success), and insight_type (daily_summary|anomaly|performance|task_priority). Keep content to 1-2 sentences and ground every insight in the supplied organization context.",
          },
          { role: "user", content: context },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      return jsonResponse({ error: "AI gateway request failed" }, 502);
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;
    const jsonMatch = typeof text === "string" ? text.match(/\[[\s\S]*\]/) : null;
    const insights = jsonMatch ? validateInsights(JSON.parse(jsonMatch[0])) : null;
    if (!insights) {
      return jsonResponse({ error: "AI response did not match the insight schema" }, 502);
    }

    return jsonResponse({ insights });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected AI function error";
    return jsonResponse({ error: message }, 500);
  }
});
