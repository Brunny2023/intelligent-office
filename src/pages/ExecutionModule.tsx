import { useState } from "react";
import { useOrganization } from "@/hooks/useOrganization";
import AppLayout from "@/components/layout/AppLayout";
import ProjectList from "@/components/execution/ProjectList";
import TaskBoard from "@/components/execution/TaskBoard";
import { motion, AnimatePresence } from "framer-motion";

const ExecutionModule = () => {
  const { loading } = useOrganization();
  const [selectedProject, setSelectedProject] = useState<any>(null);

  if (loading) {
    return (
      <AppLayout title="Execution">
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Execution">
      <div className="p-6 md:p-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">Execution Engine</h1>
          <p className="text-muted-foreground mt-1">Manage projects, tasks & workflows</p>
        </motion.div>

        <div className="grid lg:grid-cols-[320px_1fr] gap-4 md:gap-6">
          <div>
            <ProjectList
              onSelectProject={setSelectedProject}
              selectedProjectId={selectedProject?.id}
            />
          </div>
          <div>
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedProject?.id || "all"}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <TaskBoard projectId={selectedProject?.id} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ExecutionModule;
