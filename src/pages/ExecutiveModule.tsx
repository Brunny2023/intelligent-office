import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Crown, Users, CheckSquare, Clock, TrendingUp, BarChart3, Activity, AlertTriangle, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from "recharts";

const CHART_COLORS = ["hsl(38,80%,55%)", "hsl(210,90%,55%)", "hsl(0,84%,60%)", "hsl(150,60%,40%)", "hsl(270,60%,55%)"];

const ExecutiveModule = () => {
  const { user } = useAuth();
  const { org, loading: orgLoading } = useOrganization();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!org) return;
    const load = async () => {
      const [
        { data: profiles }, { data: tasks }, { data: attendance },
        { data: kpis }, { data: departments }, { data: leaveRequests },
        { data: insights },
      ] = await Promise.all([
        supabase.from("profiles").select("id, full_name, department_id, job_title").eq("organization_id", org.id),
        supabase.from("tasks").select("id, status, priority, due_date, assigned_to, completed_at, created_at").eq("organization_id", org.id),
        supabase.from("attendance_records").select("user_id, clock_in, clock_out, status, created_at").eq("organization_id", org.id).gte("clock_in", new Date(Date.now() - 30 * 86400000).toISOString()),
        supabase.from("kpis").select("*").eq("organization_id", org.id),
        supabase.from("departments").select("*").eq("organization_id", org.id),
        supabase.from("leave_requests").select("*").eq("organization_id", org.id).eq("status", "approved"),
        supabase.from("ai_insights").select("severity, insight_type").eq("organization_id", org.id).order("generated_at", { ascending: false }).limit(20),
      ]);

      const allProfiles = profiles || [];
      const allTasks = tasks || [];
      const allAttendance = attendance || [];
      const allKpis = kpis || [];
      const allDepts = departments || [];

      // Workforce metrics
      const totalStaff = allProfiles.length;
      const todayStr = new Date().toISOString().slice(0, 10);
      const todayAttendance = allAttendance.filter(a => a.clock_in?.startsWith(todayStr));
      const presentToday = new Set(todayAttendance.map(a => a.user_id)).size;
      const onLeave = (leaveRequests || []).filter(l => l.start_date <= todayStr && l.end_date >= todayStr).length;

      // Task metrics
      const completed = allTasks.filter(t => t.status === "completed").length;
      const blocked = allTasks.filter(t => t.status === "blocked").length;
      const overdue = allTasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== "completed").length;
      const completionRate = allTasks.length > 0 ? Math.round((completed / allTasks.length) * 100) : 0;

      // KPI health
      const kpiOnTarget = allKpis.filter(k => Number(k.current_value) >= Number(k.target_value)).length;
      const kpiRate = allKpis.length > 0 ? Math.round((kpiOnTarget / allKpis.length) * 100) : 0;

      // Health score (weighted)
      const attendanceScore = totalStaff > 0 ? (presentToday / totalStaff) * 100 : 0;
      const healthScore = Math.round((completionRate * 0.3 + kpiRate * 0.3 + attendanceScore * 0.4));

      // Department performance
      const deptPerformance = allDepts.map(dept => {
        const deptProfiles = allProfiles.filter(p => p.department_id === dept.id);
        const deptUserIds = deptProfiles.map(p => p.id);
        const deptTasks = allTasks.filter(t => t.assigned_to && deptUserIds.includes(t.assigned_to));
        const deptCompleted = deptTasks.filter(t => t.status === "completed").length;
        const deptAttendance = todayAttendance.filter(a => deptUserIds.includes(a.user_id));
        return {
          name: dept.name.length > 12 ? dept.name.slice(0, 12) + "…" : dept.name,
          staff: deptProfiles.length,
          tasks: deptTasks.length,
          completed: deptCompleted,
          rate: deptTasks.length > 0 ? Math.round((deptCompleted / deptTasks.length) * 100) : 0,
          present: new Set(deptAttendance.map(a => a.user_id)).size,
        };
      });

      // Task status distribution
      const statusDist = [
        { name: "To Do", value: allTasks.filter(t => t.status === "todo").length },
        { name: "In Progress", value: allTasks.filter(t => t.status === "in_progress").length },
        { name: "Review", value: allTasks.filter(t => t.status === "review").length },
        { name: "Completed", value: completed },
        { name: "Blocked", value: blocked },
      ].filter(s => s.value > 0);

      // Weekly attendance trend (last 4 weeks)
      const weeklyAttendance = Array.from({ length: 4 }, (_, i) => {
        const weekStart = new Date(Date.now() - (3 - i) * 7 * 86400000);
        const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);
        const weekRecords = allAttendance.filter(a => {
          const d = new Date(a.clock_in);
          return d >= weekStart && d < weekEnd;
        });
        return { week: `W${i + 1}`, present: new Set(weekRecords.map(a => a.user_id)).size };
      });

      // Risk alerts
      const risks: string[] = [];
      if (blocked > 3) risks.push(`${blocked} tasks blocked`);
      if (overdue > 5) risks.push(`${overdue} tasks overdue`);
      if (attendanceScore < 60) risks.push("Attendance below 60%");
      if (kpiRate < 40) risks.push("KPI achievement below 40%");

      // Insight breakdown
      const criticalInsights = (insights || []).filter((i: any) => i.severity === "critical").length;

      setMetrics({
        totalStaff, presentToday, onLeave, completionRate, blocked, overdue, kpiRate, healthScore,
        deptPerformance, statusDist, weeklyAttendance, risks, criticalInsights,
        totalTasks: allTasks.length, completed, kpiOnTarget, totalKpis: allKpis.length,
      });
      setLoading(false);
    };
    load();
  }, [org]);

  if (orgLoading || loading) {
    return <AppLayout title="Executive Center"><div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div></AppLayout>;
  }

  if (!metrics) return <AppLayout title="Executive Center"><div className="p-8 text-muted-foreground">No data available</div></AppLayout>;

  return (
    <AppLayout title="Executive Center">
      <div className="p-6 md:p-8 space-y-6">
         <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2"><Crown className="w-6 sm:w-7 h-6 sm:h-7 text-accent" /> Executive Control Center</h1>
          <p className="text-muted-foreground text-sm mt-1">Live organizational health dashboard</p>
        </motion.div>

        {/* Health Score + KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
          {[
            { label: "Health Score", value: `${metrics.healthScore}%`, icon: TrendingUp, color: metrics.healthScore >= 70 ? "text-green-600" : metrics.healthScore >= 40 ? "text-svo-gold" : "text-destructive" },
            { label: "Present Today", value: `${metrics.presentToday}/${metrics.totalStaff}`, icon: Users, color: "text-svo-blue" },
            { label: "On Leave", value: metrics.onLeave, icon: Clock, color: "text-svo-gold" },
            { label: "Task Completion", value: `${metrics.completionRate}%`, icon: CheckSquare, color: "text-accent" },
            { label: "KPI Achievement", value: `${metrics.kpiRate}%`, icon: BarChart3, color: "text-svo-blue" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05 } }} className="glass-card-strong rounded-xl p-4">
              <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Risk alerts */}
        {metrics.risks.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card-strong rounded-xl p-4 border-l-4 border-l-destructive">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <h3 className="font-semibold text-foreground">Risk Alerts</h3>
              {metrics.criticalInsights > 0 && <Badge variant="outline" className="bg-destructive/10 text-destructive">{metrics.criticalInsights} critical</Badge>}
            </div>
            <div className="flex flex-wrap gap-2">
              {metrics.risks.map((r: string, i: number) => (
                <Badge key={i} variant="outline" className="bg-destructive/5 text-destructive">{r}</Badge>
              ))}
            </div>
          </motion.div>
        )}

        {/* Charts row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Department Performance */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }} className="glass-card-strong rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-accent" /> Department Performance</h3>
            {metrics.deptPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={metrics.deptPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Bar dataKey="rate" name="Completion %" fill="hsl(38,80%,55%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="present" name="Present" fill="hsl(210,90%,55%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground">No departments set up yet</p>}
          </motion.div>

          {/* Task Distribution */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.25 } }} className="glass-card-strong rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><CheckSquare className="w-4 h-4 text-accent" /> Task Distribution</h3>
            {metrics.statusDist.length > 0 ? (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <ResponsiveContainer width="60%" height={200}>
                  <PieChart>
                    <Pie data={metrics.statusDist} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {metrics.statusDist.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {metrics.statusDist.map((s: any, i: number) => (
                    <div key={s.name} className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 rounded-sm" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-muted-foreground">{s.name}</span>
                      <span className="font-semibold text-foreground ml-auto">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : <p className="text-sm text-muted-foreground">No tasks yet</p>}
          </motion.div>
        </div>

        {/* Weekly attendance trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }} className="glass-card-strong rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-accent" /> Weekly Attendance Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={metrics.weeklyAttendance}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Area type="monotone" dataKey="present" stroke="hsl(38,80%,55%)" fill="hsl(38,80%,55%)" fillOpacity={0.2} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Quick metrics footer */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Tasks", value: metrics.totalTasks },
            { label: "Completed", value: metrics.completed },
            { label: "Blocked", value: metrics.blocked },
            { label: "Overdue", value: metrics.overdue },
          ].map((m, i) => (
            <div key={m.label} className="glass-card rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-foreground">{m.value}</p>
              <p className="text-xs text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default ExecutiveModule;
