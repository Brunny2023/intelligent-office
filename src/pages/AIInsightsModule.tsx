import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { PageHeader, StatCard, SectionCard, TrendChart, type Tone } from "@/components/dashboard/kit";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sparkles, AlertTriangle, TrendingUp, RefreshCw, Zap, BarChart3, Users, CheckCircle, Inbox, Filter, Search, ExternalLink, ShieldAlert, Bell } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, format, subDays, startOfDay } from "date-fns";
import { useNavigate } from "react-router-dom";

const severityColors: Record<string, string> = {
  info: "bg-svo-blue/10 text-svo-blue",
  warning: "bg-svo-gold/10 text-svo-gold",
  critical: "bg-destructive/10 text-destructive",
  success: "bg-green-500/10 text-green-600",
};

const severityIcons: Record<string, React.ElementType> = {
  info: TrendingUp,
  warning: AlertTriangle,
  critical: AlertTriangle,
  success: Sparkles,
};

const AIInsightsModule = () => {
  const { user } = useAuth();
  const { org, loading: orgLoading } = useOrganization();
  const navigate = useNavigate();
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("open");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<any | null>(null);

  const fetchInsights = useCallback(async () => {
    if (!org) return;
    const { data } = await supabase.from("ai_insights").select("*")
      .eq("organization_id", org.id)
      .order("generated_at", { ascending: false })
      .limit(50);
    setInsights(data || []);
    setLoading(false);
  }, [org]);

  useEffect(() => { fetchInsights(); }, [fetchInsights]);

  const markRead = async (id: string) => {
    await supabase.from("ai_insights").update({ is_read: true }).eq("id", id);
    setInsights(prev => prev.map(i => i.id === id ? { ...i, is_read: true } : i));
  };

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("ai_insights" as any)
      .update({ status, is_read: true } as any).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setInsights(prev => prev.map(i => i.id === id ? { ...i, status, is_read: true } : i));
    if (selected?.id === id) setSelected({ ...selected, status, is_read: true });
    toast.success(`Marked ${status.replace("_", " ")}`);
  };

  const generateInsights = async () => {
    if (!user || !org) return;
    setGenerating(true);

    try {
      // Gather org data
      const [{ data: tasks }, { data: attendance }, { data: kpis }, { count: staffCount }] = await Promise.all([
        supabase.from("tasks").select("id, status, priority, due_date, assigned_to, completed_at, title").eq("organization_id", org.id),
        supabase.from("attendance_records").select("user_id, clock_in, status").eq("organization_id", org.id).gte("clock_in", new Date(Date.now() - 7 * 86400000).toISOString()),
        supabase.from("kpis").select("title, current_value, target_value, status").eq("organization_id", org.id),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("organization_id", org.id),
      ]);

      const allTasks = tasks || [];
      const completed = allTasks.filter(t => t.status === "completed").length;
      const blocked = allTasks.filter(t => t.status === "blocked").length;
      const overdue = allTasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== "completed").length;
      const inProgress = allTasks.filter(t => t.status === "in_progress").length;
      const totalKpis = (kpis || []).length;
      const onTarget = (kpis || []).filter(k => Number(k.current_value) >= Number(k.target_value)).length;
      const uniqueAttendees = new Set((attendance || []).map(a => a.user_id)).size;
      const urgentTasks = allTasks.filter(t => t.priority === "urgent" && t.status !== "completed").length;

      // Build context for AI
      const context = `Organization analytics for the past week:
- Total staff: ${staffCount || 0}
- Total tasks: ${allTasks.length}, Completed: ${completed}, In Progress: ${inProgress}, Blocked: ${blocked}, Overdue: ${overdue}
- Urgent pending tasks: ${urgentTasks}
- Completion rate: ${allTasks.length > 0 ? Math.round((completed / allTasks.length) * 100) : 0}%
- Unique attendees this week: ${uniqueAttendees}/${staffCount || 0}
- KPIs: ${totalKpis} total, ${onTarget} on target
- Blocked task titles: ${allTasks.filter(t => t.status === "blocked").map(t => t.title).join(", ") || "None"}
- Overdue task titles: ${allTasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== "completed").slice(0, 5).map(t => t.title).join(", ") || "None"}`;

      // Call AI via edge function
      const { data: aiResult, error: aiError } = await supabase.functions.invoke("ai-insights-generate", {
        body: { context, orgId: org.id },
      });

      let newInsights: Array<{ title: string; content: string; severity: string; insight_type: string }> = [];

      if (aiError || !aiResult?.insights) {
        // Fallback to local analysis
        newInsights = generateLocalInsights(allTasks, completed, blocked, overdue, inProgress, urgentTasks, staffCount || 0, uniqueAttendees, totalKpis, onTarget);
      } else {
        newInsights = aiResult.insights;
      }

      for (const insight of newInsights) {
        await supabase.from("ai_insights").insert({
          organization_id: org.id, ...insight, created_by: user.id,
        });
      }

      toast.success(`Generated ${newInsights.length} insights!`);
      fetchInsights();
    } catch (err: any) {
      toast.error(err.message || "Failed to generate insights");
    }
    setGenerating(false);
  };

  const applyFilters = (list: any[]) => list.filter(i => {
    const st = (i as any).status ?? "open";
    if (statusFilter !== "all" && st !== statusFilter) return false;
    if (severityFilter !== "all" && i.severity !== severityFilter) return false;
    if (query) {
      const hay = `${i.title} ${i.content} ${i.insight_type}`.toLowerCase();
      if (!hay.includes(query.toLowerCase())) return false;
    }
    return true;
  });
  const filterByType = (type: string) => applyFilters(type === "all" ? insights : insights.filter(i => i.insight_type === type));
  const unreadCount = insights.filter(i => !i.is_read).length;
  const openCount = insights.filter(i => ((i as any).status ?? "open") === "open").length;
  const escalatedCount = insights.filter(i => Number((i as any).escalation_level ?? 0) > 0).length;

  if (orgLoading) {
    return <AppLayout title="AI Intelligence"><div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div></AppLayout>;
  }

  const trend = Array.from({ length: 14 }, (_, idx) => {
    const day = startOfDay(subDays(new Date(), 13 - idx));
    const next = new Date(day.getTime() + 86400000);
    const rows = insights.filter(i => {
      const t = new Date(i.generated_at);
      return t >= day && t < next;
    });
    return {
      label: format(day, "MMM d"),
      alerts: rows.length,
      critical: rows.filter(r => r.severity === "critical" || r.severity === "high").length,
    };
  });

  const severityMix = [
    { label: "critical", value: insights.filter(i => i.severity === "critical").length, bar: "bg-destructive" },
    { label: "warning", value: insights.filter(i => i.severity === "warning" || i.severity === "high").length, bar: "bg-[hsl(var(--svo-gold))]" },
    { label: "info", value: insights.filter(i => i.severity === "info" || i.severity === "medium").length, bar: "bg-[hsl(var(--svo-blue))]" },
    { label: "success", value: insights.filter(i => i.severity === "success").length, bar: "bg-[hsl(160_60%_40%)]" },
  ];

  return (
    <AppLayout title="AI Intelligence">
      <div className="p-6 md:p-8 space-y-6">
        <PageHeader
          eyebrow="Cognition"
          icon={Brain}
          title="AI Intelligence Center"
          subtitle="AI-powered insights, anomaly detection & performance analysis"
          actions={<>
            <Button
              variant="outline"
              onClick={async () => {
                const { data, error } = await supabase.functions.invoke("predictive-alerts", { body: {} });
                if (error || (data as any)?.error) toast.error((data as any)?.error ?? error?.message ?? "Scan failed");
                else { toast.success(`${(data as any)?.insights_created ?? 0} predictive alerts`); fetchInsights(); }
              }}
              className="rounded-xl">
              <AlertTriangle className="w-4 h-4 mr-1" /> Predictive Scan
            </Button>
            <Button onClick={generateInsights} disabled={generating} className="rounded-xl bg-accent text-accent-foreground">
              {generating ? <><RefreshCw className="w-4 h-4 mr-1 animate-spin" /> Analyzing...</> : <><Sparkles className="w-4 h-4 mr-1" /> Generate Insights</>}
            </Button>
          </>}
        />

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Open", value: openCount, icon: Inbox, tone: "blue" as Tone },
            { label: "Escalated", value: escalatedCount, icon: ShieldAlert, tone: "rose" as Tone },
            { label: "Anomalies", value: insights.filter(i => i.insight_type === "anomaly").length, icon: AlertTriangle, tone: "rose" as Tone },
            { label: "Performance", value: insights.filter(i => i.insight_type === "performance").length, icon: BarChart3, tone: "emerald" as Tone },
            { label: "Unread", value: unreadCount, icon: Bell, tone: "gold" as Tone },
          ].map((stat, i) => (
            <StatCard key={stat.label} index={i} label={stat.label} value={stat.value} icon={stat.icon} tone={stat.tone} />
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <SectionCard title="Signal Volume — Last 14 Days" icon={TrendingUp} className="lg:col-span-2">
            <TrendChart data={trend} dataKey="alerts" secondKey="critical" tone="gold" secondTone="rose" height={200} />
          </SectionCard>
          <SectionCard title="Severity Mix" icon={BarChart3}>
            <div className="space-y-3">
              {severityMix.map((row) => (
                <div key={row.label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground capitalize">{row.label}</span>
                    <span className="font-semibold text-foreground tabular-nums">{row.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${insights.length ? (row.value / insights.length) * 100 : 0}%` }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      className={`h-full rounded-full ${row.bar}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Inbox filters */}
        <div className="glass-card rounded-xl p-3 flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground ml-1" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 rounded-xl w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="acknowledged">Acknowledged</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
              <SelectItem value="all">All statuses</SelectItem>
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="h-9 rounded-xl w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="success">Success</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search alerts..." className="h-9 rounded-xl pl-7" />
          </div>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="bg-muted/50 rounded-xl p-1">
            <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-card">All</TabsTrigger>
            <TabsTrigger value="anomaly" className="rounded-lg data-[state=active]:bg-card"><AlertTriangle className="w-3.5 h-3.5 mr-1" />Anomalies</TabsTrigger>
            <TabsTrigger value="predictive" className="rounded-lg data-[state=active]:bg-card"><TrendingUp className="w-3.5 h-3.5 mr-1" />Predictive</TabsTrigger>
            <TabsTrigger value="daily_summary" className="rounded-lg data-[state=active]:bg-card"><Zap className="w-3.5 h-3.5 mr-1" />Summaries</TabsTrigger>
            <TabsTrigger value="performance" className="rounded-lg data-[state=active]:bg-card"><BarChart3 className="w-3.5 h-3.5 mr-1" />Performance</TabsTrigger>
          </TabsList>
          {["all", "anomaly", "predictive", "daily_summary", "performance"].map(tab => (
            <TabsContent key={tab} value={tab}>
              <InsightsList
                insights={tab === "predictive"
                  ? applyFilters(insights.filter(i => (i.insight_type ?? "").startsWith("predictive_")))
                  : filterByType(tab)}
                loading={loading}
                onMarkRead={markRead}
                onOpen={(row) => { setSelected(row); if (!row.is_read) markRead(row.id); }}
              />
            </TabsContent>
          ))}
        </Tabs>

        <AlertDetailSheet
          insight={selected}
          onClose={() => setSelected(null)}
          onStatus={setStatus}
          onNavigate={(url) => { setSelected(null); navigate(url); }}
        />
      </div>
    </AppLayout>
  );
};

function generateLocalInsights(allTasks: any[], completed: number, blocked: number, overdue: number, inProgress: number, urgentTasks: number, staffCount: number, uniqueAttendees: number, totalKpis: number, onTarget: number) {
  const newInsights: Array<{ title: string; content: string; severity: string; insight_type: string }> = [];
  if (blocked > 0) newInsights.push({ title: "Blocked Tasks Alert", content: `${blocked} task${blocked > 1 ? "s are" : " is"} currently blocked, indicating resource bottlenecks. Review and reassign to maintain velocity.`, severity: blocked > 3 ? "critical" : "warning", insight_type: "anomaly" });
  if (overdue > 0) newInsights.push({ title: "Overdue Tasks Detected", content: `${overdue} task${overdue > 1 ? "s have" : " has"} passed due date. ${allTasks.length > 0 ? Math.round((overdue / allTasks.length) * 100) : 0}% overdue rate. Consider redistributing workload.`, severity: overdue > 5 ? "critical" : "warning", insight_type: "anomaly" });
  const completionRate = allTasks.length > 0 ? Math.round((completed / allTasks.length) * 100) : 0;
  newInsights.push({ title: "Task Completion Summary", content: `Completion rate: ${completionRate}%. ${completed}/${allTasks.length} tasks completed. ${inProgress} in progress.`, severity: completionRate >= 60 ? "success" : completionRate >= 30 ? "info" : "warning", insight_type: "daily_summary" });
  if (staffCount && uniqueAttendees < staffCount * 0.7) {
    newInsights.push({ title: "Low Attendance This Week", content: `Only ${uniqueAttendees}/${staffCount} staff clocked in (${Math.round((uniqueAttendees / staffCount) * 100)}%), below 70% threshold.`, severity: "warning", insight_type: "anomaly" });
  } else {
    newInsights.push({ title: "Workforce Presence Report", content: `${uniqueAttendees} staff active this week${staffCount ? ` (${Math.round((uniqueAttendees / staffCount) * 100)}%)` : ""}. Attendance healthy.`, severity: "success", insight_type: "daily_summary" });
  }
  if (totalKpis > 0) { const r = Math.round((onTarget / totalKpis) * 100); newInsights.push({ title: "KPI Achievement Status", content: `${onTarget}/${totalKpis} KPIs on target (${r}%).`, severity: r >= 70 ? "success" : r >= 40 ? "info" : "warning", insight_type: "performance" }); }
  if (urgentTasks > 0) newInsights.push({ title: "Urgent Tasks Requiring Attention", content: `${urgentTasks} urgent task${urgentTasks > 1 ? "s" : ""} still pending. Prioritize to prevent delays.`, severity: "critical", insight_type: "task_priority" });
  return newInsights;
}

const InsightsList = ({ insights, loading, onMarkRead, onOpen }: { insights: any[]; loading: boolean; onMarkRead: (id: string) => void; onOpen: (row: any) => void }) => {
  if (loading) return <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}</div>;
  if (insights.length === 0) return (
    <div className="glass-card rounded-xl p-12 text-center">
      <Brain className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
      <p className="text-muted-foreground">No alerts match the current filters.</p>
    </div>
  );
  return (
    <div className="space-y-3">
      <AnimatePresence>
        {insights.map((insight, i) => {
          const Icon = severityIcons[insight.severity] || TrendingUp;
          const escalated = Number(insight.escalation_level ?? 0) > 0;
          const status = insight.status ?? "open";
          return (
            <motion.div key={insight.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }} exit={{ opacity: 0 }}
              className={`glass-card-strong rounded-xl p-5 space-y-2 cursor-pointer hover:border-accent/40 transition ${!insight.is_read ? "border-l-4 border-l-accent" : ""}`}
              onClick={() => onOpen(insight)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg ${severityColors[insight.severity] || ""} flex items-center justify-center`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{insight.title}</h4>
                    <p className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(insight.generated_at), { addSuffix: true })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {escalated && <Badge className="bg-destructive/10 text-destructive text-[10px]">Escalated L{insight.escalation_level}</Badge>}
                  <Badge variant="outline" className="text-[10px] capitalize">{String(status).replace("_", " ")}</Badge>
                  {insight.is_read && <CheckCircle className="w-3.5 h-3.5 text-green-500" />}
                  <Badge variant="outline" className={severityColors[insight.severity] || ""}>{insight.severity}</Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{insight.content}</p>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

function AlertDetailSheet({
  insight, onClose, onStatus, onNavigate,
}: {
  insight: any | null;
  onClose: () => void;
  onStatus: (id: string, status: string) => void;
  onNavigate: (url: string) => void;
}) {
  if (!insight) return null;
  const reason = insight.reason ?? insight.metadata ?? {};
  const link = reason?.link as string | undefined;
  const entries = Object.entries(reason).filter(([k]) => k !== "link");

  return (
    <Sheet open={!!insight} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-accent" /> {insight.title}
          </SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-[10px] capitalize">{insight.insight_type}</Badge>
            <Badge variant="outline" className={`text-[10px] ${severityColors[insight.severity] || ""}`}>{insight.severity}</Badge>
            <Badge variant="outline" className="text-[10px] capitalize">{(insight.status ?? "open").replace("_"," ")}</Badge>
            {Number(insight.escalation_level ?? 0) > 0 && (
              <Badge className="bg-destructive/10 text-destructive text-[10px]">Escalated L{insight.escalation_level}</Badge>
            )}
          </div>
          <p className="text-sm text-foreground leading-relaxed">{insight.content}</p>
          <div className="glass-card rounded-xl p-3">
            <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-accent" /> Why this fired
            </p>
            {entries.length === 0 ? (
              <p className="text-xs text-muted-foreground">No structured evidence attached.</p>
            ) : (
              <dl className="text-xs grid grid-cols-2 gap-y-1">
                {entries.map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="text-foreground truncate">{String(v)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {link && (
              <Button size="sm" onClick={() => onNavigate(link)} className="rounded-xl bg-accent text-accent-foreground">
                <ExternalLink className="w-3.5 h-3.5 mr-1" /> Open source
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl"
              onClick={async () => {
                const { triggerCognition } = await import("@/lib/cognition");
                await triggerCognition(
                  `Insight to deliberate: "${insight.title}". ${insight.content}\n\nSeverity: ${insight.severity}. Recommend root cause, owner, and next steps.`,
                  null,
                );
                onNavigate("/cognition");
              }}
            >
              <Brain className="w-3.5 h-3.5 mr-1" /> Deliberate with leadership
            </Button>
            <Button size="sm" variant="outline" className="rounded-xl" onClick={() => onStatus(insight.id, "acknowledged")}>Acknowledge</Button>
            <Button size="sm" variant="outline" className="rounded-xl" onClick={() => onStatus(insight.id, "resolved")}>Mark resolved</Button>
            <Button size="sm" variant="ghost" className="rounded-xl text-muted-foreground" onClick={() => onStatus(insight.id, "dismissed")}>Dismiss</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default AIInsightsModule;
