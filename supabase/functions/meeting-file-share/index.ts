// In-meeting file sharing: any participant (signed-in staff, founder, or an
// investor guest) can upload documents, images, slides, audio or video into the
// meeting's private storage folder and get a signed link everyone can open.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BUCKET = "meeting-files";
const MAX_BYTES = 200 * 1024 * 1024;
const SIGN_SECONDS = 60 * 60 * 24;

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const safeRoom = (value: unknown) =>
  typeof value === "string" && /^[\w-]{3,80}$/.test(value) ? value : "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return json({ error: "not_configured" }, 500);
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const roomExists = async (room: string) => {
    const [{ data: inv }, { data: mr }] = await Promise.all([
      admin.from("investor_meetings").select("id").eq("room_name", room).maybeSingle(),
      admin.from("meeting_rooms").select("id").eq("room_name", room).maybeSingle(),
    ]);
    return Boolean(inv || mr);
  };

  try {
    const contentType = req.headers.get("content-type") || "";

    // List previously shared files so people who join late see the same set.
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const room = safeRoom(body?.roomName);
      if (!room) return json({ error: "invalid_room" }, 400);
      if (!(await roomExists(room))) return json({ error: "room_not_found" }, 404);

      const { data: objects, error } = await admin.storage.from(BUCKET).list(room, {
        limit: 100,
        sortBy: { column: "created_at", order: "asc" },
      });
      if (error) return json({ error: error.message }, 500);

      const files = await Promise.all(
        (objects ?? []).map(async (o) => {
          const path = `${room}/${o.name}`;
          const { data: signed } = await admin.storage.from(BUCKET).createSignedUrl(path, SIGN_SECONDS);
          return {
            path,
            name: o.name.replace(/^\d+-/, ""),
            size: (o.metadata as { size?: number } | null)?.size ?? 0,
            url: signed?.signedUrl ?? "",
          };
        }),
      );
      return json({ files: files.filter((f) => f.url) });
    }

    const form = await req.formData();
    const room = safeRoom(form.get("roomName"));
    const file = form.get("file");
    if (!room) return json({ error: "invalid_room" }, 400);
    if (!(file instanceof File) || file.size === 0) return json({ error: "no_file" }, 400);
    if (file.size > MAX_BYTES) return json({ error: "file_too_large" }, 413);
    if (!(await roomExists(room))) return json({ error: "room_not_found" }, 404);

    const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(-120) || "shared-file";
    const path = `${room}/${Date.now()}-${safeName}`;
    const { error: upErr } = await admin.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
    if (upErr) return json({ error: upErr.message }, 500);

    const { data: signed } = await admin.storage.from(BUCKET).createSignedUrl(path, SIGN_SECONDS);
    return json({ path, name: file.name, size: file.size, url: signed?.signedUrl ?? "" });
  } catch (error) {
    console.error("[meeting-file-share] failed", error);
    return json({ error: "request_failed" }, 400);
  }
});
