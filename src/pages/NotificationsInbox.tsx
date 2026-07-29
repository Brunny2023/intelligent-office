import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCheck, Circle, ExternalLink, Filter } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

type Row = {
  id: string; title: string; message: string; type: string;
  link: string | null; is_read: boolean; created_at: string;
};

const PAGE_SIZE = 20;

const TYPE_LABELS: Record<string, string> = {
  cognition: "Cognition finished",
  governance: "Policy blocked",
  escalation: "Insight escalation",
};

export default function NotificationsInbox() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<string>("all");
  const [readState, setReadState] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    let q = supabase.from("notifications").select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
    if (filter !== "all") q = q.eq("type", filter);
    if (readState === "unread") q = q.eq("is_read", false);
    if (readState === "read") q = q.eq("is_read", true);
    const { data, count } = await q;
    setRows((data as Row[]) || []);
    setTotal(count || 0);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user, page, filter, readState]);

  const toggleRead = async (r: Row) => {
    await supabase.from("notifications").update({ is_read: !r.is_read }).eq("id", r.id);
    setRows(prev => prev.map(x => x.id === r.id ? { ...x, is_read: !r.is_read } : x));
  };

  const markAll = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    load();
  };

  const open = (r: Row) => {
    if (!r.is_read) toggleRead(r);
    if (r.link) navigate(r.link);
  };

  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  return (
    <AppLayout title="Notifications">
      <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto space-y-4">
        <header className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
            <p className="text-sm text-muted-foreground">Every cognition and insight escalation event, with deep links back into context.</p>
          </div>
          <Button variant="outline" size="sm" onClick={markAll} className="gap-1.5">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </Button>
        </header>

        <div className="glass-card rounded-xl p-3 flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground ml-1" />
          <Select value={filter} onValueChange={(v) => { setPage(0); setFilter(v); }}>
            <SelectTrigger className="h-9 w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All event types</SelectItem>
              <SelectItem value="cognition">Cognition finished</SelectItem>
              <SelectItem value="governance">Policy blocked</SelectItem>
              <SelectItem value="escalation">Insight escalation</SelectItem>
            </SelectContent>
          </Select>
          <Select value={readState} onValueChange={(v) => { setPage(0); setReadState(v); }}>
            <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unread">Unread only</SelectItem>
              <SelectItem value="read">Read only</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground ml-auto">{total} total</span>
        </div>

        <div className="rounded-xl border border-border divide-y divide-border/60 bg-card">
          {loading && rows.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
          )}
          {!loading && rows.length === 0 && (
            <div className="p-10 text-center text-sm text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No notifications match these filters.
            </div>
          )}
          {rows.map((r) => (
            <div key={r.id} className={cn("flex items-start gap-3 p-4 hover:bg-muted/40 transition", !r.is_read && "bg-accent/5")}>
              <button
                aria-label={r.is_read ? "Mark unread" : "Mark read"}
                onClick={() => toggleRead(r)}
                className="mt-1 text-muted-foreground hover:text-accent"
              >
                <Circle className={cn("w-3 h-3", !r.is_read && "fill-accent text-accent")} />
              </button>
              <button onClick={() => open(r)} className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn("text-sm truncate", !r.is_read ? "font-semibold text-foreground" : "text-foreground/85")}>{r.title}</span>
                  <Badge variant="outline" className="text-[10px] capitalize">{TYPE_LABELS[r.type] ?? r.type}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.message}</p>
                <p className="text-[10px] text-muted-foreground/70 mt-1">
                  {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                </p>
              </button>
              {r.link && (
                <Button variant="ghost" size="sm" onClick={() => open(r)} className="gap-1 text-xs">
                  Open <ExternalLink className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))}
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