import { useOrganization } from "@/hooks/useOrganization";
import ActivityFeed from "@/components/activity/ActivityFeed";
import AppLayout from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/dashboard/kit";
import { motion } from "framer-motion";
import { ScrollText } from "lucide-react";

const ActivityModule = () => {
  const { loading } = useOrganization();

  if (loading) {
    return (
      <AppLayout title="Activity">
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Activity">
      <div className="p-6 md:p-8 space-y-6">
        <PageHeader
          eyebrow="Audit Trail"
          icon={ScrollText}
          title="Activity Log"
          subtitle="Track all operations across your organization"
        />

        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
          >
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Your Activity</h2>
            <ActivityFeed scope="personal" limit={30} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
          >
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Organization Feed</h2>
            <ActivityFeed scope="organization" limit={30} />
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ActivityModule;
