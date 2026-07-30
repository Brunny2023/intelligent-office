import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import { useUserRole } from "@/hooks/useUserRole";
import { isPathAllowed, roleGreeting } from "@/lib/roleNav";
import { supabase } from "@/integrations/supabase/client";
import ClockInWidget from "@/components/attendance/ClockInWidget";
import ActivityFeed from "@/components/activity/ActivityFeed";
import PerformanceWidget from "@/components/dashboard/PerformanceWidget";
import AIInsightWidget from "@/components/dashboard/AIInsightWidget";
import OnboardingChecklist from "@/components/dashboard/OnboardingChecklist";
import CognitionPulseWidget from "@/components/dashboard/CognitionPulseWidget";
import AppLayout from "@/components/layout/AppLayout";
import { PageHeader, StatCard, PersonAvatar, type Tone } from "@/components/dashboard/kit";
import { motion } from "framer-motion";
import {
  Users, CheckSquare, MessageSquare, BarChart3,
  Clock, Activity, Video, FileText, DollarSign, Briefcase,
  Megaphone, Brain, Crown, Workflow, UserPlus, Target, Shield, Sparkles
} from "lucide-react";

const STAT_META = [
  { key: "team", label: "Team Members", icon: Users, tone: "blue" as Tone },
  { key: "tasks", label: "Active Tasks", icon: CheckSquare, tone: "gold" as Tone },
  { key: "messages", label: "Messages (7d)", icon: MessageSquare, tone: "violet" as Tone },
  { key: "health", label: "Health Score", icon: BarChart3, tone: "emerald" as Tone },
] as const;

