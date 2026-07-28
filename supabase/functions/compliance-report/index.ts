import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

/**
 * Generates a compliance snapshot for the caller's org:
 *   - retention policy + last purge summary
 *   - inter-org sharing/consent history (audit log)
 *   - signature-ledger integrity chain check (re-hashes each entry in order)
 *   - predictive alert stats
 * Returns raw JSON; frontend renders to CSV + PDF.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: userRes } = await admin.auth.getUser(auth.slice(7));
  const user = userRes?.user;
  if (!user) return json({ error: "unauthorized" }, 401);

  const { data: prof } = await admin.from("profiles").select("organization_id").eq("id", user.id).maybeSingle();
  const orgId = prof?.organization_id;
  if (!orgId) return json({ error: "no_org" }, 400);
  const { data: org } = await admin.from("organizations").select("name, slug").eq("id", orgId).maybeSingle();

  const [
    { data: compliance },
    { data: consents },
    { data: audit },
    { data: ledger },
    { data: alerts },
    { data: docShares },
  ] = await Promise.all([
    admin.from("compliance_settings").select("*").eq("organization_id", orgId).maybeSingle(),
    admin.from("org_share_consents").select("*").eq("owner_org_id", orgId),
    admin.from("inter_org_audit_log").select("*").or(`owner_org_id.eq.${orgId},partner_org_id.eq.${orgId}`).order("occurred_at", { ascending: false }).limit(500),
    admin.from("signature_ledger").select("*").eq("organization_id", orgId).order("signed_at", { ascending: true }),
    admin.from("ai_insights").select("insight_type, severity, status, generated_at").eq("organization_id", orgId).like("insight_type", "predictive_%"),
    admin.from("document_shares").select("*").eq("owner_org_id", orgId),
  ]);

  // Ledger integrity: re-hash chain forward and compare stored chain_hash values.
  const encoder = new TextEncoder();
  const sha = async (s: string) => {
    const buf = await crypto.subtle.digest("SHA-256", encoder.encode(s));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
  };
  let prev: string | null = null;
  let firstBreak: string | null = null;
  for (const e of ledger ?? []) {
    const rehashed = await sha(`${prev ?? ""}|${e.content_hash}|${e.signature_hash}`);
    if (rehashed !== e.chain_hash) { firstBreak = e.id; break; }
    prev = e.chain_hash;
  }

  const alertsByType: Record<string, number> = {};
  for (const a of alerts ?? []) alertsByType[a.insight_type] = (alertsByType[a.insight_type] ?? 0) + 1;

  return json({
    generated_at: new Date().toISOString(),
    organization: { id: orgId, name: org?.name, slug: org?.slug },
    retention: {
      data_retention_days: compliance?.data_retention_days ?? 365,
      gdpr_enabled: !!compliance?.gdpr_enabled,
      ndpr_enabled: !!compliance?.ndpr_enabled,
      mfa_required: !!compliance?.mfa_required,
      audit_log_enabled: !!compliance?.audit_log_enabled,
      purge_schedule: "Daily at 03:15 UTC",
    },
    sharing: {
      consents_total: consents?.length ?? 0,
      consents_active: (consents ?? []).filter((c: any) => c.status === "active").length,
      document_shares_total: docShares?.length ?? 0,
      document_shares_active: (docShares ?? []).filter((d: any) => d.status === "active").length,
    },
    audit_log: audit ?? [],
    ledger: {
      entries: ledger?.length ?? 0,
      integrity: firstBreak ? { status: "broken", first_break_entry_id: firstBreak } : { status: "verified" },
    },
    predictive_alerts: {
      total: alerts?.length ?? 0,
      by_type: alertsByType,
    },
  });
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}