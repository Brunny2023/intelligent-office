import { useEffect, useState } from "react";
import { useOrganization } from "@/hooks/useOrganization";
import { useProfileNames } from "@/hooks/useProfileNames";
import { supabase } from "@/integrations/supabase/client";
import { Users, UserCheck, Clock } from "lucide-react";
import { format, startOfDay, subDays } from "date-fns";
import { motion } from "framer-motion";
import { PersonAvatar, SectionCard, TrendChart } from "@/components/dashboard/kit";

interface AttendanceStat {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}

const AttendanceDashboard = () => {
  const { org } = useOrganization();
  const { resolve, getName, getAvatar } = useProfileNames();
  const [records, setRecords] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!org) return;

    const fetchToday = async () => {
      const todayStart = startOfDay(new Date()).toISOString();

      const { data } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("organization_id", org.id)
        .gte("clock_in", todayStart)
        .order("clock_in", { ascending: false });

      setRecords(data || []);

      const { data: hist } = await supabase
        .from("attendance_records")
        .select("clock_in, clock_out")
        .eq("organization_id", org.id)
        .gte("clock_in", startOfDay(subDays(new Date(), 13)).toISOString());
      setHistory(hist || []);
      if (data && data.length > 0) {
        await resolve([...new Set(data.map(r => r.user_id))]);
      }
      setLoading(false);
    };
    fetchToday();
  }, [org]);

  const presentCount = records.filter((r) => !r.clock_out).length;
  const completedCount = records.filter((r) => r.clock_out).length;
  const totalToday = records.length;

  const stats: AttendanceStat[] = [
    { label: "Checked In", value: presentCount, icon: UserCheck, color: "text-green-500 bg-green-500/10" },
    { label: "Completed", value: completedCount, icon: Clock, color: "text-svo-blue bg-svo-blue/10" },
    { label: "Total Today", value: totalToday, icon: Users, color: "text-svo-gold bg-svo-gold/10" },
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card rounded-xl p-4 animate-pulse">
              <div className="h-12 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const trend = Array.from({ length: 14 }, (_, idx) => {
    const day = startOfDay(subDays(new Date(), 13 - idx));
    const next = new Date(day.getTime() + 86400000);
    const rows = history.filter(r => {
      const t = new Date(r.clock_in);
      return t >= day && t < next;
    });
    return {
      label: format(day, "MMM d"),
      "clock-ins": rows.length,
      completed: rows.filter(r => r.clock_out).length,
    };
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Today's Attendance</h3>

      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05 } }}
            className="glass-card rounded-xl p-4"
          >
            <div className={`w-8 h-8 rounded-lg ${stat.color} flex items-center justify-center mb-2`}>
              <stat.icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <SectionCard title="Presence Trend — Last 14 Days" icon={Clock}>
        <TrendChart data={trend} dataKey="clock-ins" secondKey="completed" tone="emerald" secondTone="blue" height={170} />
      </SectionCard>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <h4 className="text-sm font-semibold text-foreground">Recent Activity</h4>
        </div>
        <div className="divide-y divide-border max-h-64 overflow-y-auto">
          {records.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">No attendance records today</p>
          ) : (
            records.map((rec) => (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between p-3 px-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <PersonAvatar name={getName(rec.user_id)} src={getAvatar(rec.user_id)} size={34} />
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-card ${rec.clock_out ? "bg-muted-foreground" : "bg-green-500 animate-pulse"}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{getName(rec.user_id)}</p>
                    <p className="text-[11px] text-muted-foreground">{rec.clock_out ? "Shift complete" : "On the clock"}</p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground text-right">
                  <span>In: {format(new Date(rec.clock_in), "HH:mm")}</span>
                  {rec.clock_out && (
                    <span className="ml-2">Out: {format(new Date(rec.clock_out), "HH:mm")}</span>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceDashboard;
