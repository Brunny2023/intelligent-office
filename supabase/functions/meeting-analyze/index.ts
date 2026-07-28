import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

/**
 * Meeting analyzer. Modes:
 *   { mode: "transcribe", recording_id }  → download audio, transcribe via Lovable AI Gateway
 *   { mode: "analyze",    recording_id }  → summarize transcript, extract action items
 *   { mode: "full",       recording_id }  → transcribe + analyze in one call
 *   { mode: "push_tasks", recording_id, indexes:[..] } → create tasks from action items
 *   { mode: "translate",  recording_id, target_lang } → translate summary into target_lang
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
    const mode = body.mode ?? "full";
    const recordingId = body.recording_id;
    if (!recordingId) return json({ error: "recording_id required" }, 400);

    const { data: rec } = await admin.from("meeting_recordings").select("*").eq("id", recordingId).maybeSingle();
    if (!rec || rec.organization_id !== orgId) return json({ error: "not_found" }, 404);

    if (mode === "transcribe" || mode === "full") {
      await admin.from("meeting_recordings").update({ status: "transcribing" }).eq("id", recordingId);
      const { data: fileData, error: dlErr } = await admin.storage.from("recordings").download(rec.storage_path);
      if (dlErr || !fileData) return json({ error: "download_failed", detail: dlErr?.message }, 500);
      const form = new FormData();
      form.append("file", fileData, rec.storage_path.split("/").pop() ?? "audio.webm");
      form.append("model", "openai/gpt-4o-transcribe");
      form.append("response_format", "json");
      const tRes = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}` },
        body: form,
      });
      const tJson: any = await tRes.json().catch(() => ({}));
      if (!tRes.ok) {
        await admin.from("meeting_recordings").update({ status: "failed" }).eq("id", recordingId);
        return json({ error: "transcribe_failed", detail: tJson }, 500);
      }
      const fullText = tJson.text ?? "";
      const language = tJson.language ?? null;
      await admin.from("meeting_transcripts").insert({
        organization_id: orgId, recording_id: recordingId,
        language, full_text: fullText, segments: tJson.segments ?? [],
      });
      await admin.from("meeting_recordings").update({ status: "transcribed" }).eq("id", recordingId);
      if (mode === "transcribe") return json({ transcript: fullText, language });
    }

    if (mode === "analyze" || mode === "full") {
      const { data: transcript } = await admin.from("meeting_transcripts").select("*")
        .eq("recording_id", recordingId).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (!transcript) return json({ error: "no_transcript" }, 404);
      const prompt = `You are analyzing a work meeting transcript. Return strict JSON with this shape:
{"summary": "2-4 sentence executive summary",
 "key_decisions": ["decision 1", ...],
 "action_items": [{"title":"...", "description":"...", "assignee_hint":"name or role or null", "due_hint":"YYYY-MM-DD or null", "priority":"low|medium|high"}],
 "sentiment": "positive|neutral|negative|mixed"}

TRANSCRIPT (${transcript.language ?? "auto"}):
${(transcript.full_text ?? "").slice(0, 12000)}`;
      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
        body: JSON.stringify({
          model: "openai/gpt-5.6-sol",
          reasoning_effort: "none",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        }),
      });
      const aiJson: any = await aiRes.json().catch(() => ({}));
      if (!aiRes.ok) return json({ error: "analyze_failed", detail: aiJson }, 500);
      let parsed: any = {};
      try { parsed = JSON.parse(aiJson?.choices?.[0]?.message?.content ?? "{}"); } catch { /* noop */ }
      const { data: summary } = await admin.from("meeting_summaries").insert({
        organization_id: orgId, recording_id: recordingId,
        summary: parsed.summary ?? "",
        key_decisions: parsed.key_decisions ?? [],
        action_items: parsed.action_items ?? [],
        sentiment: parsed.sentiment ?? null,
      }).select().single();
      await admin.from("meeting_recordings").update({ status: "analyzed" }).eq("id", recordingId);
      return json({ summary });
    }

    if (mode === "push_tasks") {
      const { data: summary } = await admin.from("meeting_summaries").select("*")
        .eq("recording_id", recordingId).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (!summary) return json({ error: "no_summary" }, 404);
      const items: any[] = summary.action_items ?? [];
      const wanted: number[] = body.indexes ?? items.map((_, i) => i);
      const { data: profiles } = await admin.from("profiles").select("id, full_name").eq("organization_id", orgId);
      const findAssignee = (hint: string | null): string | null => {
        if (!hint) return null;
        const h = hint.toLowerCase();
        return profiles?.find((p: any) => p.full_name?.toLowerCase().includes(h))?.id ?? null;
      };
      const inserts = wanted.map((idx) => {
        const it = items[idx]; if (!it) return null;
        return {
          organization_id: orgId,
          title: it.title ?? "Meeting action item",
          description: it.description ?? null,
          status: "todo",
          priority: (["low","medium","high","urgent"].includes(it.priority) ? it.priority : "medium"),
          assigned_to: findAssignee(it.assignee_hint),
          created_by: u.user.id,
          due_date: /^\d{4}-\d{2}-\d{2}$/.test(it.due_hint ?? "") ? it.due_hint : null,
        };
      }).filter(Boolean);
      if (!inserts.length) return json({ created: 0 });
      const { data: created, error } = await admin.from("tasks").insert(inserts as any).select("id, title");
      if (error) return json({ error: error.message }, 500);
      return json({ created: created?.length ?? 0, tasks: created });
    }

    if (mode === "translate") {
      const target = (body.target_lang ?? "en").toString().slice(0, 20);
      const { data: summary } = await admin.from("meeting_summaries").select("*")
        .eq("recording_id", recordingId).order("created_at",{ascending:false}).limit(1).maybeSingle();
      if (!summary) return json({ error: "no_summary" }, 404);
      const prompt = `Translate the following meeting summary, key decisions and action items into ${target}. Return strict JSON {"summary":"...","key_decisions":[...],"action_items":[...]}.\n\nSOURCE:\n${JSON.stringify({summary:summary.summary,key_decisions:summary.key_decisions,action_items:summary.action_items}).slice(0,10000)}`;
      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
        body: JSON.stringify({
          model: "openai/gpt-5.6-sol", reasoning_effort: "none",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        }),
      });
      const aiJson: any = await aiRes.json().catch(() => ({}));
      if (!aiRes.ok) return json({ error: "translate_failed", detail: aiJson }, 500);
      let parsed: any = {};
      try { parsed = JSON.parse(aiJson?.choices?.[0]?.message?.content ?? "{}"); } catch { /* noop */ }
      const existing = (summary.translated_summary as any) ?? {};
      existing[target] = parsed;
      await admin.from("meeting_summaries").update({ translated_summary: existing }).eq("id", summary.id);
      return json({ translated: parsed, lang: target });
    }

    return json({ error: "unknown_mode" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}