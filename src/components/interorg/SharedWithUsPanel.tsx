import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Inbox, Sparkles, Target } from "lucide-react";

interface Props { myOrgId: string; partnerOrgId: string }

/**
 * Consumer for org_share_consents: shows the KPIs / AI insights the partner
 * org has explicitly granted our org read access to. RLS on kpis / ai_insights
 * is extended with has_share_consent(), so plain SELECTs return them.
 */
export default function SharedWithUsPanel({ myOrgId, partnerOrgId }: Props) {
  const [items, setItems] = useState<{ id: string; type: "kpi" | "insight"; title: string; body?: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: consents } = await supabase
      .from("org_share_consents" as any)
      .select("share_type, resource_id")
      .eq("owner_org_id", partnerOrgId)
      .eq("partner_org_id", myOrgId)
      .eq("status", "active");
    const rows = (consents ?? []) as any[];
    const kpiIds = rows.filter(r => r.share_type === "kpi").map(r => r.resource_id);
    const insIds = rows.filter(r => r.share_type === "insight").map(r => r.resource_id);
    const [k, i] = await Promise.all([
      kpiIds.length ? supabase.from("kpis").select("id, title, current_value, target_value, unit").in("id", kpiIds) : Promise.resolve({ data: [] as any[] }),
      insIds.length ? supabase.from("ai_insights").select("id, title, content, severity").in("id", insIds) : Promise.resolve({ data: [] as any[] }),
    ]);
    const merged = [
      ...((k.data ?? []) as any[]).map(r => ({ id: r.id, type: "kpi" as const, title: r.title, body: `${r.current_value ?? 0}${r.unit ? " " + r.unit : ""} / ${r.target_value ?? "—"}` })),
      ...((i.data ?? []) as any[]).map(r => ({ id: r.id, type: "insight" as const, title: r.title, body: r.content })),
    ];
    setItems(merged);
    setLoading(false);
  };

  useEffect(() => { load(); }, [myOrgId, partnerOrgId]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline" className="rounded-xl text-xs relative">
          <Inbox className="w-3.5 h-3.5 mr-1" /> Shared with us
          {items.length > 0 && (
            <span className="ml-1.5 text-[10px] font-semibold text-accent">{items.length}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 rounded-2xl p-3">
        <p className="text-xs font-semibold text-foreground mb-2">Intelligence shared by partner</p>
        {loading ? (
          <p className="text-xs text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nothing shared yet. Ask them to grant access.</p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {items.map(it => (
              <div key={`${it.type}:${it.id}`} className="p-2 rounded-xl border border-border">
                <div className="flex items-center gap-1.5 mb-0.5">
                  {it.type === "kpi" ? <Target className="w-3 h-3 text-svo-blue" /> : <Sparkles className="w-3 h-3 text-accent" />}
                  <Badge variant="outline" className="text-[9px] uppercase">{it.type}</Badge>
                  <span className="text-xs font-medium text-foreground truncate">{it.title}</span>
                </div>
                {it.body && <p className="text-[11px] text-muted-foreground line-clamp-2 whitespace-pre-wrap">{it.body}</p>}
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}