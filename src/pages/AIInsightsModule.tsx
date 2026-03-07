import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sparkles, AlertTriangle, TrendingUp, RefreshCw, Zap, BarChart3, Users, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

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
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

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

  const filterByType = (type: string) => type === "all" ? insights : insights.filter(i => i.insight_type === type);
  const unreadCount = insights.filter(i => !i.is_read).length;

  if (orgLoading) {
    return <AppLayout title="AI Intelligence"><div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div></AppLayout>;
  }

  return (
    <AppLayout title="AI Intelligence">
      <div className="p-6 md:p-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Brain className="w-7 h-7 text-accent" /> AI Intelligence Center
            </h1>
            <p className="text-muted-foreground mt-1">AI-powered insights, anomaly detection & performance analysis</p>
          </div>
          <Button onClick={generateInsights} disabled={generating} className="rounded-xl bg-accent text-accent-foreground">
            {generating ? <><RefreshCw className="w-4 h-4 mr-1 animate-spin" /> Analyzing...</> : <><Sparkles className="w-4 h-4 mr-1" /> Generate Insights</>}
          </Button>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Total Insights", value: insights.length, icon: Brain, color: "text-accent" },
            { label: "Unread", value: unreadCount, icon: Zap, color: "text-svo-gold" },
            { label: "Anomalies", value: insights.filter(i => i.insight_type === "anomaly").length, icon: AlertTriangle, color: "text-destructive" },
            { label: "Performance", value: insights.filter(i => i.insight_type === "performance").length, icon: BarChart3, color: "text-svo-blue" },
            { label: "Summaries", value: insights.filter(i => i.insight_type === "daily_summary").length, icon: Users, color: "text-green-600" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05 } }} className="glass-card rounded-xl p-4">
              <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="bg-muted/50 rounded-xl p-1">
            <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-card">All</TabsTrigger>
            <TabsTrigger value="anomaly" className="rounded-lg data-[state=active]:bg-card"><AlertTriangle className="w-3.5 h-3.5 mr-1" />Anomalies</TabsTrigger>
            <TabsTrigger value="daily_summary" className="rounded-lg data-[state=active]:bg-card"><Zap className="w-3.5 h-3.5 mr-1" />Summaries</TabsTrigger>
            <TabsTrigger value="performance" className="rounded-lg data-[state=active]:bg-card"><BarChart3 className="w-3.5 h-3.5 mr-1" />Performance</TabsTrigger>
            <TabsTrigger value="task_priority" className="rounded-lg data-[state=active]:bg-card"><TrendingUp className="w-3.5 h-3.5 mr-1" />Priority</TabsTrigger>
          </TabsList>
          {["all", "anomaly", "daily_summary", "performance", "task_priority"].map(tab => (
            <TabsContent key={tab} value={tab}>
              <InsightsList insights={filterByType(tab)} loading={loading} onMarkRead={markRead} />
            </TabsContent>
          ))}
        </Tabs>
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

const InsightsList = ({ insights, loading, onMarkRead }: { insights: any[]; loading: boolean; onMarkRead: (id: string) => void }) => {
  if (loading) return <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}</div>;
  if (insights.length === 0) return (
    <div className="glass-card rounded-xl p-12 text-center">
      <Brain className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
      <p className="text-muted-foreground">No insights yet. Click "Generate Insights" to analyze your organization.</p>
    </div>
  );
  return (
    <div className="space-y-3">
      <AnimatePresence>
        {insights.map((insight, i) => {
          const Icon = severityIcons[insight.severity] || TrendingUp;
          return (
            <motion.div key={insight.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }} exit={{ opacity: 0 }}
              className={`glass-card-strong rounded-xl p-5 space-y-2 ${!insight.is_read ? "border-l-4 border-l-accent" : ""}`}
              onMouseEnter={() => !insight.is_read && onMarkRead(insight.id)}
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

export default AIInsightsModule;
