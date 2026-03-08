import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import ClockInWidget from "@/components/attendance/ClockInWidget";
import ActivityFeed from "@/components/activity/ActivityFeed";
import PerformanceWidget from "@/components/dashboard/PerformanceWidget";
import AppLayout from "@/components/layout/AppLayout";
import { motion } from "framer-motion";
import {
  Users, CheckSquare, MessageSquare, BarChart3,
  Clock, Activity, Video, FileText, DollarSign, Briefcase,
  Megaphone, Brain, Crown, Workflow, UserPlus, Target, Shield, Sparkles
} from "lucide-react";

const quickStats = [
  { label: "Team Members", value: "—", icon: Users },
  { label: "Active Tasks", value: "—", icon: CheckSquare },
  { label: "Messages", value: "—", icon: MessageSquare },
  { label: "Health Score", value: "—", icon: BarChart3 },
];

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

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
            Welcome back, {profile?.full_name?.split(" ")[0] || "there"} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Here's your digital headquarters overview</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }} className="md:col-span-1 lg:col-span-1">
            <ClockInWidget />
          </motion.div>
          <div className="md:col-span-1 lg:col-span-2 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {quickStats.map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.15 + i * 0.05 } }}
                whileHover={{ y: -4, boxShadow: "0 8px 24px hsl(var(--svo-navy) / 0.1)", transition: { type: "spring", stiffness: 400, damping: 20 } }}
                whileTap={{ scale: 0.97 }}
                className="glass-card rounded-xl p-4 cursor-default"
              >
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </motion.div>
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
              {modules.map((mod, i) => (
                <motion.button key={mod.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.2 + i * 0.03 } }}
                  whileHover={{ y: -6, boxShadow: "0 12px 32px hsl(var(--svo-navy) / 0.12)", transition: { type: "spring", stiffness: 400, damping: 20 } }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => navigate(mod.path)} className="glass-card-strong rounded-xl p-5 text-left transition-all group"
                >
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.5 } }}
                    className={`w-10 h-10 rounded-xl ${mod.color} flex items-center justify-center mb-3`}
                  >
                    <mod.icon className="w-5 h-5" />
                  </motion.div>
                  <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">{mod.label}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{mod.description}</p>
                </motion.button>
              ))}
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.4 } }}>
            <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
            <ActivityFeed scope="organization" limit={10} />
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
