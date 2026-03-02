import { useState } from "react";
import { useOrganization } from "@/hooks/useOrganization";
import ClockInWidget from "@/components/attendance/ClockInWidget";
import AttendanceDashboard from "@/components/attendance/AttendanceDashboard";
import LeaveRequestForm from "@/components/attendance/LeaveRequestForm";
import LeaveRequestsList from "@/components/attendance/LeaveRequestsList";
import AppLayout from "@/components/layout/AppLayout";
import { motion } from "framer-motion";

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
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">Attendance & Presence</h1>
          <p className="text-muted-foreground mt-1">Manage your workforce presence and leave requests</p>
        </motion.div>

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
