import { useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { useProfileNames } from "@/hooks/useProfileNames";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { History, ArrowRight, Search as SearchIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";

type Event = {
  id: string;
  organization_id: string;
  memory_id: string | null;
  user_id: string;
  action: "boost" | "dampen" | "approve" | "reject" | "comment" | "delete";
  reason: string | null;
  prev_score: number | null;
  new_score: number | null;
  memory_title: string | null;
  created_at: string;
};

const ACTION_COLORS: Record<Event["action"], string> = {
  approve: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  reject: "bg-destructive/10 text-destructive border-destructive/30",
  boost: "bg-accent/10 text-accent border-accent/30",
  dampen: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  comment: "bg-muted text-muted-foreground border-border",
  delete: "bg-destructive/10 text-destructive border-destructive/30",
};

const PAGE_SIZE = 30;

export default function MemoryAuditModule() {
  const { org } = useOrganization();
  const { resolve, getName } = useProfileNames();
  const [events, setEvents] = useState<Event[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!org?.id) return;
    setLoading(true);
    let q = supabase.from("memory_feedback_events" as any).select("*", { count: "exact" })
      .eq("organization_id", org.id)
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
    if (actionFilter !== "all") q = q.eq("action", actionFilter);
    if (search.trim()) q = q.or(`memory_title.ilike.%${search.trim()}%,reason.ilike.%${search.trim()}%`);
    const { data, count } = await q;
    const rows = (data as unknown as Event[]) ?? [];
    setEvents(rows);
    setTotal(count || 0);
    setLoading(false);
    const ids = Array.from(new Set(rows.map(r => r.user_id)));
    if (ids.length) resolve(ids);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [org?.id, page, actionFilter]);

  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  return (
    <AppLayout title="Memory Audit">
      <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-4">
        <header className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <History className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Memory audit trail</h1>
            <p className="text-sm text-muted-foreground">
              Every boost, dampen, approve, reject, comment, and deletion of organizational memory —
              with who changed what, when, and how it shifted leadership's reasoning weight.
            </p>
          </div>
          <Link to="/cognition" className="text-xs text-accent hover:underline">Back to Cognition →</Link>
        </header>

        <div className="glass-card rounded-xl p-3 flex flex-wrap items-center gap-2">
          <SearchIcon className="w-4 h-4 text-muted-foreground ml-1" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { setPage(0); load(); } }}
            placeholder="Search memory title or reason…"
            className="h-9 rounded-xl border-0 bg-transparent focus-visible:ring-0 max-w-md"
          />
          <Button size="sm" variant="outline" className="rounded-xl" onClick={() => { setPage(0); load(); }}>Search</Button>
          <Select value={actionFilter} onValueChange={(v) => { setPage(0); setActionFilter(v); }}>
            <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              <SelectItem value="approve">Approve</SelectItem>
              <SelectItem value="reject">Reject</SelectItem>
              <SelectItem value="boost">Boost</SelectItem>
              <SelectItem value="dampen">Dampen</SelectItem>
              <SelectItem value="comment">Comment</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground ml-auto">{total} events</span>
        </div>

        <div className="rounded-xl border border-border divide-y divide-border/60 bg-card">
          {loading && events.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
          )}
          {!loading && events.length === 0 && (
            <div className="p-10 text-center text-sm text-muted-foreground">
              <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No memory feedback events yet.
            </div>
          )}
          {events.map((e) => {
            const delta = (typeof e.prev_score === "number" && typeof e.new_score === "number")
              ? e.new_score - e.prev_score : null;
            return (
              <div key={e.id} className="p-4 flex items-start gap-3">
                <Badge variant="outline" className={`text-[10px] capitalize ${ACTION_COLORS[e.action]}`}>{e.action}</Badge>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground truncate">
                      {e.memory_title || <span className="italic text-muted-foreground">Untitled memory</span>}
                    </span>
                    {typeof e.prev_score === "number" && typeof e.new_score === "number" && (
                      <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                        weight {e.prev_score.toFixed(1)} <ArrowRight className="w-3 h-3" /> {e.new_score.toFixed(1)}
                        {delta !== null && delta !== 0 && (
                          <span className={delta > 0 ? "text-emerald-500" : "text-amber-500"}>
                            ({delta > 0 ? "+" : ""}{delta.toFixed(1)})
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  {e.reason && (
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{e.reason}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground/70 mt-1">
                    {getName(e.user_id)} · {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Page {page + 1} of {pageCount}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page + 1 >= pageCount} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}