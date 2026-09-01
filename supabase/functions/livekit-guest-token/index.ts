import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function createLiveKitToken(apiKey: string, apiSecret: string, roomName: string, participantName: string, participantIdentity: string): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: apiKey,
    sub: participantIdentity,
    name: participantName,
    nbf: now,
    exp: now + 60 * 60 * 12,
    iat: now,
    video: { roomJoin: true, room: roomName, canPublish: true, canSubscribe: true, canPublishData: true },
  };
  const encode = (o: unknown) => btoa(JSON.stringify(o)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const signingInput = `${encode(header)}.${encode(payload)}`;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(apiSecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(signingInput));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${signingInput}.${sigB64}`;
}

// The LIVEKIT_API_KEY secret is sometimes pasted as a full LiveKit access token
// instead of the bare API key. A token's `iss` claim IS the API key, so recover
// it rather than signing rooms with an issuer LiveKit rejects ("invalid API key").
export function normalizeApiKey(raw: string): string {
  const parts = raw.trim().split(".");
  if (parts.length !== 3) return raw.trim();
  try {
    const b = parts[1].replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(parts[1].length / 4) * 4, "=");
    const claims = JSON.parse(atob(b)) as { iss?: string };
    return typeof claims.iss === "string" && claims.iss ? claims.iss : raw.trim();
  } catch {
    return raw.trim();
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const accessToken: string | undefined = body?.accessToken;
    const code: string | undefined = body?.code;
    if (!accessToken && !code) return json({ error: "accessToken required" }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const query = admin
      .from("investor_meetings")
      .select("id, room_name, investor_name, status");
    const { data: meeting, error } = accessToken
      ? await query.eq("access_token", accessToken).maybeSingle()
      : await query.eq("short_code", code).maybeSingle();

    if (error || !meeting) return json({ error: "invalid_token" }, 404);
    if (meeting.status === "cancelled") return json({ error: "cancelled" }, 403);

    const rawApiKey = Deno.env.get("LIVEKIT_API_KEY");
    const apiKey = rawApiKey ? normalizeApiKey(rawApiKey) : rawApiKey;
    const apiSecret = Deno.env.get("LIVEKIT_API_SECRET");
    const livekitUrl = Deno.env.get("LIVEKIT_URL");
    if (!apiKey || !apiSecret || !livekitUrl) return json({ error: "livekit_not_configured" }, 500);

    // Unique per connection so a reconnect (or a second device) never evicts
    // the participant already in the room via an identity collision.
    const identity = `guest-${meeting.id}-${crypto.randomUUID().slice(0, 8)}`;
    const token = await createLiveKitToken(apiKey, apiSecret, meeting.room_name, meeting.investor_name, identity);

    await admin.from("investor_analytics").insert({
      meeting_id: meeting.id,
      event_type: "meeting_joined",
      metadata: { role: "investor" },
    });

    return json({ token, url: livekitUrl, roomName: meeting.room_name, investorName: meeting.investor_name, meetingId: meeting.id });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}