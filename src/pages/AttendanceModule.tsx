import { useState } from "react";
import { useOrganization } from "@/hooks/useOrganization";
import ClockInWidget from "@/components/attendance/ClockInWidget";
import AttendanceDashboard from "@/components/attendance/AttendanceDashboard";
import LeaveRequestForm from "@/components/attendance/LeaveRequestForm";
import LeaveRequestsList from "@/components/attendance/LeaveRequestsList";
import AppLayout from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/dashboard/kit";
import { motion } from "framer-motion";
import { CalendarClock } from "lucide-react";

const AttendanceModule = () => {
  const { loading } = useOrganization();
  const [leaveRefresh, setLeaveRefresh] = useState(0);

  if (loading) {
    return (
      <AppLayout title="Attendance">
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Attendance">
      <div className="p-6 md:p-8 space-y-6">
        <PageHeader
          eyebrow="Workforce"
          icon={CalendarClock}
          title="Attendance & Presence"
          subtitle="Manage your workforce presence and leave requests"
        />

        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
            className="space-y-6"
          >
            <ClockInWidget />
            <AttendanceDashboard />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
            className="space-y-6"
          >
            <LeaveRequestForm onSuccess={() => setLeaveRefresh((r) => r + 1)} />
            <LeaveRequestsList refreshKey={leaveRefresh} />
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
};

export default AttendanceModule;
