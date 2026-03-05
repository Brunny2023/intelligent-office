import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, startOfDay, differenceInBusinessDays } from "date-fns";

export interface StaffMetrics {
  tasksCompleted: number;
  tasksTotal: number;
  taskCompletionRate: number;
  attendanceDays: number;
  workingDaysInMonth: number;
  attendanceRate: number;
  avgClockInTime: string;
  leavesTaken: number;
  pendingTasks: number;
  overdueTasks: number;
}

export const useStaffMetrics = (userId?: string) => {
  const { user } = useAuth();
  const { org } = useOrganization();
  const [metrics, setMetrics] = useState<StaffMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const targetUserId = userId || user?.id;

  useEffect(() => {
    if (!targetUserId || !org) return;

    const compute = async () => {
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const today = startOfDay(now);

      // Tasks
      const { data: tasks } = await supabase
        .from("tasks")
        .select("id, status, due_date, completed_at")
        .eq("organization_id", org.id)
        .eq("assigned_to", targetUserId);

      const allTasks = tasks || [];
      const completed = allTasks.filter(t => t.status === "completed");
      const pending = allTasks.filter(t => !["completed", "blocked"].includes(t.status));
      const overdue = pending.filter(t => t.due_date && new Date(t.due_date) < today);

      // Attendance this month
      const { data: attendance } = await supabase
        .from("attendance_records")
        .select("clock_in")
        .eq("organization_id", org.id)
        .eq("user_id", targetUserId)
        .gte("clock_in", monthStart.toISOString())
        .lte("clock_in", monthEnd.toISOString());

      const attendanceDays = new Set((attendance || []).map(a => new Date(a.clock_in).toDateString())).size;
      const workingDays = differenceInBusinessDays(now > monthEnd ? monthEnd : now, monthStart) + 1;

      // Avg clock in
      const clockIns = (attendance || []).map(a => {
        const d = new Date(a.clock_in);
        return d.getHours() * 60 + d.getMinutes();
      });
      const avgMinutes = clockIns.length > 0 ? Math.round(clockIns.reduce((a, b) => a + b, 0) / clockIns.length) : 0;
      const avgH = Math.floor(avgMinutes / 60);
      const avgM = avgMinutes % 60;

      // Leaves
      const { count: leaveCount } = await supabase
        .from("leave_requests")
        .select("id", { count: "exact", head: true })
        .eq("user_id", targetUserId)
        .eq("status", "approved")
        .gte("start_date", monthStart.toISOString().split("T")[0]);

      setMetrics({
        tasksCompleted: completed.length,
        tasksTotal: allTasks.length,
        taskCompletionRate: allTasks.length > 0 ? Math.round((completed.length / allTasks.length) * 100) : 0,
        attendanceDays,
        workingDaysInMonth: workingDays,
        attendanceRate: workingDays > 0 ? Math.round((attendanceDays / workingDays) * 100) : 0,
        avgClockInTime: clockIns.length > 0 ? `${avgH.toString().padStart(2, "0")}:${avgM.toString().padStart(2, "0")}` : "—",
        leavesTaken: leaveCount || 0,
        pendingTasks: pending.length,
        overdueTasks: overdue.length,
      });
      setLoading(false);
    };
    compute();
  }, [targetUserId, org]);

  return { metrics, loading };
};
