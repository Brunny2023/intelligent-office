import { useStaffMetrics } from "@/hooks/useStaffMetrics";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import {
  CheckSquare, Clock, CalendarDays, AlertTriangle,
  TrendingUp, Target
} from "lucide-react";

const PerformanceWidget = () => {
  const { metrics, loading } = useStaffMetrics();

  if (loading || !metrics) {
    return (
      <div className="glass-card-strong rounded-2xl p-6 animate-pulse">
        <div className="h-40 bg-muted rounded" />
      </div>
    );
  }

  const items = [
    {
      label: "Task Completion",
      value: `${metrics.taskCompletionRate}%`,
      sub: `${metrics.tasksCompleted}/${metrics.tasksTotal} tasks`,
      progress: metrics.taskCompletionRate,
      icon: CheckSquare,
      color: "text-green-500",
    },
    {
      label: "Attendance Rate",
      value: `${metrics.attendanceRate}%`,
      sub: `${metrics.attendanceDays}/${metrics.workingDaysInMonth} days`,
      progress: metrics.attendanceRate,
      icon: CalendarDays,
      color: "text-svo-blue",
    },
    {
      label: "Avg Clock-in",
      value: metrics.avgClockInTime,
      sub: "This month",
      icon: Clock,
      color: "text-svo-gold",
    },
    {
      label: "Pending Tasks",
      value: metrics.pendingTasks.toString(),
      sub: `${metrics.overdueTasks} overdue`,
      icon: metrics.overdueTasks > 0 ? AlertTriangle : Target,
      color: metrics.overdueTasks > 0 ? "text-destructive" : "text-muted-foreground",
    },
  ];

  return (
    <div className="glass-card-strong rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-accent" />
        <h3 className="font-semibold text-foreground">Your Performance</h3>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {items.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.1 + i * 0.05 } }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2">
              <item.icon className={`w-4 h-4 ${item.color}`} />
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
            <p className="text-xl font-bold text-foreground">{item.value}</p>
            <p className="text-[10px] text-muted-foreground">{item.sub}</p>
            {"progress" in item && item.progress !== undefined && (
              <Progress value={item.progress} className="h-1.5" />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PerformanceWidget;
