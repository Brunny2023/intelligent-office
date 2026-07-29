import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Users, Sparkles } from "lucide-react";

type FeatureRow = { feature: string; adoption: number; orgs_using: number; total_orgs: number };
type TenantHealth = { name: string; slug: string; score: number; signals: string[] };

export default function AdoptionTelemetry() {
  const [features, setFeatures] = useState<FeatureRow[]>([]);
  const [tenants, setTenants] = useState<TenantHealth[]>([]);
  const [dau, setDau] = useState<number>(0);
  const [wau, setWau] = useState<number>(0);
  const [mau, setMau] = useState<number>(0);

  useEffect(() => {
    (async () => {
      const { data: orgs } = await supabase.from("organizations").select("id, name, slug");
      const orgList = orgs || [];
      const total = orgList.length || 1;

      const dayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
      const monthAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

      const [dauRes, wauRes, mauRes] = await Promise.all([
        supabase.from("activity_logs").select("user_id").gte("created_at", dayAgo),
        supabase.from("activity_logs").select("user_id").gte("created_at", weekAgo),
        supabase.from("activity_logs").select("user_id").gte("created_at", monthAgo),
      ]);
      setDau(new Set((dauRes.data || []).map((r: any) => r.user_id)).size);
      setWau(new Set((wauRes.data || []).map((r: any) => r.user_id)).size);
      setMau(new Set((mauRes.data || []).map((r: any) => r.user_id)).size);

      const featureQueries = await Promise.all([
        supabase.from("tasks").select("organization_id"),
        supabase.from("kpis").select("organization_id"),
        supabase.from("workflows").select("organization_id"),
        supabase.from("meeting_rooms").select("organization_id"),
        supabase.from("documents").select("organization_id"),
        supabase.from("ai_insights").select("organization_id"),
        supabase.from("channels").select("organization_id"),
        supabase.from("invitations").select("organization_id"),
      ]);
      const labels = ["Execution", "KPIs", "Workflows", "Meetings", "Documents", "AI Insights", "Messaging", "Team Invites"];
      const rows: FeatureRow[] = featureQueries.map((r, i) => {
        const orgsUsing = new Set((r.data || []).map((x: any) => x.organization_id).filter(Boolean)).size;
        return { feature: labels[i], orgs_using: orgsUsing, total_orgs: total, adoption: Math.round((orgsUsing / total) * 100) };
      }).sort((a, b) => b.adoption - a.adoption);
      setFeatures(rows);

      // Per-tenant health signals
      const tenantHealth: TenantHealth[] = await Promise.all(
        orgList.slice(0, 20).map(async (o: any) => {
          const [members, active, act30] = await Promise.all([
            supabase.from("profiles").select("id", { head: true, count: "exact" }).eq("organization_id", o.id),
            supabase.from("tasks").select("id", { head: true, count: "exact" }).eq("organization_id", o.id).in("status", ["todo", "in_progress", "review"]),
            supabase.from("activity_logs").select("id", { head: true, count: "exact" }).eq("organization_id", o.id).gte("created_at", monthAgo),
          ]);
          const signals: string[] = [];
          const m = members.count || 0;
          const a = act30.count || 0;
          let score = 0;
          if (m >= 2) { score += 25; signals.push("team"); }
          if ((active.count || 0) > 0) { score += 25; signals.push("execution"); }
          if (a > 10) { score += 30; signals.push("active"); }
          if (a > 100) { score += 20; signals.push("power-user"); }
          return { name: o.name, slug: o.slug, score, signals };
        })
      );
      setTenants(tenantHealth.sort((a, b) => b.score - a.score));
    })();
  }, []);

  const stickiness = mau > 0 ? Math.round((dau / mau) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">DAU</div><div className="text-2xl font-bold">{dau}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">WAU</div><div className="text-2xl font-bold">{wau}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">MAU</div><div className="text-2xl font-bold">{mau}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Stickiness (DAU/MAU)</div><div className="text-2xl font-bold">{stickiness}%</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="w-4 h-4 text-svo-gold" /> Feature Adoption</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {features.map((f) => (
              <div key={f.feature}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{f.feature}</span>
                  <span className="text-xs text-muted-foreground">{f.orgs_using}/{f.total_orgs} orgs · {f.adoption}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full ${f.adoption >= 60 ? "bg-green-500" : f.adoption >= 30 ? "bg-svo-gold" : "bg-destructive/60"}`} style={{ width: `${f.adoption}%` }} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4" /> Tenant Health Signals</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Organization</TableHead><TableHead>Score</TableHead><TableHead>Signals</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {tenants.map((t) => (
                <TableRow key={t.slug}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>{t.score}</TableCell>
                  <TableCell><div className="flex flex-wrap gap-1">{t.signals.map((s) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}</div></TableCell>
                  <TableCell>
                    {t.score >= 70
                      ? <span className="text-xs text-green-600 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Healthy</span>
                      : t.score >= 40
                        ? <span className="text-xs text-svo-gold flex items-center gap-1">Activating</span>
                        : <span className="text-xs text-destructive flex items-center gap-1"><TrendingDown className="w-3 h-3" /> At risk</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}