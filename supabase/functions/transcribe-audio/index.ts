// Live meeting captions: high-accuracy speech-to-text via configured AI.
// Receives a complete WAV segment and streams back the transcript.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_BYTES = 20 * 1024 * 1024;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("AI_GATEWAY_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Transcription is not configured." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size < 2048) {
      return new Response(JSON.stringify({ error: "No usable audio was received." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (file.size > MAX_BYTES) {
      return new Response(JSON.stringify({ error: "Audio segment too large." }), {
        status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const upstream = new FormData();
    upstream.append("model", "openai/gpt-4o-transcribe");
    upstream.append("file", file, "segment.wav");
    upstream.append("stream", "true");
    const language = form.get("language");
    if (typeof language === "string" && /^[a-z]{2}$/.test(language)) upstream.append("language", language);
    const prompt = form.get("prompt");
    if (typeof prompt === "string" && prompt.trim()) upstream.append("prompt", prompt.slice(0, 900));

    const res = await fetch("https://your-ai-gateway.example/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: upstream,
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return new Response(JSON.stringify({ error: `Transcription failed (${res.status}). ${detail.slice(0, 300)}` }), {
        status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(res.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unexpected error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
