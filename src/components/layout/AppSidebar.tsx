import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Clock, CheckSquare, MessageSquare, BarChart3,
  FileText, LogOut, Building2, Activity, Video,
  ChevronLeft, ChevronRight, Home, Briefcase, DollarSign,
  Megaphone, Brain, Crown, Workflow, Users
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Dashboard", path: "/dashboard" },
  { icon: Clock, label: "Attendance", path: "/attendance" },
  { icon: CheckSquare, label: "Execution", path: "/execution" },
  { icon: MessageSquare, label: "Messages", path: "/messages" },
  { icon: Video, label: "Meetings", path: "/meetings" },
  { icon: Megaphone, label: "Announcements", path: "/announcements" },
  { icon: Activity, label: "Activity", path: "/activity" },
  { icon: FileText, label: "Documents", path: "/documents" },
  { icon: BarChart3, label: "Intelligence", path: "/intelligence" },
  { icon: Brain, label: "AI Insights", path: "/ai-insights" },
  { icon: Crown, label: "Executive", path: "/executive" },
  { icon: Workflow, label: "Workflows", path: "/workflows" },
  { icon: Briefcase, label: "HR", path: "/hr" },
  { icon: DollarSign, label: "Finance", path: "/finance" },
  { icon: Users, label: "Team", path: "/team" },
];

const AppSidebar = () => {
  const { signOut } = useAuth();
  const { profile, org } = useOrganization();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="h-screen sticky top-0 bg-sidebar border-r border-sidebar-border flex flex-col z-50"
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5 text-sidebar-primary-foreground" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} className="ml-3 overflow-hidden whitespace-nowrap">
              <p className="text-sm font-bold font-['Space_Grotesk'] text-sidebar-foreground">Soteria<span className="text-sidebar-primary">.</span></p>
              {org && <p className="text-[10px] text-sidebar-foreground/60 flex items-center gap-1"><Building2 className="w-2.5 h-2.5" /> {org.name}</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <motion.button key={item.path} whileHover={{ x: 2 }} whileTap={{ scale: 0.97 }} onClick={() => navigate(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors relative",
                isActive ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              {isActive && <motion.div layoutId="sidebar-active" className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-sidebar-primary" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
              <item.icon className="w-[18px] h-[18px] shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} className="overflow-hidden whitespace-nowrap">{item.label}</motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-2 space-y-1">
        <AnimatePresence>
          {!collapsed && profile && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-3 py-2">
              <p className="text-xs font-medium text-sidebar-foreground truncate">{profile.full_name}</p>
              <p className="text-[10px] text-sidebar-foreground/50 truncate">{profile.job_title || "Team Member"}</p>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex items-center gap-1">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setCollapsed(!collapsed)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={signOut}
            className="flex items-center justify-center px-3 py-2 rounded-xl text-sidebar-foreground/60 hover:bg-destructive/20 hover:text-destructive transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.aside>
  );
};

export default AppSidebar;
