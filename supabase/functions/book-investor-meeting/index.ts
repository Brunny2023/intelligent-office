import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type BookingRequest = {
  investorName?: unknown;
  investorEmail?: unknown;
  investorOrg?: unknown;
  scheduledAt?: unknown;
  notes?: unknown;
};

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function cleanString(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const body = (await req.json()) as BookingRequest;
    const investorName = cleanString(body.investorName, 160);
    const investorEmail = cleanString(body.investorEmail, 320).toLowerCase();
    const investorOrg = cleanString(body.investorOrg, 200) || null;
    const notes = cleanString(body.notes, 4000) || null;
    const scheduledAtRaw = cleanString(body.scheduledAt, 80);

    if (!investorName) return json({ error: "name_required" }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(investorEmail)) {
      return json({ error: "valid_email_required" }, 400);
    }

    let scheduledAt: string | null = null;
    if (scheduledAtRaw) {
      const parsed = new Date(scheduledAtRaw);
      if (Number.isNaN(parsed.getTime()))
        return json({ error: "invalid_schedule" }, 400);
      scheduledAt = parsed.toISOString();
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey)
      return json({ error: "database_not_configured" }, 500);

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const roomName = `inv-${crypto.randomUUID().slice(0, 8)}`;
    const { data: meeting, error } = await admin
      .from("investor_meetings")
      .insert({
        room_name: roomName,
        investor_name: investorName,
        investor_email: investorEmail,
        investor_org: investorOrg,
        scheduled_at: scheduledAt,
        notes,
      })
      .select("id, access_token, room_name")
      .single();

    if (error || !meeting) {
      console.error("[book-investor-meeting] insert failed", error);
      return json({ error: "booking_unavailable" }, 503);
    }

    return json({
      id: meeting.id,
      roomName: meeting.room_name,
      accessToken: meeting.access_token,
    });
  } catch (error) {
    console.error("[book-investor-meeting] request failed", error);
    return json({ error: "invalid_request" }, 400);
  }
});
