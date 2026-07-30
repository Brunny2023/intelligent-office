import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { Download, ShieldAlert, KeyRound, Search, FileText } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import jsPDF from "jspdf";

type Event = {
  id: string;
  organization_id: string | null;
  access_code: string | null;
  event_type: string;
  actor_id: string | null;
  role: string | null;
  fingerprint: string | null;
  user_agent: string | null;
  success: boolean;
  detail: any;
  created_at: string;
};

const EVENT_LABELS: Record<string, string> = {
  generated: "Token generated",
  revoked: "Token revoked",
  verified: "Token verified",
  redeemed: "Token redeemed",
  verify_failed: "Failed verification",
  redeem_failed: "Failed join attempt",
};

const AccessTokenAudit = ({ organizationId, memberNames }: { organizationId?: string; memberNames: Record<string, string> }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [outcome, setOutcome] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    if (!organizationId) return;
    setLoading(true);
    supabase
      .from("access_token_events")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(1000)
      .then(({ data, error }) => {
        if (error) toast.error(error.message);
        setEvents((data as Event[]) || []);
        setLoading(false);
      });
  }, [organizationId]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return events.filter((e) => {
      if (type !== "all" && e.event_type !== type) return false;
      if (outcome === "success" && !e.success) return false;
      if (outcome === "failure" && e.success) return false;
      if (from && new Date(e.created_at) < new Date(from)) return false;
      if (to && new Date(e.created_at) > new Date(`${to}T23:59:59`)) return false;
      if (!needle) return true;
      return [e.access_code, e.role, e.fingerprint, e.user_agent, memberNames[e.actor_id || ""], EVENT_LABELS[e.event_type]]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle));
    });
  }, [events, q, type, outcome, from, to, memberNames]);

  const failures = filtered.filter((e) => !e.success).length;

  const exportCsv = () => {
    const rows = [
      ["Timestamp", "Event", "Outcome", "Access code", "Role", "Actor", "Device", "User agent", "Detail"],
      ...filtered.map((e) => [
        new Date(e.created_at).toISOString(),
        EVENT_LABELS[e.event_type] || e.event_type,
        e.success ? "success" : "failure",
        e.access_code || "",
        e.role || "",
        memberNames[e.actor_id || ""] || e.actor_id || "anonymous",
        e.fingerprint || "",
        (e.user_agent || "").replace(/[",\n]/g, " "),
        JSON.stringify(e.detail || {}).replace(/[",\n]/g, " "),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `access-token-audit-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  const exportPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    let y = 56;
    doc.setFontSize(16).text("Access Token Audit Trail", 40, y);
    y += 18;
    doc.setFontSize(9).text(`Generated ${format(new Date(), "PPpp")} · ${filtered.length} events · ${failures} failed`, 40, y);
    y += 22;
    doc.setFontSize(8);
    filtered.slice(0, 400).forEach((e) => {
      if (y > 790) { doc.addPage(); y = 56; }
      const line = `${format(new Date(e.created_at), "yyyy-MM-dd HH:mm")}  ${(EVENT_LABELS[e.event_type] || e.event_type).padEnd(22)} ${(e.access_code || "—").padEnd(14)} ${(e.role || "—").padEnd(11)} ${e.success ? "OK " : "FAIL"}  ${memberNames[e.actor_id || ""] || "anonymous"}`;
      doc.text(line, 40, y);
      y += 12;
    });
    doc.save(`access-token-audit-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast.success("PDF exported");
  };

  return (
    <div className="space-y-3">
      <div className="glass-card rounded-xl p-4 flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 text-accent mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">
          Every token generation, revocation, verification, redemption and failed join attempt is recorded here.
          Repeated failures from the same device or against the same code trigger an automatic 15-minute lockout and
          alert owners and executives.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search code, role, actor, device…" className="pl-9 rounded-xl" />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All events</SelectItem>
            {Object.entries(EVENT_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={outcome} onValueChange={setOutcome}>
          <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any outcome</SelectItem>
            <SelectItem value="success">Successful</SelectItem>
            <SelectItem value="failure">Failed</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-xl" />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-xl" />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {filtered.length} event{filtered.length === 1 ? "" : "s"}{failures > 0 && ` · ${failures} failed`}
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="rounded-xl" onClick={exportCsv}><Download className="w-3.5 h-3.5 mr-1" /> CSV</Button>
          <Button size="sm" variant="outline" className="rounded-xl" onClick={exportPdf}><FileText className="w-3.5 h-3.5 mr-1" /> PDF</Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <KeyRound className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No audit events match these filters</p>
        </div>
      ) : (
        filtered.map((e, i) => (
          <motion.div key={e.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 12) * 0.02 } }}
            className="glass-card-strong rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-foreground">{EVENT_LABELS[e.event_type] || e.event_type}</span>
                {e.access_code && <span className="font-mono text-xs tracking-widest text-muted-foreground">{e.access_code}</span>}
                {e.role && <Badge variant="outline" className="text-[10px] capitalize">{e.role}</Badge>}
                <Badge variant="outline" className={e.success ? "bg-green-500/10 text-green-600 text-[10px]" : "bg-destructive/10 text-destructive text-[10px]"}>
                  {e.success ? "success" : "failed"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {memberNames[e.actor_id || ""] || (e.actor_id ? "Member" : "Anonymous visitor")}
                {e.fingerprint && ` · device ${e.fingerprint.slice(0, 8)}`}
                {e.detail?.reason && ` · ${String(e.detail.reason).replace(/_/g, " ")}`}
              </p>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">{format(new Date(e.created_at), "d MMM yyyy, HH:mm")}</span>
          </motion.div>
        ))
      )}
    </div>
  );
};

export default AccessTokenAudit;
