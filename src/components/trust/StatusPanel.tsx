import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2, Activity } from "lucide-react";
import { format, subMonths, startOfMonth } from "date-fns";

type Check = { name: string; description: string; status: "ok" | "down" | "checking"; latency?: number };
type Incident = {
  id: string; title: string; body: string | null; component: string;
  severity: string; status: string; started_at: string; resolved_at: string | null;
};

const initialChecks: Check[] = [
  { name: "Database", description: "Postgres reads for tenant data", status: "checking" },
  { name: "Authentication", description: "Sign-in and session issuance", status: "checking" },
  { name: "Edge Functions", description: "Serverless AI + workflow runtime", status: "checking" },
  { name: "Storage", description: "Document and recording buckets", status: "checking" },
];

const TARGET = 99.99;
const MINUTES_IN = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate() * 24 * 60;

export default function StatusPanel({ compact = false }: { compact?: boolean }) {
  const [checks, setChecks] = useState<Check[]>(initialChecks);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loadingIncidents, setLoadingIncidents] = useState(true);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);

  useEffect(() => {
    const runAll = async () => {
      const next = [...initialChecks];
      const run = async (i: number, fn: () => Promise<boolean>) => {
        const t = performance.now();
        try {
          const ok = await fn();
          next[i] = { ...next[i], status: ok ? "ok" : "down", latency: Math.round(performance.now() - t) };
        } catch {
          next[i] = { ...next[i], status: "down", latency: Math.round(performance.now() - t) };
        }
        setChecks([...next]);
      };
      await Promise.all([
        run(0, async () => !(await supabase.from("status_incidents").select("id", { head: true, count: "exact" })).error),
        run(1, async () => !(await supabase.auth.getSession()).error),
        run(2, async () => {
          const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/predictive-alerts`, { method: "OPTIONS" });
          return r.status < 500;
        }),
        run(3, async () => !(await supabase.storage.listBuckets()).error),
      ]);
      setCheckedAt(new Date());
    };
    runAll();
    const id = setInterval(runAll, 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    supabase
      .from("status_incidents")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setIncidents((data as Incident[]) || []);
        setLoadingIncidents(false);
      });
  }, []);

  const allOk = checks.every((c) => c.status === "ok");
  const anyDown = checks.some((c) => c.status === "down");

  const months = Array.from({ length: 6 }, (_, i) => startOfMonth(subMonths(new Date(), 5 - i)));
  const monthlyStats = months.map((m) => {
    const inMonth = incidents.filter((inc) => {
      const d = new Date(inc.started_at);
      return d.getFullYear() === m.getFullYear() && d.getMonth() === m.getMonth();
    });
    const downMinutes = inMonth.reduce((acc, inc) => {
      if (!inc.resolved_at) return acc;
      return acc + Math.max(0, (new Date(inc.resolved_at).getTime() - new Date(inc.started_at).getTime()) / 60000);
    }, 0);
    const uptime = Math.max(0, 100 - (downMinutes / MINUTES_IN(m)) * 100);
    return { month: m, uptime, incidents: inMonth.length };
  });

  return (
    <div className="space-y-6">
      <div className={`rounded-2xl border p-6 ${anyDown ? "border-destructive/40" : allOk ? "border-green-500/40" : "border-border"} glass-card`}>
        <div className="flex items-center gap-4">
          {anyDown ? <XCircle className="w-9 h-9 text-destructive" /> : allOk ? <CheckCircle2 className="w-9 h-9 text-green-600" /> : <Loader2 className="w-9 h-9 animate-spin text-muted-foreground" />}
          <div>
            <div className="text-lg font-semibold text-foreground">
              {anyDown ? "Service disruption detected" : allOk ? "All systems operational" : "Running live checks…"}
            </div>
            <div className="text-sm text-muted-foreground">
              {checkedAt ? `Checked ${format(checkedAt, "HH:mm:ss")} from your browser · re-checks every 60s` : "Checking from your browser…"}
            </div>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {checks.map((c) => (
          <div key={c.name} className="rounded-xl border border-border p-4 flex items-center justify-between glass-card">
            <div>
              <p className="text-sm font-medium text-foreground">{c.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {c.latency !== undefined && <span className="text-[11px] text-muted-foreground">{c.latency}ms</span>}
              {c.status === "ok" && <span className="text-xs font-medium text-green-600">Operational</span>}
              {c.status === "down" && <span className="text-xs font-medium text-destructive">Degraded</span>}
              {c.status === "checking" && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
            </div>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-accent" /> Monthly reliability (target {TARGET}%)
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {monthlyStats.map((s) => (
            <motion.div key={s.month.toISOString()} initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="rounded-xl border border-border p-3 text-center glass-card">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{format(s.month, "MMM yy")}</p>
              <p className={`text-base font-semibold ${s.uptime >= TARGET ? "text-green-600" : "text-destructive"}`}>{s.uptime.toFixed(2)}%</p>
              <p className="text-[10px] text-muted-foreground">{s.incidents} incident{s.incidents === 1 ? "" : "s"}</p>
            </motion.div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          Uptime is computed from recorded incident duration against total minutes in each month. Months with no
          recorded incident are reported at 100%.
        </p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Incident history</h3>
        {loadingIncidents ? (
          <div className="h-14 bg-muted rounded-xl animate-pulse" />
        ) : incidents.length === 0 ? (
          <div className="rounded-xl border border-border p-6 text-sm text-muted-foreground glass-card">
            No incidents have been recorded to date. Incidents, their impact window and the written post-incident
            summary are published here as soon as they are resolved.
          </div>
        ) : (
          <div className="space-y-2">
            {incidents.map((inc) => (
              <div key={inc.id} className="rounded-xl border border-border p-4 glass-card">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{inc.title}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border capitalize">{inc.component}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border capitalize ${inc.status === "resolved" ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-destructive/10 text-destructive border-destructive/20"}`}>
                    {inc.status}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border capitalize">{inc.severity}</span>
                </div>
                {inc.body && <p className="text-xs text-muted-foreground mt-1.5">{inc.body}</p>}
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  {format(new Date(inc.started_at), "d MMM yyyy, HH:mm")}
                  {inc.resolved_at && ` → ${format(new Date(inc.resolved_at), "d MMM yyyy, HH:mm")}`}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {!compact && (
        <p className="text-xs text-muted-foreground">
          Report an incident to <a href="mailto:security@globaloffice.cloud" className="underline">security@globaloffice.cloud</a>.
        </p>
      )}
    </div>
  );
}
