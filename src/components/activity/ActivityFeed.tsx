import { useEffect, useState } from "react";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileNames } from "@/hooks/useProfileNames";
import { supabase } from "@/integrations/supabase/client";
import { Activity, LogIn, LogOut, CalendarDays, UserPlus, Building2, CheckSquare, MessageSquare, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

const actionIcons: Record<string, React.ElementType> = {
  clock_in: LogIn,
  clock_out: LogOut,
  leave_requested: CalendarDays,
  user_joined: UserPlus,
  org_created: Building2,
  task_created: CheckSquare,
  task_status_changed: CheckSquare,
  project_created: FileText,
  message_sent: MessageSquare,
};

const actionLabels: Record<string, string> = {
  clock_in: "clocked in",
  clock_out: "clocked out",
  leave_requested: "requested leave",
  user_joined: "joined the organization",
  org_created: "created the organization",
  task_created: "created a task",
  task_status_changed: "updated task status",
  project_created: "created a project",
  message_sent: "sent a message",
};

interface ActivityFeedProps {
  scope?: "personal" | "organization";
  limit?: number;
}

const ActivityFeed = ({ scope = "organization", limit = 25 }: ActivityFeedProps) => {
  const { user } = useAuth();
  const { org } = useOrganization();
  const { resolve, getName } = useProfileNames();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !org) return;

    const fetchLogs = async () => {
      let query = supabase
        .from("activity_logs")
        .select("*")
        .eq("organization_id", org.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (scope === "personal") {
        query = query.eq("user_id", user.id);
      }

      const { data } = await query;
      setLogs(data || []);

      // Resolve user names
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(l => l.user_id))];
        await resolve(userIds);
      }
      setLoading(false);
    };
    fetchLogs();
  }, [user, org, scope, limit]);

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-6 animate-pulse">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-muted rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <Activity className="w-4 h-4 text-muted-foreground" />
        <h4 className="text-sm font-semibold text-foreground">
          {scope === "personal" ? "Your Activity" : "Organization Activity"}
        </h4>
      </div>
      <div className="divide-y divide-border max-h-80 overflow-y-auto">
        {logs.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground text-center">No activity recorded yet</p>
        ) : (
          <AnimatePresence initial={false}>
            {logs.map((log, i) => {
              const Icon = actionIcons[log.action] || Activity;
              const label = actionLabels[log.action] || log.action;

              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0, transition: { delay: i * 0.02 } }}
                  className="flex items-start gap-3 p-3 px-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center mt-0.5 shrink-0">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{getName(log.user_id)}</span>{" "}
                      <span className="text-muted-foreground">{label}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
