import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  approved: "bg-green-500/10 text-green-600 border-green-500/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  cancelled: "bg-muted text-muted-foreground border-border",
};

const LeaveRequestsList = ({ refreshKey }: { refreshKey?: number }) => {
  const { user } = useAuth();
  const { org } = useOrganization();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !org) return;

    const fetch = async () => {
      const { data } = await supabase
        .from("leave_requests")
        .select("*")
        .eq("organization_id", org.id)
        .order("created_at", { ascending: false })
        .limit(20);

      setRequests(data || []);
      setLoading(false);
    };
    fetch();
  }, [user, org, refreshKey]);

  if (loading) {
    return <div className="glass-card rounded-xl p-6 animate-pulse"><div className="h-20 bg-muted rounded" /></div>;
  }

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border">
        <h4 className="text-sm font-semibold text-foreground">Leave Requests</h4>
      </div>
      <div className="divide-y divide-border max-h-72 overflow-y-auto">
        {requests.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground text-center">No leave requests yet</p>
        ) : (
          requests.map((req) => (
            <div key={req.id} className="p-3 px-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground capitalize">
                  {req.leave_type.replace("_", " ")} Leave
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(req.start_date), "MMM d")} — {format(new Date(req.end_date), "MMM d, yyyy")}
                </p>
              </div>
              <Badge variant="outline" className={statusColors[req.status] || ""}>
                {req.status}
              </Badge>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LeaveRequestsList;
