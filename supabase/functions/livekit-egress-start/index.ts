import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function egressAdminToken(apiKey: string, apiSecret: string, roomName: string): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: apiKey,
    sub: apiKey,
    nbf: now,
    exp: now + 600,
    iat: now,
    video: { roomRecord: true, roomAdmin: true, room: roomName },
  };
  const enc = (o: unknown) => btoa(JSON.stringify(o)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const signingInput = `${enc(header)}.${enc(payload)}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(apiSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signingInput));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${signingInput}.${sigB64}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false },
    });

    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    const { data: { user } } = await admin.auth.getUser(jwt);
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { roomName, roomId } = await req.json();
    if (!roomName || !roomId) {
      return new Response(JSON.stringify({ error: "roomName and roomId required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Load caller's org + egress setting
    const { data: prof } = await admin.from("profiles").select("organization_id").eq("id", user.id).single();
    if (!prof?.organization_id) {
      return new Response(JSON.stringify({ error: "No organization" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { data: org } = await admin.from("organizations").select("id, egress_enabled, egress_mode").eq("id", prof.organization_id).single();
    if (!org?.egress_enabled) {
      return new Response(JSON.stringify({ error: "Server-side recording is disabled for this organization" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Validate room belongs to caller's org
    const { data: room } = await admin.from("meeting_rooms").select("id, organization_id, room_name").eq("id", roomId).single();
    if (!room || room.organization_id !== prof.organization_id || room.room_name !== roomName) {
      return new Response(JSON.stringify({ error: "Invalid room" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Idempotency: if an active egress already exists for this room, return it
    const { data: existing } = await admin.from("meeting_recordings")
      .select("id, egress_id, egress_status")
      .eq("room_id", roomId).eq("source", "egress")
      .in("egress_status", ["starting", "active"])
      .maybeSingle();
    if (existing?.egress_id) {
      return new Response(JSON.stringify({ recording_id: existing.id, egress_id: existing.egress_id, reused: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const livekitUrl = Deno.env.get("LIVEKIT_URL")!;
    const apiKey = Deno.env.get("LIVEKIT_API_KEY")!;
    const apiSecret = Deno.env.get("LIVEKIT_API_SECRET")!;
    const s3Key = Deno.env.get("LIVEKIT_S3_ACCESS_KEY");
    const s3Secret = Deno.env.get("LIVEKIT_S3_SECRET");
    const s3Bucket = Deno.env.get("LIVEKIT_S3_BUCKET") ?? "recordings";
    const s3Region = Deno.env.get("LIVEKIT_S3_REGION") ?? "us-east-1";
    const s3Endpoint = Deno.env.get("LIVEKIT_S3_ENDPOINT");

    if (!s3Key || !s3Secret || !s3Endpoint) {
      return new Response(JSON.stringify({ error: "S3 storage not configured for egress" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const audioOnly = org.egress_mode === "audio_only";
    const ext = audioOnly ? "ogg" : "mp4";
    const fileType = audioOnly ? "OGG" : "MP4";
    const filepath = `${prof.organization_id}/${roomId}/${Date.now()}.${ext}`;

    const twirpBody = {
      room_name: roomName,
      layout: "grid",
      audio_only: audioOnly,
      file_outputs: [{
        file_type: fileType,
        filepath,
        s3: {
          access_key: s3Key,
          secret: s3Secret,
          region: s3Region,
          bucket: s3Bucket,
          endpoint: s3Endpoint,
          force_path_style: true,
        },
      }],
    };

    const token = await egressAdminToken(apiKey, apiSecret, roomName);
    const httpsUrl = livekitUrl.replace(/^ws/, "http").replace(/^wss/, "https");
    const res = await fetch(`${httpsUrl}/twirp/livekit.Egress/StartRoomCompositeEgress`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(twirpBody),
    });

    const info = await res.json();
    if (!res.ok) {
      await admin.from("egress_events").insert({
        organization_id: prof.organization_id, event_type: "start_failed",
        error: info?.msg ?? info?.error ?? "unknown", payload: info,
      });
      return new Response(JSON.stringify({ error: info?.msg ?? "Egress start failed", details: info }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const egressId = info.egress_id ?? info.egressId;
    const { data: rec, error: recErr } = await admin.from("meeting_recordings").insert({
      organization_id: prof.organization_id,
      room_id: roomId,
      uploaded_by: user.id,
      storage_path: filepath,
      mime_type: audioOnly ? "audio/ogg" : "video/mp4",
      status: "recording",
      source: "egress",
      egress_id: egressId,
      egress_status: "starting",
      egress_started_at: new Date().toISOString(),
    }).select().single();

    if (recErr) {
      return new Response(JSON.stringify({ error: recErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await admin.from("egress_events").insert({
      organization_id: prof.organization_id, recording_id: rec.id, egress_id: egressId,
      event_type: "started", status: "starting", payload: info,
    });

    return new Response(JSON.stringify({ recording_id: rec.id, egress_id: egressId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});