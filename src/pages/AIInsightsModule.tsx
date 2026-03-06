import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sparkles, AlertTriangle, TrendingUp, RefreshCw, Zap, BarChart3, Users } from "lucide-react";
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

  const generateInsights = async () => {
    if (!user || !org) return;
    setGenerating(true);

    try {
      // Gather org data for AI analysis
      const [{ data: tasks }, { data: attendance }, { data: kpis }, { count: staffCount }] = await Promise.all([
        supabase.from("tasks").select("id, status, priority, due_date, assigned_to, completed_at").eq("organization_id", org.id),
        supabase.from("attendance_records").select("user_id, clock_in, status").eq("organization_id", org.id).gte("clock_in", new Date(Date.now() - 7 * 86400000).toISOString()),
        supabase.from("kpis").select("title, current_value, target_value, status").eq("organization_id", org.id),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("organization_id", org.id),
      ]);

      const allTasks = tasks || [];
      const completed = allTasks.filter(t => t.status === "completed").length;
      const blocked = allTasks.filter(t => t.status === "blocked").length;
      const overdue = allTasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== "completed").length;
      const totalKpis = (kpis || []).length;
      const onTarget = (kpis || []).filter(k => Number(k.current_value) >= Number(k.target_value)).length;
      const uniqueAttendees = new Set((attendance || []).map(a => a.user_id)).size;

      // Generate insights locally based on data analysis
      const newInsights: Array<{ title: string; content: string; severity: string; insight_type: string }> = [];

      // Task analysis
      if (blocked > 0) {
        newInsights.push({
          title: "Blocked Tasks Alert",
          content: `${blocked} task${blocked > 1 ? "s are" : " is"} currently blocked. This may indicate resource bottlenecks or dependency issues. Review blocked items and reassign or unblock them to maintain velocity.`,
          severity: blocked > 3 ? "critical" : "warning",
          insight_type: "anomaly",
        });
      }

      if (overdue > 0) {
        newInsights.push({
          title: "Overdue Tasks Detected",
          content: `${overdue} task${overdue > 1 ? "s have" : " has"} passed their due date. Out of ${allTasks.length} total tasks, ${Math.round((overdue / allTasks.length) * 100)}% are overdue. Consider redistributing workload or adjusting timelines.`,
          severity: overdue > 5 ? "critical" : "warning",
          insight_type: "anomaly",
        });
      }

      // Completion rate
      const completionRate = allTasks.length > 0 ? Math.round((completed / allTasks.length) * 100) : 0;
      newInsights.push({
        title: "Task Completion Summary",
        content: `Organization task completion rate: ${completionRate}%. ${completed} of ${allTasks.length} tasks completed. ${allTasks.filter(t => t.status === "in_progress").length} currently in progress.`,
        severity: completionRate >= 60 ? "success" : completionRate >= 30 ? "info" : "warning",
        insight_type: "daily_summary",
      });

      // Attendance
      if (staffCount && uniqueAttendees < staffCount * 0.7) {
        newInsights.push({
          title: "Low Attendance This Week",
          content: `Only ${uniqueAttendees} of ${staffCount} staff members clocked in this week (${Math.round((uniqueAttendees / staffCount) * 100)}%). This is below the 70% threshold. Check for unreported absences or system issues.`,
          severity: "warning",
          insight_type: "anomaly",
        });
      } else {
        newInsights.push({
          title: "Workforce Presence Report",
          content: `${uniqueAttendees} staff members active this week${staffCount ? ` out of ${staffCount} total (${Math.round((uniqueAttendees / (staffCount || 1)) * 100)}%)` : ""}. Attendance is healthy.`,
          severity: "success",
          insight_type: "daily_summary",
        });
      }

      // KPI analysis
      if (totalKpis > 0) {
        const kpiRate = Math.round((onTarget / totalKpis) * 100);
        newInsights.push({
          title: "KPI Achievement Status",
          content: `${onTarget} of ${totalKpis} KPIs are on target (${kpiRate}%). ${totalKpis - onTarget} KPI${totalKpis - onTarget !== 1 ? "s" : ""} need${totalKpis - onTarget === 1 ? "s" : ""} attention to meet targets.`,
          severity: kpiRate >= 70 ? "success" : kpiRate >= 40 ? "info" : "warning",
          insight_type: "performance",
        });
      }

      // Priority distribution insight
      const urgentTasks = allTasks.filter(t => t.priority === "urgent" && t.status !== "completed").length;
      if (urgentTasks > 0) {
        newInsights.push({
          title: "Urgent Tasks Requiring Attention",
          content: `${urgentTasks} urgent task${urgentTasks > 1 ? "s" : ""} still pending. Prioritize these items to prevent cascading delays.`,
          severity: "critical",
          insight_type: "task_priority",
        });
      }

      // Insert insights
      for (const insight of newInsights) {
        await supabase.from("ai_insights").insert({
          organization_id: org.id,
          ...insight,
          created_by: user.id,
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

        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Insights", value: insights.length, icon: Brain, color: "text-accent" },
            { label: "Anomalies", value: insights.filter(i => i.insight_type === "anomaly").length, icon: AlertTriangle, color: "text-destructive" },
            { label: "Performance", value: insights.filter(i => i.insight_type === "performance").length, icon: BarChart3, color: "text-svo-blue" },
            { label: "Summaries", value: insights.filter(i => i.insight_type === "daily_summary").length, icon: Zap, color: "text-svo-gold" },
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
              <InsightsList insights={filterByType(tab)} loading={loading} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AppLayout>
  );
};

const InsightsList = ({ insights, loading }: { insights: any[]; loading: boolean }) => {
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
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }}
              exit={{ opacity: 0 }}
              className="glass-card-strong rounded-xl p-5 space-y-2"
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
                <Badge variant="outline" className={severityColors[insight.severity] || ""}>{insight.severity}</Badge>
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
