import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, Activity, RefreshCw } from "lucide-react";
import { NAVY, GOLD } from "./investorTheme";

type Metrics = Record<string, number | string>;

const fmt = (n: unknown) =>
  typeof n === "number" ? n.toLocaleString() : String(n ?? "—");

type Row = { label: string; value: string; note: string; source: "live" | "internal" | "platform" };

const Band = ({ title, rows }: { title: string; rows: Row[] }) => (
  <div className="mt-10">
    <p className="text-[11px] tracking-[0.22em] uppercase mb-4" style={{ color: GOLD, fontFamily: "'Space Grotesk', sans-serif" }}>{title}</p>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px" style={{ background: `${NAVY}22` }}>
      {rows.map((r) => (
        <div key={r.label} className="p-4" style={{ background: "#F5F1E8" }}>
          <div className="text-2xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif", color: NAVY }}>{r.value}</div>
          <div className="text-[11px] tracking-[0.14em] uppercase mt-1" style={{ color: `${NAVY}AA`, fontFamily: "'Space Grotesk', sans-serif" }}>{r.label}</div>
          <div className="text-[11px] mt-1 leading-snug" style={{ color: `${NAVY}88` }}>{r.note}</div>
          <div className="mt-2 inline-flex items-center gap-1 text-[9px] tracking-[0.18em] uppercase px-1.5 py-0.5 border"
            style={{
              borderColor: r.source === "live" ? GOLD : `${NAVY}33`,
              color: r.source === "live" ? GOLD : `${NAVY}77`,
              fontFamily: "'Space Grotesk', sans-serif",
            }}>
            {r.source === "live" ? <Activity className="w-2.5 h-2.5" /> : <ShieldCheck className="w-2.5 h-2.5" />}
            {r.source === "live" ? "Live from platform" : r.source === "platform" ? "Platform capability" : "Internally reported"}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const VerifiedMetrics = () => {
  const [m, setM] = useState<Metrics | null>(null);
  const [err, setErr] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setRefreshing(true);
    const { data, error } = await supabase.rpc("get_investor_metrics");
    if (error) setErr(true);
    else setM(data as unknown as Metrics);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const updated = m?.generated_at ? new Date(String(m.generated_at)) : null;

  return (
    <div>
      <p>
        Every number below that is labelled <em>Live from platform</em> is queried directly from the production database at page load — not typed into a slide. Figures labelled <em>Internally reported</em> are company records not yet independently audited. Figures labelled <em>Platform capability</em> describe engineered guarantees of the running system.
      </p>

      <div className="not-prose">
        <Band title="Product Metrics — live" rows={[
          { label: "Organizations onboarded", value: fmt(m?.organizations), note: "Tenants provisioned on the platform", source: "live" },
          { label: "Registered users", value: fmt(m?.users), note: "Profiles across all tenants", source: "live" },
          { label: "Active users (30d)", value: fmt(m?.active_users_30d), note: "Distinct users with logged activity", source: "live" },
          { label: "AI agents deployed", value: fmt(m?.ai_agents), note: "AI executives + domain consultants instantiated", source: "live" },
          { label: "Documents processed", value: fmt(m?.documents), note: "Files ingested into the knowledge layer", source: "live" },
          { label: "Tasks completed", value: `${fmt(m?.tasks_completed)} / ${fmt(m?.tasks_total)}`, note: "Completed of total tasks created", source: "live" },
          { label: "AI deliberations", value: fmt(m?.deliberations), note: "Multi-agent reasoning runs executed", source: "live" },
          { label: "Automated workflow runs", value: fmt(m?.workflow_runs), note: "Workflow instances triggered end-to-end", source: "live" },
          { label: "Memory entries", value: fmt(m?.memory_entries), note: "Durable organizational memory records", source: "live" },
          { label: "Meetings hosted", value: fmt(m?.meetings), note: "Rooms created on the native conferencing stack", source: "live" },
        ]} />

        <Band title="Company Metrics" rows={[
          { label: "Incorporation", value: "Delaware C-Corp", note: "the Intelligent Office showcase project", source: "internal" },
          { label: "Engineering center", value: "Lagos, NG", note: "the Intelligent Office showcase project — Africa engineering center", source: "internal" },
          { label: "Headquarters", value: "Delaware, USA", note: "Engineering hub: Lagos, Nigeria", source: "internal" },
          { label: "Team", value: "3 founders", note: "Plus contract engineering and design", source: "internal" },
          { label: "Countries served", value: fmt(m?.countries_served), note: "Launch markets: NG · KE · ZA · GH", source: "internal" },
          { label: "Stage", value: "Pre-seed", note: "Pre-revenue by design; product-complete", source: "internal" },
        ]} />

        <Band title="Growth Metrics" rows={[
          { label: "MRR", value: "$0", note: "Pre-revenue; commercial launch scoped in use of funds", source: "internal" },
          { label: "ARR", value: "$0", note: "First revenue targeted post-close", source: "internal" },
          { label: "Monthly growth", value: "n/a", note: "Reported from first billing cohort", source: "internal" },
          { label: "Retention / churn", value: "n/a", note: "Measured from first paying cohort", source: "internal" },
          { label: "NRR target", value: "115–135%", note: "Modelled: seat + AI credit expansion", source: "internal" },
          { label: "Expansion revenue", value: "Metered AI", note: "Credit consumption above tier allowance", source: "internal" },
        ]} />

        <Band title="Technical Metrics" rows={[
          { label: "Platform uptime", value: "99.9% target", note: "Managed Postgres + edge runtime SLA", source: "platform" },
          { label: "API response time", value: "<300ms p95", note: "Edge-executed reads, regional caching", source: "platform" },
          { label: "Infrastructure availability", value: "Multi-AZ", note: "Automated backups, point-in-time recovery", source: "platform" },
          { label: "Security incidents", value: fmt(m?.security_incidents), note: "Recorded incidents, trailing 12 months", source: "live" },
          { label: "Tenant isolation", value: "Row-level", note: "Database-enforced on every table", source: "platform" },
          { label: "Deployment time", value: "<5 min", note: "Continuous deployment, zero-downtime releases", source: "platform" },
        ]} />

        <div className="mt-6 flex flex-wrap items-center gap-3 text-xs" style={{ color: `${NAVY}99` }}>
          <span>
            Last updated:{" "}
            {err ? "unavailable" : updated ? updated.toUTCString() : "loading…"}
          </span>
          <button type="button" onClick={load} className="inline-flex items-center gap-1 border px-2 py-1 text-[10px] tracking-[0.18em] uppercase"
            style={{ borderColor: `${NAVY}44`, color: NAVY, fontFamily: "'Space Grotesk', sans-serif" }}>
            <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </button>
          <span>No third-party audit has been performed to date. Independent verification is scoped for the seed round.</span>
        </div>
      </div>
    </div>
  );
};

export default VerifiedMetrics;
