import { ReactNode } from "react";
import { motion } from "framer-motion";
import AppSidebar from "./AppSidebar";
import MobileNav from "./MobileNav";
import AskLeadershipFAB from "@/components/cognition/AskLeadershipFAB";
import NotificationBell from "@/components/notifications/NotificationBell";

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

const AppLayout = ({ children, title }: { children: ReactNode; title?: string }) => {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden md:block">
        <AppSidebar />
      </div>
      <motion.main
        key={title}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="flex-1 overflow-auto pb-20 md:pb-0"
      >
        {children}
      </motion.main>
      <MobileNav />
      <AskLeadershipFAB />
      {/* Mobile-only floating notifications bell — desktop shows it in the sidebar. */}
      <div className="md:hidden fixed top-3 right-3 z-50 glass-card-strong rounded-full p-1 shadow-lg">
        <NotificationBell />
      </div>
    </div>
  );
};

export default AppLayout;
