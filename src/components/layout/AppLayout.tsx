import { ReactNode } from "react";
import { motion } from "framer-motion";
import AppSidebar from "./AppSidebar";
import MobileNav from "./MobileNav";

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
    </div>
  );
};

export default AppLayout;
