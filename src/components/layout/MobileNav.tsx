import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Clock, CheckSquare, MessageSquare, Target, Menu, X, BarChart3, Shield, Users, FileText, Video, Megaphone, Brain, Crown, Workflow, Briefcase, DollarSign, Activity, Ticket, ShieldCheck, Settings, Globe } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const mainTabs = [
  { icon: Home, label: "Home", path: "/dashboard" },
  { icon: Clock, label: "Clock In", path: "/attendance" },
  { icon: Target, label: "Plans", path: "/job-planning" },
  { icon: MessageSquare, label: "Chat", path: "/messages" },
  { icon: Menu, label: "More", path: "__more" },
];

const moreItems = [
  { icon: CheckSquare, label: "Execution", path: "/execution" },
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
  { icon: Shield, label: "Security", path: "/security" },
  { icon: Ticket, label: "Support", path: "/support" },
  { icon: ShieldCheck, label: "Admin", path: "/admin" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const MobileNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const handleNav = (path: string) => {
    if (path === "__more") {
      setMoreOpen(!moreOpen);
      return;
    }
    setMoreOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* More menu overlay */}
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-20 left-2 right-2 z-50 glass-card-strong rounded-2xl p-4 max-h-[60vh] overflow-y-auto"
          >
            <div className="grid grid-cols-4 gap-3">
              {moreItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <motion.button
                    key={item.path}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleNav(item.path)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors",
                      isActive ? "bg-accent/10 text-accent" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom bar */}
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass-card-strong border-t border-border/50 safe-area-bottom"
      >
        <div className="flex items-center justify-around px-2 pt-2 pb-1">
          {mainTabs.map((tab) => {
            const isActive = tab.path === "__more" ? moreOpen : location.pathname === tab.path;
            return (
              <motion.button
                key={tab.path}
                whileTap={{ scale: 0.85 }}
                onClick={() => handleNav(tab.path)}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl relative transition-colors min-w-[56px]",
                  isActive ? "text-accent" : "text-muted-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobile-tab-indicator"
                    className="absolute -top-1 w-8 h-1 rounded-full bg-accent"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                {tab.path === "__more" && moreOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <tab.icon className="w-5 h-5" />
                )}
                <span className="text-[10px] font-medium">{tab.label}</span>
              </motion.button>
            );
          })}
        </div>
      </motion.nav>
    </>
  );
};

export default MobileNav;
