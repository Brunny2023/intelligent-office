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
    exp: now + 60 * 60 * 4,
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { accessToken } = await req.json();
    if (!accessToken) return json({ error: "accessToken required" }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: meeting, error } = await admin
      .from("investor_meetings")
      .select("id, room_name, investor_name, status")
      .eq("access_token", accessToken)
      .maybeSingle();

    if (error || !meeting) return json({ error: "invalid_token" }, 404);
    if (meeting.status === "cancelled") return json({ error: "cancelled" }, 403);

    const apiKey = Deno.env.get("LIVEKIT_API_KEY");
    const apiSecret = Deno.env.get("LIVEKIT_API_SECRET");
    const livekitUrl = Deno.env.get("LIVEKIT_URL");
    if (!apiKey || !apiSecret || !livekitUrl) return json({ error: "livekit_not_configured" }, 500);

    const identity = `guest-${meeting.id}`;
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