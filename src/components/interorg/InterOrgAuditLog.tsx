import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";
import { ShieldCheck, Share2, FileText, XCircle, ScrollText } from "lucide-react";

interface Props { orgId: string }

const eventMeta: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  consent_granted:   { label: "Consent granted",   icon: Share2,     color: "text-green-600" },
  consent_revoked:   { label: "Consent revoked",   icon: XCircle,    color: "text-destructive" },
  memo_sealed:       { label: "Memo sealed",       icon: ShieldCheck, color: "text-accent" },
  memo_verified:     { label: "Memo verified",     icon: ShieldCheck, color: "text-svo-blue" },
  document_shared:   { label: "Document shared",   icon: FileText,   color: "text-svo-blue" },
  document_unshared: { label: "Document unshared", icon: XCircle,    color: "text-destructive" },
};

export default function InterOrgAuditLog({ orgId }: Props) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [actors, setActors] = useState<Record<string, string>>({});
  const [orgs, setOrgs] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("inter_org_audit_log" as any)
        .select("*").order("occurred_at", { ascending: false }).limit(300);
      const items = (data ?? []) as any[];
      setRows(items);
      const orgIds = new Set<string>();
      const actorIds = new Set<string>();
      items.forEach(r => {
        if (r.owner_org_id) orgIds.add(r.owner_org_id);
        if (r.partner_org_id) orgIds.add(r.partner_org_id);
        if (r.actor_id) actorIds.add(r.actor_id);
      });
      if (orgIds.size) {
        const { data: os } = await supabase.from("organizations").select("id, name").in("id", Array.from(orgIds));
        setOrgs(Object.fromEntries((os ?? []).map((o: any) => [o.id, o.name])));
      }
      if (actorIds.size) {
        const { data: ppl } = await supabase.from("profiles").select("id, full_name").in("id", Array.from(actorIds));
        setActors(Object.fromEntries((ppl ?? []).map((a: any) => [a.id, a.full_name])));
      }
      setLoading(false);
    })();
  }, [orgId]);

  const filtered = useMemo(() => rows.filter(r => {
    if (typeFilter !== "all" && r.event_type !== typeFilter) return false;
    if (q) {
      const hay = `${eventMeta[r.event_type]?.label ?? r.event_type} ${orgs[r.owner_org_id] ?? ""} ${orgs[r.partner_org_id] ?? ""} ${actors[r.actor_id] ?? ""}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  }), [rows, typeFilter, q, orgs, actors]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <ScrollText className="w-4 h-4 text-accent" />
        <h3 className="font-semibold text-foreground text-sm">Inter-org audit log</h3>
        <div className="ml-auto flex items-center gap-2">
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search..." className="h-8 rounded-xl w-40 text-xs" />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-8 rounded-xl w-44 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All events</SelectItem>
              {Object.entries(eventMeta).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center text-sm text-muted-foreground">No matching events yet.</div>
      ) : (
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {filtered.map(r => {
            const m = eventMeta[r.event_type] ?? { label: r.event_type, icon: ScrollText, color: "text-muted-foreground" };
            const Icon = m.icon;
            const isOwner = r.owner_org_id === orgId;
            const counterparty = isOwner ? orgs[r.partner_org_id] : orgs[r.owner_org_id];
            return (
              <div key={r.id} className="glass-card rounded-xl p-3 flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg bg-muted flex items-center justify-center ${m.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{m.label}</span>
                    <Badge variant="outline" className="text-[10px]">{r.resource_type ?? "-"}</Badge>
                    <Badge variant="outline" className={`text-[10px] ${isOwner ? "text-svo-blue" : "text-accent"}`}>{isOwner ? "outbound" : "inbound"}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {actors[r.actor_id] ?? "System"} - {counterparty ?? "-"} - {formatDistanceToNow(new Date(r.occurred_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}