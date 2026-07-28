import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// LiveKit signs webhook bodies with a JWT in the Authorization header.
// Token payload has `sha` claim = base64(SHA-256(body)). Verify with API secret.
async function verifyLiveKitWebhook(authHeader: string, body: string, apiSecret: string): Promise<boolean> {
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [h, p, s] = parts;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(apiSecret),
    { name: "HMAC", hash: "SHA-256" }, false, ["verify"],
  );
  const sigBytes = Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "==".slice((s.length + 2) % 4)), c => c.charCodeAt(0));
  const ok = await crypto.subtle.verify("HMAC", key, sigBytes, enc.encode(`${h}.${p}`));
  if (!ok) return false;

  const payload = JSON.parse(atob(p.replace(/-/g, "+").replace(/_/g, "/")));
  const bodyHash = await crypto.subtle.digest("SHA-256", enc.encode(body));
  const bodyHashB64 = btoa(String.fromCharCode(...new Uint8Array(bodyHash)));
  return payload.sha === bodyHashB64;
}

// Exported for tests
export async function handleEgressPayload(
  payload: any,
  admin: any,
  invokeAnalyze: (recordingId: string) => Promise<void>,
): Promise<{ ok: boolean; recording_id?: string; skipped?: string }> {
  const info = payload.egressInfo ?? payload.egress_info;
  if (!info) return { ok: false, skipped: "no egressInfo" };
  const egressId = info.egressId ?? info.egress_id;
  if (!egressId) return { ok: false, skipped: "no egressId" };

  const { data: rec } = await admin.from("meeting_recordings")
    .select("id, organization_id, status")
    .eq("egress_id", egressId).maybeSingle();
  if (!rec) return { ok: false, skipped: "recording not found" };

  // LiveKit status codes: EGRESS_STARTING=0, ACTIVE=1, ENDING=2, COMPLETE=3, FAILED=4, ABORTED=5, LIMIT_REACHED=6
  const statusMap: Record<string, string> = {
    EGRESS_STARTING: "starting", EGRESS_ACTIVE: "active", EGRESS_ENDING: "ending",
    EGRESS_COMPLETE: "complete", EGRESS_FAILED: "failed", EGRESS_ABORTED: "aborted", EGRESS_LIMIT_REACHED: "limit_reached",
    "0": "starting", "1": "active", "2": "ending", "3": "complete", "4": "failed", "5": "aborted", "6": "limit_reached",
  };
  const rawStatus = String(info.status ?? "");
  const normalized = statusMap[rawStatus] ?? rawStatus.toLowerCase();
  const eventType = payload.event ?? "egress_updated";

  const fileResults = info.fileResults ?? info.file_results ?? [];
  const first = fileResults[0];
  // LiveKit reports duration in nanoseconds as string
  const durationNs = first?.duration ? Number(first.duration) : null;
  const durationSec = durationNs ? Math.max(1, Math.round(durationNs / 1_000_000_000)) : null;
  const size = first?.size ? Number(first.size) : null;
  const filename = first?.filename ?? first?.location ?? null;

  const update: Record<string, unknown> = {
    egress_status: normalized,
    egress_error: info.error ?? null,
  };
  if (["complete", "failed", "aborted", "limit_reached"].includes(normalized)) {
    update.egress_ended_at = new Date().toISOString();
  }
  if (durationSec) update.duration_seconds = durationSec;
  if (size) update.file_size = size;
  if (filename) update.storage_path = filename.replace(/^s3:\/\/[^/]+\//, "");
  if (normalized === "complete") update.status = "ready";
  if (normalized === "failed" || normalized === "aborted") update.status = "failed";

  await admin.from("meeting_recordings").update(update).eq("id", rec.id);

  await admin.from("egress_events").insert({
    organization_id: rec.organization_id, recording_id: rec.id, egress_id: egressId,
    event_type: eventType, status: normalized, error: info.error ?? null, payload: info,
  });

  // On failure, raise an operator alert
  if (normalized === "failed" || normalized === "aborted") {
    await admin.from("ai_insights").insert({
      organization_id: rec.organization_id,
      insight_type: "egress_failed",
      title: "Meeting recording failed",
      content: `Server-side recording ${normalized}: ${info.error ?? "no error message"}`,
      severity: "high", status: "open",
      metadata: { recording_id: rec.id, egress_id: egressId, error: info.error ?? null },
      reason: { signals: [{ type: "egress_status", value: normalized }, { type: "egress_error", value: info.error ?? null }] },
    });
  }

  // On completion, hand off to AI analysis
  if (normalized === "complete") {
    try { await invokeAnalyze(rec.id); } catch (e) { console.error("analyze invoke failed", e); }
  }

  return { ok: true, recording_id: rec.id };
}

serve(async (req) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });

  const body = await req.text();
  const auth = req.headers.get("Authorization") ?? "";
  const apiSecret = Deno.env.get("LIVEKIT_API_SECRET");
  if (!apiSecret) return new Response("misconfigured", { status: 500 });

  const ok = await verifyLiveKitWebhook(auth, body, apiSecret);
  if (!ok) return new Response("invalid signature", { status: 401 });

  let payload: any;
  try { payload = JSON.parse(body); } catch { return new Response("bad json", { status: 400 }); }

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const supaUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const result = await handleEgressPayload(payload, admin, async (recordingId) => {
    await fetch(`${supaUrl}/functions/v1/meeting-analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
      body: JSON.stringify({ mode: "full", recording_id: recordingId }),
    });
  });

  return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
});