const modules = [
  { icon: Clock, label: "Attendance", description: "Check in & workforce presence", color: "bg-svo-blue/10 text-svo-blue", path: "/attendance" },
  { icon: Target, label: "Job Planning", description: "Goals, targets & planning", color: "bg-accent/10 text-accent", path: "/job-planning" },
  { icon: CheckSquare, label: "Execution", description: "Projects, tasks & workflows", color: "bg-svo-gold/10 text-svo-gold", path: "/execution" },
  { icon: MessageSquare, label: "Communication", description: "Messages & channels", color: "bg-svo-blue-light/10 text-svo-blue-light", path: "/messages" },
  { icon: Video, label: "Meetings", description: "Video conferencing & AI", color: "bg-svo-blue/10 text-svo-blue", path: "/meetings" },
  { icon: Megaphone, label: "Announcements", description: "Corporate broadcasts", color: "bg-destructive/10 text-destructive", path: "/announcements" },
  { icon: FileText, label: "Documents", description: "Files & knowledge base", color: "bg-accent/10 text-accent", path: "/documents" },
  { icon: BarChart3, label: "Intelligence", description: "KPIs & performance", color: "bg-accent/10 text-accent", path: "/intelligence" },
  { icon: Brain, label: "AI Insights", description: "Anomalies & analysis", color: "bg-svo-gold/10 text-svo-gold", path: "/ai-insights" },
  { icon: Crown, label: "Executive", description: "Control center & health", color: "bg-accent/10 text-accent", path: "/executive" },
  { icon: Workflow, label: "Workflows", description: "Automation & approvals", color: "bg-svo-blue/10 text-svo-blue", path: "/workflows" },
  { icon: Briefcase, label: "HR", description: "Recruitment & onboarding", color: "bg-svo-gold/10 text-svo-gold", path: "/hr" },
  { icon: DollarSign, label: "Finance", description: "Payroll & expenses", color: "bg-green-500/10 text-green-600", path: "/finance" },
  { icon: UserPlus, label: "Team", description: "Members & invitations", color: "bg-svo-blue-light/10 text-svo-blue-light", path: "/team" },
  { icon: Shield, label: "Security", description: "Compliance & audit", color: "bg-destructive/10 text-destructive", path: "/security" },
];

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { profile, org, loading } = useOrganization();
  const { role } = useUserRole();
  const visibleModules = modules.filter((m) => isPathAllowed(role, m.path));
  const [stats, setStats] = useState<Record<string, string>>({ team: "—", tasks: "—", messages: "—", health: "—" });

  useEffect(() => {
    if (!org?.id) return;
    const orgId = org.id;
    const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    (async () => {
      const [teamRes, tasksActive, tasksDone, tasksTotal, kpisAll, attendance, channels] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("organization_id", orgId),
        supabase.from("tasks").select("id", { count: "exact", head: true }).eq("organization_id", orgId).in("status", ["todo", "in_progress", "review"]),
        supabase.from("tasks").select("id", { count: "exact", head: true }).eq("organization_id", orgId).eq("status", "completed"),
        supabase.from("tasks").select("id", { count: "exact", head: true }).eq("organization_id", orgId),
        supabase.from("kpis").select("current_value,target_value").eq("organization_id", orgId),
        supabase.from("attendance_records").select("id", { count: "exact", head: true }).eq("organization_id", orgId).gte("clock_in", new Date(new Date().toDateString()).toISOString()),
        supabase.from("channels").select("id").eq("organization_id", orgId),
      ]);
      let messagesCount = 0;
      const channelIds = (channels.data || []).map((c) => c.id);
      if (channelIds.length > 0) {
        const msgs = await supabase.from("messages").select("id", { count: "exact", head: true }).in("channel_id", channelIds).gte("created_at", since);
        messagesCount = msgs.count || 0;
      }
      const teamCount = teamRes.count || 0;
      const activeCount = tasksActive.count || 0;
      const doneCount = tasksDone.count || 0;
      const totalCount = tasksTotal.count || 0;
      const completionRate = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;
      const kpis = kpisAll.data || [];
      const kpiRate = kpis.length > 0
        ? kpis.reduce((s, k) => s + Math.min(100, (Number(k.current_value || 0) / Math.max(1, Number(k.target_value || 1))) * 100), 0) / kpis.length
        : 0;
      const attendanceRate = teamCount > 0 ? Math.min(100, ((attendance.count || 0) / teamCount) * 100) : 0;
      const health = Math.round(completionRate * 0.3 + kpiRate * 0.3 + attendanceRate * 0.4);
      setStats({
        team: String(teamCount),
        tasks: String(activeCount),
        messages: String(messagesCount),
        health: totalCount + kpis.length + teamCount === 0 ? "—" : `${health}%`,
      });
    })();
  }, [org?.id]);

  useEffect(() => {
    if (!loading && profile && !profile.organization_id) {
      navigate("/onboarding");
    }
  }, [loading, profile, navigate]);

  if (loading) {
    return (
      <AppLayout title="Dashboard">
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Dashboard">
      <div className="p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8">
        {/* Org branding header */}
        {org && (org.brand_tagline || org.mission || (org.core_values && org.core_values.length > 0)) && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card-strong rounded-2xl p-5 border-l-4 border-l-accent"
          >
            <div className="flex items-start gap-4">
              {org.logo_url && (
                <img src={org.logo_url} alt={org.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                  <h2 className="font-bold text-foreground text-base sm:text-lg">{org.name}</h2>
                  {org.brand_tagline && (
                    <span className="text-xs text-accent flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> {org.brand_tagline}
                    </span>
                  )}
                </div>
                {org.mission && <p className="text-sm text-muted-foreground mb-2">{org.mission}</p>}
                {org.core_values && org.core_values.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {org.core_values.map((v, i) => (
                      <motion.span
                        key={v}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1, transition: { delay: i * 0.05 } }}
                        className="text-[10px] px-2.5 py-1 rounded-full bg-accent/10 text-accent font-medium"
                      >
                        {v}
                      </motion.span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        <PageHeader
          eyebrow="Command Center"
          icon={Sparkles}
          avatar={<PersonAvatar name={profile?.full_name} src={profile?.avatar_url} size={56} />}
          title={`Welcome back, ${profile?.full_name?.split(" ")[0] || "there"}`}
          subtitle={roleGreeting(role)}
        />

        <OnboardingChecklist />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }} className="md:col-span-1 lg:col-span-1">
            <ClockInWidget />
          </motion.div>
          <div className="md:col-span-1 lg:col-span-2 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {STAT_META.map((stat, i) => (
              <StatCard
                key={stat.label}
                index={i}
                label={stat.label}
                value={stats[stat.key]}
                icon={stat.icon}
                tone={stat.tone}
                progress={stat.key === "health" && stats.health.endsWith("%") ? parseInt(stats.health, 10) : undefined}
              />
            ))}
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.25 } }}>
          <PerformanceWidget />
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="md:col-span-1 lg:col-span-2">
            <h2 className="text-lg font-semibold text-foreground mb-4">Modules</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {visibleModules.map((mod, i) => (
                <motion.button key={mod.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.2 + i * 0.03 } }}
                  whileHover={{ y: -6, boxShadow: "0 12px 32px hsl(var(--svo-navy) / 0.12)", transition: { type: "spring", stiffness: 400, damping: 20 } }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => navigate(mod.path)} className="glass-card-strong rounded-xl p-4 md:p-5 text-left transition-all group"
                >
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.5 } }}
                    className={`w-8 h-8 md:w-10 md:h-10 rounded-xl ${mod.color} flex items-center justify-center mb-2 md:mb-3`}
                  >
                    <mod.icon className="w-4 h-4 md:w-5 md:h-5" />
                  </motion.div>
                  <h3 className="font-semibold text-foreground text-sm md:text-base group-hover:text-accent transition-colors">{mod.label}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1 line-clamp-2">{mod.description}</p>
                </motion.button>
              ))}
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.4 } }}>
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">Team Activity</h2>
                <ActivityFeed scope="organization" limit={8} />
              </div>
              <CognitionPulseWidget />
              <AIInsightWidget />
            </div>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
