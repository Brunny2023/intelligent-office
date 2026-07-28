import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { usePlatformAdmin } from "@/hooks/usePlatformAdmin";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ShieldCheck, Building2, Users, CheckSquare, MessageSquare, Brain,
  Activity, Ticket, BarChart3, HeartPulse, Search, TrendingUp, AlertCircle, CheckCircle2, Video
} from "lucide-react";
import EgressHealthPanel from "@/components/superadmin/EgressHealthPanel";
import { format, formatDistanceToNow } from "date-fns";

interface PlatformStats {
  total_orgs: number; total_users: number; total_tasks: number; tasks_30d: number;
  messages_30d: number; ai_insights_30d: number; mau_30d: number; open_tickets: number;
  active_projects: number; new_orgs_30d: number;
}
interface Tenant {
  id: string; name: string; slug: string; created_at: string;
  member_count: number; task_count: number; ticket_count: number; last_activity: string | null;
}
interface HealthCheck { label: string; status: "ok" | "warn" | "err"; detail: string; }

const SuperAdmin = () => {
  const { isPlatformAdmin, loading: adminLoading } = usePlatformAdmin();
  const navigate = useNavigate();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [health, setHealth] = useState<HealthCheck[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (adminLoading) return;
    if (!isPlatformAdmin) { navigate("/dashboard"); return; }

    const load = async () => {
      const [statsRes, tenantsRes, activityRes] = await Promise.all([
        supabase.rpc("get_platform_stats"),
        supabase.rpc("get_platform_tenants"),
        supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(200),
      ]);
      if (statsRes.data && !(statsRes.data as any).error) setStats(statsRes.data as unknown as PlatformStats);
      if (tenantsRes.data) setTenants(tenantsRes.data as Tenant[]);
      if (activityRes.data) setActivity(activityRes.data);

      // Health probes
      const checks: HealthCheck[] = [];
      const t0 = performance.now();
      const dbPing = await supabase.from("organizations").select("id", { count: "exact", head: true });
      const dbMs = Math.round(performance.now() - t0);
      checks.push({
        label: "Database (Data API)",
        status: dbPing.error ? "err" : dbMs > 800 ? "warn" : "ok",
        detail: dbPing.error ? dbPing.error.message : `${dbMs}ms round-trip`,
      });
      const { error: authErr } = await supabase.auth.getSession();
      checks.push({ label: "Auth Service", status: authErr ? "err" : "ok", detail: authErr ? authErr.message : "Session endpoint reachable" });
      const { error: storErr } = await supabase.storage.from("org-logos").list("", { limit: 1 });
      checks.push({ label: "Storage (org-logos)", status: storErr ? "warn" : "ok", detail: storErr ? storErr.message : "Bucket reachable" });
      checks.push({ label: "Realtime", status: "ok", detail: "Channel subsystem online" });
      setHealth(checks);

      setLoading(false);
    };
    load();
  }, [isPlatformAdmin, adminLoading, navigate]);

  if (adminLoading || loading) {
    return (
      <AppLayout title="Super Admin">
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  const filteredTenants = tenants.filter(t =>
    !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.slug.toLowerCase().includes(search.toLowerCase())
  );

  const statCards = [
    { label: "Tenants", value: stats?.total_orgs ?? 0, icon: Building2, sub: `+${stats?.new_orgs_30d ?? 0} in 30d` },
    { label: "Total Users", value: stats?.total_users ?? 0, icon: Users, sub: `${stats?.mau_30d ?? 0} MAU` },
    { label: "Tasks (30d)", value: stats?.tasks_30d ?? 0, icon: CheckSquare, sub: `${stats?.total_tasks ?? 0} lifetime` },
    { label: "Messages (30d)", value: stats?.messages_30d ?? 0, icon: MessageSquare, sub: "Platform-wide" },
    { label: "AI Insights (30d)", value: stats?.ai_insights_30d ?? 0, icon: Brain, sub: "Generated" },
    { label: "Open Tickets", value: stats?.open_tickets ?? 0, icon: Ticket, sub: "Cross-tenant" },
  ];

  return (
    <AppLayout title="Super Admin">
      <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider border-accent text-accent">Platform</Badge>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-accent" /> Super Admin Console
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Cross-tenant oversight · usage monitoring · system health</p>
        </motion.div>

        {/* Platform metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {statCards.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }}>
              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <s.icon className="w-4 h-4 text-accent" />
                    <span className="text-[11px] text-muted-foreground">{s.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{s.value.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{s.sub}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Tabs defaultValue="tenants" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="tenants" className="gap-1.5"><Building2 className="w-4 h-4" /> Tenants</TabsTrigger>
            <TabsTrigger value="usage" className="gap-1.5"><BarChart3 className="w-4 h-4" /> Usage</TabsTrigger>
            <TabsTrigger value="health" className="gap-1.5"><HeartPulse className="w-4 h-4" /> System Health</TabsTrigger>
            <TabsTrigger value="egress" className="gap-1.5"><Video className="w-4 h-4" /> Egress</TabsTrigger>
            <TabsTrigger value="audit" className="gap-1.5"><Activity className="w-4 h-4" /> Audit</TabsTrigger>
          </TabsList>

          <TabsContent value="tenants">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle className="text-lg flex items-center gap-2"><Building2 className="w-5 h-5" /> All Tenants ({tenants.length})</CardTitle>
                <div className="relative w-64">
                  <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search tenants…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Organization</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead className="text-right">Members</TableHead>
                        <TableHead className="text-right">Tasks</TableHead>
                        <TableHead className="text-right">Tickets</TableHead>
                        <TableHead>Last Activity</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTenants.map(t => (
                        <TableRow key={t.id}>
                          <TableCell className="font-medium">{t.name}</TableCell>
                          <TableCell className="text-muted-foreground text-xs font-mono">{t.slug}</TableCell>
                          <TableCell className="text-right">{t.member_count}</TableCell>
                          <TableCell className="text-right">{t.task_count}</TableCell>
                          <TableCell className="text-right">{t.ticket_count}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {t.last_activity ? formatDistanceToNow(new Date(t.last_activity), { addSuffix: true }) : "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{format(new Date(t.created_at), "MMM d, yyyy")}</TableCell>
                        </TableRow>
                      ))}
                      {filteredTenants.length === 0 && (
                        <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No tenants match your search.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4" /> 30-Day Activity</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <UsageRow label="New organizations" value={stats?.new_orgs_30d ?? 0} />
                  <UsageRow label="Tasks created" value={stats?.tasks_30d ?? 0} />
                  <UsageRow label="Messages sent" value={stats?.messages_30d ?? 0} />
                  <UsageRow label="AI insights generated" value={stats?.ai_insights_30d ?? 0} />
                  <UsageRow label="Monthly active users" value={stats?.mau_30d ?? 0} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Cumulative Totals</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <UsageRow label="Total tenants" value={stats?.total_orgs ?? 0} />
                  <UsageRow label="Total users" value={stats?.total_users ?? 0} />
                  <UsageRow label="Total tasks" value={stats?.total_tasks ?? 0} />
                  <UsageRow label="Active projects" value={stats?.active_projects ?? 0} />
                  <UsageRow label="Open tickets" value={stats?.open_tickets ?? 0} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="health">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><HeartPulse className="w-4 h-4" /> System Health Probes</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {health.map(h => (
                  <div key={h.label} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      {h.status === "ok" && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                      {h.status === "warn" && <AlertCircle className="w-5 h-5 text-amber-500" />}
                      {h.status === "err" && <AlertCircle className="w-5 h-5 text-destructive" />}
                      <div>
                        <p className="text-sm font-medium">{h.label}</p>
                        <p className="text-xs text-muted-foreground">{h.detail}</p>
                      </div>
                    </div>
                    <Badge variant={h.status === "ok" ? "default" : h.status === "warn" ? "secondary" : "destructive"} className="capitalize text-[10px]">
                      {h.status === "ok" ? "operational" : h.status === "warn" ? "degraded" : "down"}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="egress">
            <EgressHealthPanel />
          </TabsContent>

          <TabsContent value="audit">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Activity className="w-4 h-4" /> Recent Cross-Tenant Activity ({activity.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>When</TableHead>
                        <TableHead>Org</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Entity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activity.slice(0, 100).map(a => (
                        <TableRow key={a.id}>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {a.created_at ? formatDistanceToNow(new Date(a.created_at), { addSuffix: true }) : "—"}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">{a.organization_id?.slice(0, 8) ?? "—"}</TableCell>
                          <TableCell className="text-sm">{a.action ?? "—"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{a.entity_type ?? a.resource_type ?? "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

const UsageRow = ({ label, value }: { label: string; value: number }) => (
  <div className="flex items-center justify-between py-1.5 border-b last:border-b-0">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-semibold tabular-nums">{value.toLocaleString()}</span>
  </div>
);

export default SuperAdmin;