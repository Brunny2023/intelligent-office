import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import ClockInWidget from "@/components/attendance/ClockInWidget";
import ActivityFeed from "@/components/activity/ActivityFeed";
import AppLayout from "@/components/layout/AppLayout";
import { motion } from "framer-motion";
import {
  Users, CheckSquare, MessageSquare, BarChart3,
  Clock, Activity, Video
} from "lucide-react";

const quickStats = [
  { label: "Team Members", value: "—", icon: Users },
  { label: "Active Tasks", value: "—", icon: CheckSquare },
  { label: "Messages", value: "—", icon: MessageSquare },
  { label: "Health Score", value: "—", icon: BarChart3 },
];

const modules = [
  { icon: Clock, label: "Attendance", description: "Check in & workforce presence", color: "bg-svo-blue/10 text-svo-blue", path: "/attendance" },
  { icon: Activity, label: "Activity Log", description: "Track all operations", color: "bg-accent/10 text-accent", path: "/activity" },
  { icon: CheckSquare, label: "Execution", description: "Projects, tasks & workflows", color: "bg-svo-gold/10 text-svo-gold", path: "/execution" },
  { icon: MessageSquare, label: "Communication", description: "Messages & channels", color: "bg-svo-blue-light/10 text-svo-blue-light", path: "/messages" },
  { icon: Video, label: "Meetings", description: "Video conferencing & AI", color: "bg-svo-blue/10 text-svo-blue", path: "/meetings" },
  { icon: BarChart3, label: "Intelligence", description: "KPIs & performance", color: "bg-accent/10 text-accent", path: null },
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
      <div className="p-6 md:p-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Welcome back, {profile?.full_name?.split(" ")[0] || "there"} 👋
          </h1>
          <p className="text-muted-foreground mt-1">Here's your digital headquarters overview</p>
        </motion.div>

        {/* Top section: Clock-in + Quick stats */}
        <div className="grid lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
            className="lg:col-span-1"
          >
            <ClockInWidget />
          </motion.div>
          <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickStats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.15 + i * 0.05 } }}
                whileHover={{ y: -2, boxShadow: "0 4px 12px hsl(var(--svo-navy) / 0.08)" }}
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

        {/* Module grid + Activity feed */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-foreground mb-4">Modules</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {modules.map((mod, i) => (
                <motion.button
                  key={mod.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.2 + i * 0.05 } }}
                  whileHover={{ y: -4, boxShadow: "0 8px 24px hsl(var(--svo-navy) / 0.1)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => mod.path && navigate(mod.path)}
                  disabled={!mod.path}
                  className="glass-card-strong rounded-xl p-6 text-left transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className={`w-10 h-10 rounded-xl ${mod.color} flex items-center justify-center mb-3`}>
                    <mod.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">
                    {mod.label}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {mod.description}
                    {!mod.path && " (Coming soon)"}
                  </p>
                </motion.button>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.4 } }}
          >
            <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
            <ActivityFeed scope="organization" limit={10} />
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
