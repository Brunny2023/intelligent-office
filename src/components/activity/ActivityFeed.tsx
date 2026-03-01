import { useEffect, useState } from "react";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Activity, LogIn, LogOut, CalendarDays, UserPlus, Building2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

const actionIcons: Record<string, React.ElementType> = {
  clock_in: LogIn,
  clock_out: LogOut,
  leave_requested: CalendarDays,
  user_joined: UserPlus,
  org_created: Building2,
};

const actionLabels: Record<string, string> = {
  clock_in: "clocked in",
  clock_out: "clocked out",
  leave_requested: "requested leave",
  user_joined: "joined the organization",
  org_created: "created the organization",
};

interface ActivityFeedProps {
  scope?: "personal" | "organization";
  limit?: number;
}

const ActivityFeed = ({ scope = "organization", limit = 25 }: ActivityFeedProps) => {
  const { user } = useAuth();
  const { org } = useOrganization();
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
          logs.map((log) => {
            const Icon = actionIcons[log.action] || Activity;
            const label = actionLabels[log.action] || log.action;

            return (
              <div key={log.id} className="flex items-start gap-3 p-3 px-4">
                <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center mt-0.5 shrink-0">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{log.user_id.slice(0, 8)}…</span>{" "}
                    <span className="text-muted-foreground">{label}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
