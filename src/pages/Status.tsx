import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

type Check = { name: string; description: string; status: "ok" | "down" | "checking"; latency?: number };

const initial: Check[] = [
  { name: "Database", description: "Postgres reads for tenant data", status: "checking" },
  { name: "Authentication", description: "Sign-in and session issuance", status: "checking" },
  { name: "Edge Functions", description: "Serverless AI + workflow runtime", status: "checking" },
  { name: "Storage", description: "Document and recording buckets", status: "checking" },
];

export default function Status() {
  const [checks, setChecks] = useState<Check[]>(initial);

  useEffect(() => {
    (async () => {
      const next = [...initial];
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
        run(0, async () => !(await supabase.from("organizations").select("id", { head: true, count: "exact" })).error),
        run(1, async () => !(await supabase.auth.getSession()).error),
        run(2, async () => {
          const r = await fetch(`https://sydqmpordfbtjmxuxjkc.supabase.co/functions/v1/predictive-alerts`, { method: "OPTIONS" });
          return r.status < 500;
        }),
        run(3, async () => !(await supabase.storage.listBuckets()).error),
      ]);
    })();
  }, []);

  const allOk = checks.every((c) => c.status === "ok");
  const anyDown = checks.some((c) => c.status === "down");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <Link to="/" className="font-display text-xl font-bold text-foreground">Global Office</Link>
          <Link to="/trust" className="text-sm text-muted-foreground hover:text-foreground">Trust Center →</Link>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="font-display text-4xl font-bold text-foreground mb-3">System Status</h1>
          <p className="text-muted-foreground">Live health of Global Office platform services. Checked from your browser.</p>
        </div>

        <Card className={`mb-8 border-2 ${anyDown ? "border-destructive/40" : allOk ? "border-green-500/40" : "border-border"}`}>
          <CardContent className="p-6 flex items-center gap-4">
            {anyDown ? <XCircle className="w-10 h-10 text-destructive" /> : allOk ? <CheckCircle2 className="w-10 h-10 text-green-600" /> : <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />}
            <div>
              <div className="text-lg font-semibold">
                {anyDown ? "Service disruption detected" : allOk ? "All systems operational" : "Running checks…"}
              </div>
              <div className="text-sm text-muted-foreground">Last checked just now from this browser session.</div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {checks.map((c) => (
            <Card key={c.name}>
              <CardHeader className="flex flex-row items-center justify-between py-4">
                <div>
                  <CardTitle className="text-base">{c.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{c.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  {c.latency !== undefined && <span className="text-xs text-muted-foreground">{c.latency}ms</span>}
                  {c.status === "ok" && <span className="flex items-center gap-1.5 text-sm font-medium text-green-600"><CheckCircle2 className="w-4 h-4" /> Operational</span>}
                  {c.status === "down" && <span className="flex items-center gap-1.5 text-sm font-medium text-destructive"><XCircle className="w-4 h-4" /> Degraded</span>}
                  {c.status === "checking" && <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Checking</span>}
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="mt-10 text-sm text-muted-foreground">
          For incident history and security posture see the <Link to="/trust" className="underline">Trust Center</Link>.
          Report an incident to <a href="mailto:security@globaloffice.cloud" className="underline">security@globaloffice.cloud</a>.
        </div>
      </main>
    </div>
  );
}