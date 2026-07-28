import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface EgressRow {
  id: string; egress_id: string | null; egress_status: string | null; egress_error: string | null;
  egress_started_at: string | null; egress_ended_at: string | null; duration_seconds: number | null;
  organization_id: string; organizations?: { name: string } | null;
}
interface EventRow {
  id: string; event_type: string; status: string | null; error: string | null;
  created_at: string; egress_id: string | null; organization_id: string | null;
  organizations?: { name: string } | null;
}

export default function EgressHealthPanel() {
  const [rows, setRows] = useState<EgressRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: r }, { data: e }] = await Promise.all([
        supabase.from("meeting_recordings")
          .select("id, egress_id, egress_status, egress_error, egress_started_at, egress_ended_at, duration_seconds, organization_id, organizations(name)")
          .eq("source", "egress")
          .order("egress_started_at", { ascending: false }).limit(50),
        supabase.from("egress_events")
          .select("id, event_type, status, error, created_at, egress_id, organization_id, organizations(name)")
          .in("event_type", ["start_failed", "egress_updated", "egress_ended"])
          .order("created_at", { ascending: false }).limit(50),
      ]);
      setRows((r as unknown as EgressRow[]) ?? []);
      setEvents((e as unknown as EventRow[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const failed = rows.filter(r => r.egress_status === "failed" || r.egress_status === "aborted").length;
  const active = rows.filter(r => r.egress_status === "active" || r.egress_status === "starting").length;
  const stuck = rows.filter(r => (r.egress_status === "active" || r.egress_status === "starting")
    && r.egress_started_at && (Date.now() - new Date(r.egress_started_at).getTime() > 2 * 60 * 60 * 1000)).length;

  const statusColor = (s: string | null) => {
    if (s === "complete") return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    if (s === "failed" || s === "aborted") return "bg-red-500/10 text-red-600 border-red-500/20";
    if (s === "active" || s === "starting" || s === "ending") return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    return "bg-muted text-muted-foreground";
  };

  if (loading) return <div className="text-sm text-muted-foreground">Loading egress health…</div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Loader2 className="w-5 h-5 text-blue-500" /><div><div className="text-2xl font-bold">{active}</div><div className="text-xs text-muted-foreground">Active recordings</div></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><AlertCircle className="w-5 h-5 text-red-500" /><div><div className="text-2xl font-bold">{failed}</div><div className="text-xs text-muted-foreground">Failed (recent 50)</div></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><AlertCircle className={`w-5 h-5 ${stuck ? "text-amber-500" : "text-emerald-500"}`} /><div><div className="text-2xl font-bold">{stuck}</div><div className="text-xs text-muted-foreground">Stuck &gt; 2h</div></div></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Recent Egress Jobs</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {rows.length === 0 && <div className="text-sm text-muted-foreground">No server-side recordings yet.</div>}
          {rows.map(r => (
            <div key={r.id} className="flex items-center justify-between gap-2 text-sm border-b border-border/50 pb-2 last:border-0">
              <div className="min-w-0">
                <div className="font-medium truncate">{r.organizations?.name ?? r.organization_id}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {r.egress_id ?? "—"} · {r.egress_started_at ? formatDistanceToNow(new Date(r.egress_started_at), { addSuffix: true }) : "no start"}
                  {r.duration_seconds ? ` · ${Math.round(r.duration_seconds / 60)}m` : ""}
                </div>
                {r.egress_error && <div className="text-xs text-red-600 truncate mt-0.5">{r.egress_error}</div>}
              </div>
              <Badge variant="outline" className={statusColor(r.egress_status)}>{r.egress_status ?? "unknown"}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Lifecycle Events</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {events.length === 0 && <div className="text-sm text-muted-foreground">No events.</div>}
          {events.map(e => (
            <div key={e.id} className="flex items-center justify-between gap-2 text-sm border-b border-border/50 pb-2 last:border-0">
              <div className="min-w-0">
                <div className="font-medium truncate flex items-center gap-2">
                  {e.event_type === "start_failed" || e.status === "failed" || e.status === "aborted"
                    ? <AlertCircle className="w-4 h-4 text-red-500" />
                    : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  {e.event_type} · {e.organizations?.name ?? e.organization_id ?? "—"}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}
                  {e.egress_id ? ` · ${e.egress_id}` : ""}
                </div>
                {e.error && <div className="text-xs text-red-600 truncate mt-0.5">{e.error}</div>}
              </div>
              <Badge variant="outline" className={statusColor(e.status)}>{e.status ?? e.event_type}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}