import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/dashboard/kit";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCheck, Circle, ExternalLink, Filter, Archive, ArchiveRestore, Search as SearchIcon, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Row = {
  id: string; title: string; message: string; type: string;
  link: string | null; is_read: boolean; created_at: string; archived_at: string | null;
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
  const [view, setView] = useState<"inbox" | "archived">("inbox");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Debounce search input to avoid slamming the backend on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => { setSearchDebounced(search.trim()); setPage(0); }, 250);
    return () => clearTimeout(t);
  }, [search]);

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
    if (view === "inbox") q = q.is("archived_at", null);
    else q = q.not("archived_at", "is", null);
    if (searchDebounced) {
      const s = searchDebounced.replace(/[,%]/g, " ");
      q = q.or(`title.ilike.%${s}%,message.ilike.%${s}%`);
    }
    if (dateFrom) q = q.gte("created_at", new Date(dateFrom).toISOString());
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      q = q.lte("created_at", end.toISOString());
    }
    const { data, count } = await q;
    setRows((data as Row[]) || []);
    setTotal(count || 0);
    setSelected(new Set());
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user, page, filter, readState, view, searchDebounced, dateFrom, dateTo]);

  const clearFilters = () => {
    setSearch(""); setDateFrom(""); setDateTo(""); setFilter("all"); setReadState("all"); setPage(0);
  };
  const hasActiveFilters = !!(searchDebounced || dateFrom || dateTo || filter !== "all" || readState !== "all");

  const toggleRead = async (r: Row) => {
    await supabase.from("notifications").update({ is_read: !r.is_read }).eq("id", r.id);
    setRows(prev => prev.map(x => x.id === r.id ? { ...x, is_read: !r.is_read } : x));
  };

  const markAllInboxRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true })
      .eq("user_id", user.id).eq("is_read", false).is("archived_at", null);
    toast.success("All inbox notifications marked read.");
    load();
  };

  const markFilterRead = async () => {
    if (!user) return;
    let q = supabase.from("notifications").update({ is_read: true } as any)
      .eq("user_id", user.id).eq("is_read", false);
    if (filter !== "all") q = q.eq("type", filter);
    if (view === "inbox") q = q.is("archived_at", null);
    else q = q.not("archived_at", "is", null);
    await q;
    toast.success("Marked matching notifications as read.");
    load();
  };

  const applyToSelected = async (patch: Partial<Row>) => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    await supabase.from("notifications").update(patch as any).in("id", ids);
    load();
  };

  const archiveSelected = () => applyToSelected({ archived_at: new Date().toISOString() as any });
  const restoreSelected = () => applyToSelected({ archived_at: null as any });
  const markSelectedRead = () => applyToSelected({ is_read: true });
  const markSelectedUnread = () => applyToSelected({ is_read: false });

  const toggleSelectAll = () => {
    if (selected.size === rows.length) setSelected(new Set());
    else setSelected(new Set(rows.map(r => r.id)));
  };
  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
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
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={markFilterRead} className="gap-1.5">
              <Filter className="w-4 h-4" /> Mark filter read
            </Button>
            <Button variant="outline" size="sm" onClick={markAllInboxRead} className="gap-1.5">
              <CheckCheck className="w-4 h-4" /> Mark all read
            </Button>
          </div>
        </header>

        <div className="glass-card rounded-xl p-3 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title or message…"
              className="h-9 pl-8 rounded-xl"
            />
          </div>
          <Filter className="w-4 h-4 text-muted-foreground ml-1" />
          <Select value={view} onValueChange={(v) => { setPage(0); setView(v as any); }}>
            <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="inbox">Inbox</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
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
          <label className="text-[11px] text-muted-foreground flex items-center gap-1">
            From
            <Input type="date" value={dateFrom} onChange={(e) => { setPage(0); setDateFrom(e.target.value); }} className="h-9 w-36 rounded-xl" />
          </label>
          <label className="text-[11px] text-muted-foreground flex items-center gap-1">
            To
            <Input type="date" value={dateTo} onChange={(e) => { setPage(0); setDateTo(e.target.value); }} className="h-9 w-36 rounded-xl" />
          </label>
          {hasActiveFilters && (
            <Button size="sm" variant="ghost" onClick={clearFilters} className="h-9 gap-1 text-xs">
              <X className="w-3.5 h-3.5" /> Clear
            </Button>
          )}
          <span className="text-xs text-muted-foreground ml-auto">{total} total</span>
        </div>

        {rows.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-2 flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 px-2 text-xs text-muted-foreground cursor-pointer">
              <Checkbox checked={selected.size > 0 && selected.size === rows.length} onCheckedChange={toggleSelectAll} />
              {selected.size > 0 ? `${selected.size} selected` : "Select all on page"}
            </label>
            {selected.size > 0 && (
              <>
                <Button size="sm" variant="outline" onClick={markSelectedRead} className="gap-1.5"><CheckCheck className="w-3.5 h-3.5" /> Read</Button>
                <Button size="sm" variant="outline" onClick={markSelectedUnread} className="gap-1.5"><Circle className="w-3.5 h-3.5" /> Unread</Button>
                {view === "inbox" ? (
                  <Button size="sm" variant="outline" onClick={archiveSelected} className="gap-1.5"><Archive className="w-3.5 h-3.5" /> Archive</Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={restoreSelected} className="gap-1.5"><ArchiveRestore className="w-3.5 h-3.5" /> Restore</Button>
                )}
              </>
            )}
          </div>
        )}

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
              <Checkbox className="mt-1" checked={selected.has(r.id)} onCheckedChange={() => toggleOne(r.id)} />
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
              <Button variant="ghost" size="sm" onClick={async () => {
                const nextArchived = r.archived_at ? null : new Date().toISOString();
                await supabase.from("notifications").update({ archived_at: nextArchived as any }).eq("id", r.id);
                load();
              }} className="gap-1 text-xs" title={r.archived_at ? "Restore" : "Archive"}>
                {r.archived_at ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
              </Button>
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